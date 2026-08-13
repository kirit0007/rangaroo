import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      console.error('Razorpay secret key is missing');
      return NextResponse.json(
        { success: false, error: 'Server configuration error.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment verification details.' },
        { status: 400 }
      );
    }

    // Verify HMAC SHA256 signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Razorpay signature mismatch');
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // ── Signature verified — now update order in database ──────────────
    const supabase = createServerClient();

    // Find the pending order by razorpay_order_id
    const { data: order, error: findErr } = await supabase
      .from('orders')
      .select('id, order_number, items, payment_status')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (findErr || !order) {
      console.error('[Verify] Order not found for razorpay_order_id:', razorpay_order_id);
      return NextResponse.json({
        success: false, error: 'Order not found. Please contact support.'
      }, { status: 404 });
    }

    // Prevent double-processing
    if (order.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        orderId: order.id,
        orderNumber: order.order_number,
        paymentId: razorpay_payment_id,
      });
    }

    // Update order status to confirmed + paid
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        razorpay_payment_id,
      })
      .eq('id', order.id);

    if (updateErr) {
      console.error('[Verify] Order update error:', updateErr);
    }

    // Decrement stock for each item
    const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    for (const item of orderItems) {
      const productId = item.productId || item.product_id;
      if (productId && item.quantity) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', productId)
          .single();

        if (product && product.stock_quantity !== null) {
          const newStock = Math.max(0, product.stock_quantity - item.quantity);
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', productId);
        }
      }
    }

    // Trigger confirmation email (fire-and-forget)
    try {
      const { data: fullOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .single();

      if (fullOrder) {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://rangaroo.store'}/api/email/order-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: fullOrder,
            customerEmail: fullOrder.customer_email,
          }),
        }).catch(err => console.warn('[Verify] Email trigger failed:', err));
      }
    } catch (emailErr) {
      console.warn('[Verify] Email error (non-fatal):', emailErr);
    }

    revalidatePath('/orders');
    revalidatePath('/admin/orders');

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed',
      orderId: order.id,
      orderNumber: order.order_number,
      paymentId: razorpay_payment_id,
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}

