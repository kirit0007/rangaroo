import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    // Process payment status sync
    if (event === 'payment.captured' || event === 'order.paid') {
      console.log(`[Razorpay Webhook] Payment SUCCESS for order ${paymentEntity?.order_id || orderEntity?.id}`);
    } else if (event === 'payment.failed') {
      console.log(`[Razorpay Webhook] Payment FAILED for order ${paymentEntity?.order_id}`);
    }

    return NextResponse.json({ status: 'ok', event, orderId: paymentEntity?.order_id || orderEntity?.id });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
