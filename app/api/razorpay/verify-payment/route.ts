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

    const genSigBuf = Buffer.from(generatedSignature, 'utf8');
    const recSigBuf = Buffer.from(razorpay_signature, 'utf8');

    if (genSigBuf.length !== recSigBuf.length || !crypto.timingSafeEqual(genSigBuf, recSigBuf)) {
      console.error('Razorpay signature mismatch');
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // ── Signature verified — now confirm order & inventory via atomic RPC ──
    const supabase = createServerClient();

    // Find the pending order by razorpay_order_id
    const { data: order, error: findErr } = await supabase
      .from('orders')
      .select('id, order_number, items, payment_status, order_status, total, total_amount, razorpay_order_id')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (findErr || !order) {
      console.error('[Verify] Order not found for razorpay_order_id:', razorpay_order_id);
      return NextResponse.json({
        success: false, error: 'Order not found. Please contact support.'
      }, { status: 404 });
    }

    // Prevent double-processing if already confirmed
    if (order.payment_status?.toLowerCase() === 'paid' || order.order_status === 'PROCESSING') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        orderId: order.id,
        orderNumber: order.order_number,
        paymentId: razorpay_payment_id,
      });
    }

    // Call atomic confirm_order_payment RPC to transition inventory and order status
    const orderAmount = Number(order.total_amount ?? order.total ?? 0);
    const { data: confirmResult, error: confirmErr } = await supabase.rpc('confirm_order_payment', {
      p_order_id: order.id,
      p_payment_id: razorpay_payment_id,
      p_razorpay_order_id: razorpay_order_id,
      p_amount: orderAmount > 0 ? orderAmount : null,
      p_currency: 'INR',
    });

    if (confirmErr) {
      console.error('[Verify] confirm_order_payment RPC error:', confirmErr);
      return NextResponse.json(
        { success: false, error: confirmErr.message || 'Payment confirmation failed' },
        { status: 500 }
      );
    }

    // Handle INVENTORY_CONFLICT outcome: payment captured but hold expired
    if (confirmResult?.status === 'INVENTORY_CONFLICT') {
      revalidatePath('/orders');
      revalidatePath('/admin/orders');

      return NextResponse.json({
        success: true,
        status: 'INVENTORY_CONFLICT',
        message: confirmResult.message || 'Payment captured but inventory hold expired; order flagged for recovery',
        orderId: order.id,
        orderNumber: order.order_number,
        paymentId: razorpay_payment_id,
      });
    }

    // Normal successful fulfillment: trigger confirmation email (fire-and-forget)
    try {
      const { data: fullOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .single();

      if (fullOrder) {
        const internalSecret = process.env.INTERNAL_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://rangaroo.store'}/api/email/order-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(internalSecret ? { 'x-internal-secret': internalSecret } : {}),
          },
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
      status: 'PROCESSING',
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
