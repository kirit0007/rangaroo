import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isUserAdmin, getAuthenticatedUser } from '@/lib/auth/serverAuth';
import { Order } from '@/types';

import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }
    
    const supabase = createServerClient();

    // Query orders from Supabase DB
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
        couponCode: row.coupon_code,
        total: Number(row.total),
        giftWrapFee: Number(row.gift_wrap_fee || 0),
        taxAmount: Number(row.tax_amount || 0),
        customerEmail: row.customer_email,
        trackingNumber: row.tracking_awb,
        courierName: row.courier_name,
        razorpayPaymentId: row.razorpay_payment_id,
        createdAt: row.created_at,
        shippingAddress: typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : row.shipping_address,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      }));

      return NextResponse.json({ orders: formattedOrders, count: formattedOrders.length, source: 'supabase', isAdmin });
    }
    return NextResponse.json({ orders: [], count: 0, source: 'supabase', error: error?.message });
  } catch (error: any) {
    console.error('[Admin Orders API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order } = body;

    if (!order) {
      return NextResponse.json({ error: 'Order data required' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);

    // Upsert into Supabase DB
    const supabase = createServerClient();
    const { error: dbErr } = await supabase.from('orders').upsert({
      id: order.id,
      order_number: order.orderNumber,
      status: order.status,
      payment_status: order.paymentStatus,
      subtotal: order.subtotal,
      shipping_fee: order.shippingFee,
      discount_amount: order.discountAmount || 0,
      total: order.total,
      gift_wrap_fee: order.giftWrapFee || 0,
      tax_amount: order.taxAmount || 0,
      coupon_code: order.couponCode || null,
      customer_email: order.customerEmail || null,
      tracking_awb: order.trackingNumber || null,
      courier_name: order.courierName || null,
      razorpay_payment_id: order.razorpayPaymentId,
      user_id: user?.id || null,
      created_at: order.createdAt || new Date().toISOString(),
      shipping_address: JSON.stringify(order.shippingAddress),
      items: JSON.stringify(order.items),
    });

    if (dbErr) {
      console.error('[Supabase Order Upsert Error]', dbErr);
      throw new Error(dbErr.message || 'Database insertion failed');
    }

    revalidatePath('/admin');
    revalidatePath('/admin/orders');

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, status, trackingNumber, courierName } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    const cleanId = orderId.toString().trim();

    // Prepare update payload
    const updateData: any = { status };
    if (trackingNumber !== undefined) updateData.tracking_awb = trackingNumber;
    if (courierName !== undefined) updateData.courier_name = courierName;

    // Update in Supabase DB
    const supabase = createServerClient();
    const { error: dbErr } = await supabase
      .from('orders')
      .update(updateData)
      .or(`id.eq.${cleanId},order_number.eq.${cleanId}`);

    if (dbErr) {
      console.error('[Supabase Status Update Error]', dbErr);
      throw new Error(dbErr.message || 'Database update failed');
    }

    revalidatePath('/admin');
    revalidatePath('/admin/orders');
    revalidatePath('/orders');

    return NextResponse.json({ success: true, orderId: cleanId, status, trackingNumber, courierName });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
