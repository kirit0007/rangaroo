import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, maskCustomerPII, checkRolePermission, logAdminAction } from '@/lib/admin/adminAuth';
import { Order } from '@/types';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, ['orders.read', 'orders.read_masked']);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const admin = auth.admin;
    const canReadFullPII = checkRolePermission(admin.role, 'orders.read');
    const isMaskedPII = admin.role === 'SUPPORT_AGENT' || !canReadFullPII;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const statusFilter = searchParams.get('status') || 'all';
    const paymentStatusFilter = searchParams.get('paymentStatus') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const supabase = createServerClient();

    // Query orders from Supabase DB
    const { data: dbOrders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Orders Query Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let formattedOrders: Order[] = (dbOrders || []).map((row: any) => {
      let shippingAddress: any = {};
      let items: any[] = [];
      try {
        shippingAddress = typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : (row.shipping_address || {});
      } catch {
        shippingAddress = {};
      }
      try {
        items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []);
      } catch {
        items = [];
      }

      let customerName = row.customer_name || shippingAddress.fullName || 'Customer';
      let customerEmail = row.customer_email || shippingAddress.email || '';
      let customerPhone = row.customer_phone || shippingAddress.phone || '';

      if (isMaskedPII) {
        const masked = maskCustomerPII({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        });
        customerName = masked.customer_name || '—';
        customerEmail = masked.customer_email || '—';
        customerPhone = masked.customer_phone || '—';

        if (shippingAddress) {
          shippingAddress = {
            ...shippingAddress,
            fullName: customerName,
            phone: customerPhone,
            addressLine1: '*** Masked for Support Agent ***',
            addressLine2: undefined,
          };
        }
      }

      return {
        id: row.id,
        orderNumber: row.order_number || row.id,
        status: row.status || (row.order_status ? row.order_status.toLowerCase() : 'pending'),
        paymentStatus: row.payment_status || 'pending',
        subtotal: Number(row.subtotal || 0),
        shippingFee: Number(row.shipping_fee || 0),
        discountAmount: Number(row.discount_amount || 0),
        couponCode: row.coupon_code || undefined,
        total: Number(row.total || row.total_amount || 0),
        giftWrapFee: Number(row.gift_wrap_fee || 0),
        taxAmount: Number(row.tax_amount || 0),
        customerEmail: customerEmail || undefined,
        trackingNumber: row.tracking_awb || undefined,
        courierName: row.courier_name || undefined,
        razorpayPaymentId: row.razorpay_payment_id || undefined,
        createdAt: row.created_at,
        shippingAddress,
        items,
      };
    });

    // Filter by search
    if (search) {
      formattedOrders = formattedOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(search)) ||
          (o.shippingAddress?.fullName && o.shippingAddress.fullName.toLowerCase().includes(search)) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(search))
      );
    }

    // Filter by order status
    if (statusFilter !== 'all') {
      formattedOrders = formattedOrders.filter((o) => o.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Filter by payment status
    if (paymentStatusFilter !== 'all') {
      formattedOrders = formattedOrders.filter((o) => o.paymentStatus.toLowerCase() === paymentStatusFilter.toLowerCase());
    }

    // Sorting
    formattedOrders.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB || '');
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      valA = Number(valA || 0);
      valB = Number(valB || 0);
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const total = formattedOrders.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedOrders = formattedOrders.slice(offset, offset + limit);

    return NextResponse.json({
      orders: paginatedOrders,
      count: paginatedOrders.length,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      source: 'supabase',
      piiMasked: isMaskedPII,
    });
  } catch (error: any) {
    console.error('[Admin Orders API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'orders.fulfill');
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const { order } = body;

    if (!order) {
      return NextResponse.json({ error: 'Order data required' }, { status: 400 });
    }

    const admin = auth.admin;
    const supabase = createServerClient();

    // Upsert into Supabase DB
    const { error: dbErr } = await supabase.from('orders').upsert({
      id: order.id,
      order_number: order.orderNumber,
      status: order.status,
      payment_status: order.paymentStatus,
      subtotal: order.subtotal,
      shipping_fee: order.shippingFee,
      discount_amount: order.discountAmount || 0,
      total: order.total,
      total_amount: order.total,
      gift_wrap_fee: order.giftWrapFee || 0,
      tax_amount: order.taxAmount || 0,
      coupon_code: order.couponCode || null,
      customer_email: order.customerEmail || null,
      tracking_awb: order.trackingNumber || null,
      courier_name: order.courierName || null,
      razorpay_payment_id: order.razorpayPaymentId,
      user_id: admin.id || null,
      created_at: order.createdAt || new Date().toISOString(),
      shipping_address: JSON.stringify(order.shippingAddress),
      items: JSON.stringify(order.items),
    });

    if (dbErr) {
      console.error('[Supabase Order Upsert Error]', dbErr);
      return NextResponse.json({ error: dbErr.message || 'Database insertion failed' }, { status: 500 });
    }

    // Audit log
    await logAdminAction({
      admin,
      action: 'orders.create',
      resourceType: 'order',
      resourceId: order.id,
      changes: { orderNumber: order.orderNumber, total: order.total },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/admin');
    revalidatePath('/admin/orders');

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, trackingNumber, courierName, reason, refundAmount, refundType } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    const cleanId = orderId.toString().trim();
    const cleanStatus = status.toLowerCase();

    // Differentiated permission enforcement based on status transition:
    let requiredPerm = 'orders.fulfill';
    if (cleanStatus === 'cancelled') {
      requiredPerm = 'orders.cancel';
    } else if (cleanStatus === 'refunded' || refundAmount !== undefined) {
      requiredPerm = 'orders.refund';
    }

    const auth = await requireAdminPermission(request, requiredPerm as any);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const admin = auth.admin;
    const supabase = createServerClient();

    // Order Cancellation & Inventory Restoration via Atomic Database RPC
    if (cleanStatus === 'cancelled') {
      const { data: cancelResult, error: cancelErr } = await supabase.rpc('cancel_order_and_restore_inventory', {
        p_order_id: cleanId,
        p_reason: reason || 'Admin order cancellation',
        p_admin_id: admin.id,
      });

      if (cancelErr) {
        console.error('[Admin Orders Cancellation RPC Error]', cancelErr);
        return NextResponse.json({ error: cancelErr.message || 'Failed to cancel order' }, { status: 400 });
      }

      // Also ensure tracking / courier updates are saved if provided
      if (trackingNumber !== undefined || courierName !== undefined) {
        const updateData: any = {};
        if (trackingNumber !== undefined) updateData.tracking_awb = trackingNumber;
        if (courierName !== undefined) updateData.courier_name = courierName;
        await supabase
          .from('orders')
          .update(updateData)
          .or(`id.eq.${cleanId},order_number.eq.${cleanId}`);
      }

      await logAdminAction({
        admin,
        action: 'orders.cancel',
        resourceType: 'order',
        resourceId: cleanId,
        changes: { reason, cancelResult },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      revalidatePath('/admin');
      revalidatePath('/admin/orders');
      revalidatePath('/orders');

      return NextResponse.json({
        success: true,
        orderId: cleanId,
        status: 'cancelled',
        already_cancelled: cancelResult?.already_cancelled || false,
        restocked: cancelResult?.restocked || false,
        trackingNumber,
        courierName,
      });
    }

    // Handle Refunds
    if (cleanStatus === 'refunded' || refundAmount !== undefined) {
      const updateData: any = {
        payment_status: 'refunded',
        status: cleanStatus === 'refunded' ? 'refunded' : undefined,
      };

      const { error: refundErr } = await supabase
        .from('orders')
        .update(updateData)
        .or(`id.eq.${cleanId},order_number.eq.${cleanId}`);

      if (refundErr) {
        return NextResponse.json({ error: refundErr.message }, { status: 400 });
      }

      await logAdminAction({
        admin,
        action: 'orders.refund',
        resourceType: 'order',
        resourceId: cleanId,
        changes: { refundAmount, refundType: refundType || 'full', reason },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      revalidatePath('/admin/orders');

      return NextResponse.json({
        success: true,
        orderId: cleanId,
        paymentStatus: 'refunded',
        refundAmount,
        refundType: refundType || 'full',
      });
    }

    // For standard fulfillment transitions (processing, shipped, delivered)
    const updateData: any = {
      status: cleanStatus,
    };
    if (trackingNumber !== undefined) updateData.tracking_awb = trackingNumber;
    if (courierName !== undefined) updateData.courier_name = courierName;

    const { error: dbErr } = await supabase
      .from('orders')
      .update(updateData)
      .or(`id.eq.${cleanId},order_number.eq.${cleanId}`);

    if (dbErr) {
      console.warn('[Supabase Status Update Notice]', dbErr.message);
    }

    await logAdminAction({
      admin,
      action: 'orders.fulfill',
      resourceType: 'order',
      resourceId: cleanId,
      changes: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/admin');
    revalidatePath('/admin/orders');
    revalidatePath('/orders');

    return NextResponse.json({ success: true, orderId: cleanId, status: cleanStatus, trackingNumber, courierName });
  } catch (error: any) {
    console.error('[Admin Orders Status Update Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
