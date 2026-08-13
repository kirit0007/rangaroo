import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';
import { Order } from '@/types';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    const userPhone = user.user_metadata?.phone || user.phone;
    const orQuery = userPhone 
      ? `user_id.eq.${user.id},customer_email.eq.${user.email},shipping_address->>phone.eq.${userPhone}`
      : `user_id.eq.${user.id},customer_email.eq.${user.email}`;

    console.log(`[Customer Orders API] Fetching orders for user ID: ${user.id} and Email: ${user.email}`);

    const { data: dbOrders, error } = await supabase
      .from('orders')
      .select('*')
      .or(orQuery)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Fetch Orders Error]', error);
      throw new Error(error.message);
    }

    // Format for frontend
    const formattedOrders: Order[] = dbOrders.map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number || `#${o.id.slice(0, 8)}`,
      items: (o.items || []).map((item: any) => ({
        productId: item.productId || item.product_id,
        productName: item.productName || item.product_name,
        productImage: item.productImage || item.product_image || '/logo.png',
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.unit_price,
        totalPrice: item.totalPrice || item.total_price,
      })),
      status: o.status,
      paymentStatus: o.payment_status,
      shippingAddress: o.shipping_address,
      customerEmail: o.customer_email,
      subtotal: Number(o.subtotal || 0),
      discountAmount: Number(o.discount_amount || 0),
      couponCode: o.coupon_code,
      shippingFee: Number(o.shipping_fee || 0),
      giftWrapFee: Number(o.gift_wrap_fee || 0),
      taxAmount: Number(o.tax_amount || 0),
      total: Number(o.total_amount || o.total || 0),
      razorpayOrderId: o.razorpay_order_id,
      razorpayPaymentId: o.razorpay_payment_id,
      trackingNumber: o.tracking_awb,
      courierName: o.courier_name,
      cancelRequested: o.cancel_requested || false,
      cancelReason: o.cancel_reason,
      returnRequested: o.return_requested || false,
      returnReason: o.return_reason,
      deliveredAt: o.delivered_at,
      createdAt: o.created_at,
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error: any) {
    console.error('Customer Orders Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, action, reason } = body;

    if (!orderId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanId = orderId.toString().trim();
    const supabase = createServerClient();

    // Verify order belongs to user
    const { data: order, error: verifyError } = await supabase
      .from('orders')
      .select('customer_email, status, delivered_at')
      .eq('id', cleanId)
      .single();

    if (verifyError || !order || order.customer_email !== user.email) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    const updateData: any = {};

    if (action === 'cancel') {
      if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
        return NextResponse.json({ error: 'Order cannot be cancelled at this stage' }, { status: 400 });
      }
      updateData.status = 'cancellation_requested';
      updateData.cancel_requested = true;
      updateData.cancel_reason = reason;
    } else if (action === 'return') {
      if (order.status !== 'delivered') {
        return NextResponse.json({ error: 'Only delivered orders can be returned' }, { status: 400 });
      }
      
      const deliveredDate = order.delivered_at ? new Date(order.delivered_at) : null;
      if (!deliveredDate) {
         return NextResponse.json({ error: 'Delivery date missing' }, { status: 400 });
      }

      const daysSinceDelivery = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDelivery > 7) {
        return NextResponse.json({ error: 'Return policy expired (7 days)' }, { status: 400 });
      }

      updateData.status = 'return_requested';
      updateData.return_requested = true;
      updateData.return_reason = reason;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error: dbErr } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', cleanId);

    if (dbErr) {
      throw new Error(dbErr.message || 'Database update failed');
    }

    revalidatePath('/orders');
    revalidatePath('/admin/orders');

    return NextResponse.json({ success: true, orderId: cleanId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
