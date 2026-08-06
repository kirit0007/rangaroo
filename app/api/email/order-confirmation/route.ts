import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order, customerEmail } = body || {};

    if (!order) {
      console.error('[Order Email API Error] Missing order data payload');
      return NextResponse.json({ error: 'Order data payload is required' }, { status: 400 });
    }

    const emailResult = await sendOrderConfirmationEmail(order, customerEmail);

    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        error: emailResult.error,
        details: emailResult.details,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
      orderNumber: order.orderNumber || order.id,
    });
  } catch (error: any) {
    console.error('[Order Email API Exception]', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error during email dispatch',
    }, { status: 500 });
  }
}
