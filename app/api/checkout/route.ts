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

    const supabase = createServerClient();

    // Step 1: Fetch real product prices from DB
    const productIds = items.map((item: any) => item.productId);
    const { data: dbProducts, error: productsErr } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, stock_quantity, images, is_active')
      .in('id', productIds);

    if (productsErr || !dbProducts) {
      return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 });
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));
    const validatedItems: Array<{
      productId: string; productName: string; productImage: string;
      quantity: number; unitPrice: number; totalPrice: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      if (product.is_active === false) {
        return NextResponse.json({ error: `Product "${product.name}" is no longer available` }, { status: 400 });
      }
      const requestedQty = Math.max(1, Math.min(10, Number(item.quantity) || 1));

      // Step 2: Validate stock
      if (product.stock_quantity !== null && product.stock_quantity < requestedQty) {
        return NextResponse.json({ error: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}` }, { status: 400 });
      }

      const images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
      validatedItems.push({
        productId: product.id, productName: product.name,
        productImage: images[0] || '/logo.png', quantity: requestedQty,
        unitPrice: Number(product.price), totalPrice: Number(product.price) * requestedQty,
      });
    }

    // Step 3: Calculate totals server-side
    const subtotal = validatedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const shippingFee = subtotal >= 499 ? 0 : 60;
    const giftWrapFee = isGiftWrapped ? 30 : 0;
    const taxAmount = 0;

    // Step 4: Validate and apply coupon server-side
    let discountAmount = 0;
    let validatedCouponCode: string | null = null;
    if (couponCode && typeof couponCode === 'string') {
      const { data: coupon } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase()).single();
      if (coupon) {
        const minOrder = Number(coupon.min_order_amount || 0);
        if (subtotal >= minOrder) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = subtotal * (Number(coupon.discount_value) / 100);
            if (coupon.max_discount_amount) discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
          } else {
            discountAmount = Number(coupon.discount_value);
          }
          discountAmount = Math.round(discountAmount * 100) / 100;
          validatedCouponCode = couponCode.toUpperCase();
        }
      }
    }

    const total = Math.max(1, subtotal + shippingFee + giftWrapFee + taxAmount - discountAmount);

    // Step 5: Create Razorpay order with server-calculated amount
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }
    const razorpay = new Razorpay({ key_id, key_secret });
    const razorpayOrder = await razorpay.orders.create({ amount: Math.round(total * 100), currency: 'INR', receipt: `rcpt_${Date.now()}` });

    // Step 6: Store pending order in database with UUID
    const orderId = crypto.randomUUID();
    const orderNumber = `#${Date.now().toString().slice(-6)}`;
    const { error: insertErr } = await supabase.from('orders').insert({
      id: orderId, order_number: orderNumber, status: 'pending', payment_status: 'pending',
      subtotal, shipping_fee: shippingFee, gift_wrap_fee: giftWrapFee, tax_amount: taxAmount,
      discount_amount: discountAmount, coupon_code: validatedCouponCode, total,
      customer_email: shippingAddress.email || user?.email || null, user_id: user?.id || null,
      razorpay_order_id: razorpayOrder.id,
      shipping_address: JSON.stringify({ ...shippingAddress, isGiftWrapped: !!isGiftWrapped, giftMessage: giftMessage || '' }),
      items: JSON.stringify(validatedItems), created_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error('[Checkout] Order insert error:', insertErr);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    return NextResponse.json({
      success: true, razorpayOrderId: razorpayOrder.id, key: key_id,
      orderId, orderNumber, total, subtotal, shippingFee, giftWrapFee, discountAmount, amountInPaise: Math.round(total * 100),
    });
  } catch (error: any) {
    console.error('[Checkout Error]', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}
