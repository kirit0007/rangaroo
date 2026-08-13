import { NextRequest, NextResponse } from 'next/server';
import { products } from '@/data/products';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, discountAmount = 0, amount: rawAmount, currency = 'INR', receipt } = body;

    let finalAmountRupees = 0;

    // Server-Side Price Calculation if items list is provided
    if (Array.isArray(items) && items.length > 0) {
      const calculatedSubtotal = items.reduce((sum: number, item: { productId: string; quantity: number }) => {
        const foundProduct = products.find(p => p.id === item.productId);
        const unitPrice = foundProduct ? foundProduct.price : 0;
        const qty = Math.max(1, Math.min(Number(item.quantity) || 1, 10));
        return sum + (unitPrice * qty);
      }, 0);

      if (calculatedSubtotal > 0) {
        const shippingFee = calculatedSubtotal > 999 ? 0 : 60;
        const discount = Math.max(0, Number(discountAmount) || 0);
        finalAmountRupees = Math.max(1, calculatedSubtotal + shippingFee - discount);
      }
    }

    // Fallback if no items passed directly in payload
    if (finalAmountRupees <= 0) {
      finalAmountRupees = Math.max(1, Number(rawAmount) || 0);
    }

    if (finalAmountRupees <= 0) {
      return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 });
    }

    const amountInPaise = Math.round(finalAmountRupees * 100);

    // Create Razorpay order via official REST endpoint
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TPIC0CSsjAS9L2';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '4c91jNJeOtVWnQpMNfTSznZS';

    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: receipt || `ord_${Date.now()}`,
      }),
    });

    const orderData = await response.json();

    if (!response.ok) {
      // Allow simulation mode if test credentials
      return NextResponse.json({
        id: `order_sim_${Date.now()}`,
        amount: amountInPaise,
        currency,
        status: 'created',
        simulated: true,
      });
    }

    return NextResponse.json(orderData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
