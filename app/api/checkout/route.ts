import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const { items, couponCode, shippingAddress, isGiftWrapped, giftMessage } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.pincode) {
      return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 });
    }

    // Strict input validation: reject missing product IDs, non-positive integer / null / negative quantities
    for (const item of items) {
      if (!item || typeof item !== 'object') {
        return NextResponse.json({ error: 'Invalid cart item payload' }, { status: 400 });
      }
      if (!item.productId || typeof item.productId !== 'string' || item.productId.trim() === '') {
        return NextResponse.json({ error: 'Missing or invalid productId in cart items' }, { status: 400 });
      }
      const qty = item.quantity;
      if (qty === null || qty === undefined || typeof qty !== 'number' || !Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for product "${item.productId}". Quantity must be a positive integer.` },
          { status: 400 }
        );
      }
    }

    // Step 1: Aggregate duplicate cart lines by productId before stock validation or reservation creation
    const aggregatedMap = new Map<string, number>();
    for (const item of items) {
      const pid = item.productId.trim();
      const current = aggregatedMap.get(pid) || 0;
      aggregatedMap.set(pid, current + item.quantity);
    }

    const uniqueProductIds = Array.from(aggregatedMap.keys());
    const supabase = createServerClient();

    // Step 2: Fetch real product prices and current stock from DB
    // Query 'stock' and 'reserved_quantity' (aligned to authoritative PostgreSQL schema)
    const { data: dbProducts, error: productsErr } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, stock, reserved_quantity, images, is_active')
      .in('id', uniqueProductIds);

    if (productsErr || !dbProducts) {
      return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 });
    }

    const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));
    const validatedItems: Array<{
      productId: string; productName: string; productImage: string;
      quantity: number; unitPrice: number; totalPrice: number;
    }> = [];

    for (const [productId, aggregatedQty] of aggregatedMap.entries()) {
      const product = productMap.get(productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 400 });
      }
      if (product.is_active === false) {
        return NextResponse.json({ error: `Product "${product.name}" is no longer available` }, { status: 400 });
      }

      // Validate available stock = stock - reserved_quantity
      const currentStock = Number(product.stock ?? 0);
      const reservedQty = Number(product.reserved_quantity ?? 0);
      const availableStock = currentStock - reservedQty;

      if (availableStock < aggregatedQty) {
        return NextResponse.json({
          error: `Insufficient stock for "${product.name}". Available: ${Math.max(0, availableStock)}`
        }, { status: 400 });
      }

      const images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productImage: images[0] || '/logo.png',
        quantity: aggregatedQty,
        unitPrice: Number(product.price),
        totalPrice: Number(product.price) * aggregatedQty,
      });
    }

    // Step 3: Calculate base totals server-side
    const subtotal = validatedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const shippingFee = subtotal >= 499 ? 0 : 60;
    const giftWrapFee = isGiftWrapped ? 30 : 0;
    const taxAmount = 0;

    // Step 4: Determine guest status and generate high-entropy guest tracking token if guest
    const isGuest = !user;
    let rawGuestToken: string | null = null;
    let versionedTrackingHash: string | null = null;
    let trackingExpiresAt: string | null = null;

    if (isGuest) {
      // 256 bits of high entropy
      rawGuestToken = crypto.randomBytes(32).toString('hex');
      const hmacSecret = process.env.GUEST_TRACKING_HMAC_SECRET_V1 || process.env.GUEST_TRACKING_HMAC_SECRET || 'rangaroo-default-dev-hmac-secret-v1';
      const hmacDigest = crypto.createHmac('sha256', hmacSecret).update(rawGuestToken).digest('hex');
      versionedTrackingHash = `v1:${hmacDigest}`;
      trackingExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    }

    const orderId = crypto.randomUUID();
    const orderNumber = `#${Date.now().toString().slice(-6)}`;

    // Step 5: Secure inventory holds via reserve_order_inventory RPC before external gateway / DB order creation
    const reservationPayload = validatedItems.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
    }));

    const { data: resData, error: resErr } = await supabase.rpc('reserve_order_inventory', {
      p_order_id: orderId,
      p_items: reservationPayload,
      p_duration_minutes: 15,
    });

    if (resErr || !resData?.success) {
      console.error('[Checkout] Inventory reservation failed:', resErr || resData);
      const errMsg = resErr?.message || resData?.message || 'Failed to secure inventory hold';
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    // Step 6: Store pending order in database to anchor subtotal and customer identity
    const customerEmail = shippingAddress.email || user?.email || null;
    let discountAmount = 0;
    let validatedCouponCode: string | null = null;
    const initialTotal = Math.max(1, subtotal + shippingFee + giftWrapFee + taxAmount);

    const { error: insertErr } = await supabase.from('orders').insert({
      id: orderId,
      order_number: orderNumber,
      status: 'pending',
      order_status: 'PENDING',
      payment_status: 'PENDING',
      subtotal,
      shipping_fee: shippingFee,
      gift_wrap_fee: giftWrapFee,
      tax_amount: taxAmount,
      discount_amount: 0,
      coupon_code: null,
      total: initialTotal,
      total_amount: initialTotal,
      customer_email: customerEmail,
      customer_name: shippingAddress.fullName || null,
      customer_phone: shippingAddress.phone || null,
      user_id: user?.id || null,
      is_guest: isGuest,
      tracking_token_hash: isGuest ? versionedTrackingHash : null,
      tracking_token_expires_at: isGuest ? trackingExpiresAt : null,
      shipping_address: JSON.stringify({ ...shippingAddress, isGiftWrapped: !!isGiftWrapped, giftMessage: giftMessage || '' }),
      items: JSON.stringify(validatedItems),
      created_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error('[Checkout] Order insert error:', insertErr);
      await supabase.rpc('cancel_order_and_restore_inventory', {
        p_order_id: orderId,
        p_reason: 'Database order insertion failed',
      });
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Step 7: Wire atomic coupon reservation via reserve_coupon_usage tied to persisted order
    if (couponCode && typeof couponCode === 'string' && couponCode.trim() !== '') {
      const codeToApply = couponCode.trim().toUpperCase();
      const { data: couponRes, error: couponErr } = await supabase.rpc('reserve_coupon_usage', {
        p_code: codeToApply,
        p_order_id: orderId,
        p_duration_minutes: 15,
      });

      if (couponErr || !couponRes?.success) {
        const errMsg = couponErr?.message || couponRes?.error || 'Invalid or inapplicable coupon';
        console.error('[Checkout] Coupon reservation failed:', errMsg);
        // Safely rollback inventory hold and delete uncommitted order
        await supabase.rpc('cancel_order_and_restore_inventory', {
          p_order_id: orderId,
          p_reason: `Coupon reservation failed: ${errMsg}`,
        });
        await supabase.from('orders').delete().eq('id', orderId);
        return NextResponse.json({ error: errMsg }, { status: 400 });
      }

      discountAmount = Number(couponRes.discount_amount || 0);
      validatedCouponCode = couponRes.code || codeToApply;

      // Update persisted order with authoritative coupon discount and recalculated total
      const updatedTotal = Math.max(1, subtotal + shippingFee + giftWrapFee + taxAmount - discountAmount);
      await supabase.from('orders').update({
        discount_amount: discountAmount,
        coupon_code: validatedCouponCode,
        total: updatedTotal,
        total_amount: updatedTotal,
      }).eq('id', orderId);
    }

    const finalTotal = Math.max(1, subtotal + shippingFee + giftWrapFee + taxAmount - discountAmount);

    // Step 8: Create Razorpay order with server-calculated final total
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      if (validatedCouponCode) {
        await supabase.rpc('release_coupon_usage', { p_order_id: orderId });
      }
      await supabase.rpc('cancel_order_and_restore_inventory', {
        p_order_id: orderId,
        p_reason: 'Payment gateway configuration missing',
      });
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(finalTotal * 100),
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      });
    } catch (rzpErr: any) {
      console.error('[Checkout] Razorpay error:', rzpErr);
      if (validatedCouponCode) {
        await supabase.rpc('release_coupon_usage', { p_order_id: orderId });
      }
      await supabase.rpc('cancel_order_and_restore_inventory', {
        p_order_id: orderId,
        p_reason: 'Razorpay order creation failed',
      });
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json({ error: 'Failed to initiate payment gateway order' }, { status: 500 });
    }

    // Step 9: Bind Razorpay order ID to persisted order
    await supabase.from('orders').update({
      razorpay_order_id: razorpayOrder.id,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      key: key_id,
      orderId,
      orderNumber,
      total: finalTotal,
      subtotal,
      shippingFee,
      giftWrapFee,
      discountAmount,
      amountInPaise: Math.round(finalTotal * 100),
      ...(isGuest && rawGuestToken ? { guestTrackingToken: rawGuestToken } : {}),
    });
  } catch (error: any) {
    console.error('[Checkout Error]', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}
