import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Order } from '@/types';

// In-memory fallback global store for cross-session orders when Supabase DB is initialising
const globalOrdersStore: Order[] = [];

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Query all orders from Supabase DB without user filtering
    const { data: dbOrders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && dbOrders && dbOrders.length > 0) {
      const formattedOrders: Order[] = dbOrders.map((row: any) => ({
        id: row.id,
        orderNumber: row.order_number || row.id,
        status: row.status,
        paymentStatus: row.payment_status,
        subtotal: Number(row.subtotal),
        shippingFee: Number(row.shipping_fee),
        discountAmount: Number(row.discount_amount || 0),
        total: Number(row.total),
        razorpayPaymentId: row.razorpay_payment_id,
        createdAt: row.created_at,
        shippingAddress: typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : row.shipping_address,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      }));

      return NextResponse.json({ orders: formattedOrders, count: formattedOrders.length, source: 'supabase' });
    }

    // Return global orders fallback if database table is empty or pending schema creation
    return NextResponse.json({ orders: globalOrdersStore, count: globalOrdersStore.length, source: 'memory' });
  } catch (error: any) {
    console.error('[Admin Orders API Error]', error);
    return NextResponse.json({ orders: globalOrdersStore, count: globalOrdersStore.length, source: 'memory_fallback' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order } = body;

    if (!order) {
      return NextResponse.json({ error: 'Order data required' }, { status: 400 });
    }

    // Save to memory store
    const existingIdx = globalOrdersStore.findIndex(o => o.id === order.id || o.orderNumber === order.orderNumber);
    if (existingIdx >= 0) {
      globalOrdersStore[existingIdx] = order;
    } else {
      globalOrdersStore.unshift(order);
    }

    // Attempt Supabase insert
    try {
      const supabase = createServerClient();
      await supabase.from('orders').upsert({
        id: order.id,
        order_number: order.orderNumber,
        status: order.status,
        payment_status: order.paymentStatus,
        subtotal: order.subtotal,
        shipping_fee: order.shippingFee,
        discount_amount: order.discountAmount || 0,
        total: order.total,
        razorpay_payment_id: order.razorpayPaymentId,
        created_at: order.createdAt || new Date().toISOString(),
        shipping_address: JSON.stringify(order.shippingAddress),
        items: JSON.stringify(order.items),
      });
    } catch (dbErr) {
      console.warn('[Supabase Order Upsert Warning]', dbErr);
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    // Update in global memory store
    const targetOrder = globalOrdersStore.find(o => o.id === orderId || o.orderNumber === orderId);
    if (targetOrder) {
      targetOrder.status = status;
    }

    // Update in Supabase DB if available
    try {
      const supabase = createServerClient();
      await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
    } catch (dbErr) {
      console.warn('[Supabase Status Update Warning]', dbErr);
    }

    return NextResponse.json({ success: true, orderId, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export { globalOrdersStore };
