import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, customerInfo } = await request.json();

    if (!amount) {
      return NextResponse.json({ success: false, error: 'Amount is required' }, { status: 400 });
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('Razorpay keys are missing');
      return NextResponse.json({ success: false, error: 'Payment gateway configuration error' }, { status: 500 });
    }

    const amountInPaise = Math.round(amount * 100);
    const receipt = 'receipt_' + Date.now();

    // Basic Auth
    const basicAuth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Razorpay order creation failed:', data);
      return NextResponse.json({ success: false, error: data.error?.description || 'Failed to create order' }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency
    });

  } catch (error) {
    console.error('Error in Razorpay order route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
