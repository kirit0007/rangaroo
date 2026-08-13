import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('Razorpay API keys are missing in environment variables');
      return NextResponse.json(
        { success: false, error: 'Razorpay API keys are not configured.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}` } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order amount.' },
        { status: 400 }
      );
    }

    // Amount must be in paise (subunits)
    const amountInPaise = Math.round(Number(amount) * 100);

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: amountInPaise,
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: key_id,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment order.' },
      { status: 500 }
    );
  }
}
