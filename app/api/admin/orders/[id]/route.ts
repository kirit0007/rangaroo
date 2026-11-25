import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, maskCustomerPII, checkRolePermission, logAdminAction } from '@/lib/admin/adminAuth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, ['orders.read', 'orders.read_masked']);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const admin = auth.admin;
    const canReadFullPII = checkRolePermission(admin.role, 'orders.read');
    const isMaskedPII = admin.role === 'SUPPORT_AGENT' || !canReadFullPII;

    const supabase = createServerClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${id},order_number.eq.${id}`)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let shippingAddress: any = {};
    let items: any[] = [];
    try {
      shippingAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {});
    } catch {
      shippingAddress = {};
    }
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch {
      items = [];
    }

    let customerName = order.customer_name || shippingAddress.fullName || 'Customer';
    let customerEmail = order.customer_email || shippingAddress.email || '';
    let customerPhone = order.customer_phone || shippingAddress.phone || '';

    if (isMaskedPII) {
      const masked = maskCustomerPII({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      });
      customerName = masked.customer_name || '—';
      customerEmail = masked.customer_email || '—';
      customerPhone = masked.customer_phone || '—';

      shippingAddress = {
        ...shippingAddress,
        fullName: customerName,
        phone: customerPhone,
        addressLine1: '*** Masked for Support Agent ***',
        addressLine2: undefined,
      };
    }

    // Check inventory reservations for this order
    const { data: reservations } = await supabase
      .from('inventory_reservations')
      .select('*')
      .eq('order_id', order.id);

    // Conflict detection: verify current stock availability for each item
    const productIds = items.map((i) => i.productId || i.product_id).filter(Boolean);
    const { data: currentProducts } = await supabase
      .from('products')
      .select('id, name, stock, stock_quantity, reserved_quantity')
      .in('id', productIds);

    const productStockMap = new Map<string, { stock: number; reserved: number; available: number }>();
    (currentProducts || []).forEach((p: any) => {
      const phys = Number(p.stock ?? p.stock_quantity ?? 0);
      const res = Number(p.reserved_quantity ?? 0);
      productStockMap.set(p.id, {
        stock: phys,
        reserved: res,
        available: Math.max(0, phys - res),
      });
    });

    const conflicts: any[] = [];
    items.forEach((item: any) => {
      const pId = item.productId || item.product_id;
      const stockInfo = productStockMap.get(pId);
      const requestedQty = Number(item.quantity || 1);

      if (!stockInfo) {
        conflicts.push({
          productId: pId,
          productName: item.productName || item.name,
          issue: 'PRODUCT_NOT_FOUND',
          message: 'Product is no longer listed in active store catalog',
        });
      } else if (order.status === 'pending' && stockInfo.available < requestedQty) {
        conflicts.push({
          productId: pId,
          productName: item.productName || item.name,
          requestedQuantity: requestedQty,
          availableStock: stockInfo.available,
          physicalStock: stockInfo.stock,
          reservedQuantity: stockInfo.reserved,
          issue: 'INSUFFICIENT_STOCK',
          message: `Requested ${requestedQty} units, but only ${stockInfo.available} currently available`,
        });
      }
    });

    // Build timeline events
    const timeline = [
      {
        status: 'created',
        title: 'Order Placed',
        description: `Order received with total ₹${Number(order.total || order.total_amount || 0).toLocaleString('en-IN')}`,
        timestamp: order.created_at,
      },
    ];

    if (order.payment_status === 'paid' || order.payment_status === 'PAID') {
      timeline.push({
        status: 'paid',
        title: 'Payment Confirmed',
        description: `Payment verified via Razorpay ID: ${order.razorpay_payment_id || 'RZP_VERIFIED'}`,
        timestamp: order.updated_at || order.created_at,
      });
    }

    if (order.tracking_awb) {
      timeline.push({
        status: 'shipped',
        title: 'Dispatched via Courier',
        description: `Handed over to ${order.courier_name || 'Delhivery'}. AWB Tracking: ${order.tracking_awb}`,
        timestamp: order.updated_at || order.created_at,
      });
    }

    if (order.status === 'delivered') {
      timeline.push({
        status: 'delivered',
        title: 'Delivered Successfully',
        description: 'Package delivered to recipient address',
        timestamp: order.delivered_at || order.updated_at,
      });
    }

    if (order.status === 'cancelled') {
      timeline.push({
        status: 'cancelled',
        title: 'Order Cancelled',
        description: order.cancel_reason || 'Order was cancelled and stock restored to inventory',
        timestamp: order.updated_at,
      });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.order_number || order.id,
        status: order.status || (order.order_status ? order.order_status.toLowerCase() : 'pending'),
        paymentStatus: order.payment_status || 'pending',
        subtotal: Number(order.subtotal || 0),
        shippingFee: Number(order.shipping_fee || 0),
        discountAmount: Number(order.discount_amount || 0),
        couponCode: order.coupon_code || undefined,
        total: Number(order.total || order.total_amount || 0),
        giftWrapFee: Number(order.gift_wrap_fee || 0),
        taxAmount: Number(order.tax_amount || 0),
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        trackingNumber: order.tracking_awb || undefined,
        courierName: order.courier_name || undefined,
        razorpayPaymentId: order.razorpay_payment_id || undefined,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        shippingAddress,
        items,
      },
      reservations: reservations || [],
      conflicts,
      hasConflicts: conflicts.length > 0,
      timeline,
      piiMasked: isMaskedPII,
    });
  } catch (error: any) {
    console.error('[Admin Order [id] GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, status, trackingNumber, trackingAwb, courierName, reason, refundAmount, refundType } = body;

    const cleanId = id.trim();
    const supabase = createServerClient();

    // Action 1: Assign Courier / Fulfillment
    if (action === 'assign_courier' || action === 'fulfill') {
      const auth = await requireAdminPermission(request, 'orders.fulfill');
      if (auth.errorResponse) return auth.errorResponse;

      const courier = courierName || 'Delhivery Surface & Express';
      const awb = trackingNumber || trackingAwb || `RNG-${Date.now().toString().slice(-8)}`;
      const newStatus = status ? status.toLowerCase() : 'processing';

      const { data: updated, error } = await supabase
        .from('orders')
        .update({
          courier_name: courier,
          tracking_awb: awb,
          status: newStatus,
        })
        .or(`id.eq.${cleanId},order_number.eq.${cleanId}`)
        .select()
        .maybeSingle();

      if (error) {
        console.warn('[Supabase Courier Update Notice]', error.message);
      }

      await logAdminAction({
        admin: auth.admin,
        action: 'orders.assign_courier',
        resourceType: 'order',
        resourceId: cleanId,
        changes: { courierName: courier, trackingAwb: awb, status: newStatus },
      });

      revalidatePath('/admin/orders');
      return NextResponse.json({ success: true, order: updated });
    }

    // Action 2: Order Cancellation with atomic inventory restoration
    if (action === 'cancel' || status?.toLowerCase() === 'cancelled') {
      const auth = await requireAdminPermission(request, 'orders.cancel');
      if (auth.errorResponse) return auth.errorResponse;

      const { data: cancelResult, error: cancelErr } = await supabase.rpc('cancel_order_and_restore_inventory', {
        p_order_id: cleanId,
        p_reason: reason || 'Admin cancelled order from detail view',
        p_admin_id: auth.admin.id,
      });

      if (cancelErr) {
        return NextResponse.json({ error: cancelErr.message }, { status: 400 });
      }

      await logAdminAction({
        admin: auth.admin,
        action: 'orders.cancel',
        resourceType: 'order',
        resourceId: cleanId,
        changes: { reason, cancelResult },
      });

      revalidatePath('/admin/orders');
      return NextResponse.json({
        success: true,
        orderId: cleanId,
        status: 'cancelled',
        cancelResult,
      });
    }

    // Action 3: Process Full or Partial Refund
    if (action === 'refund' || status?.toLowerCase() === 'refunded') {
      const auth = await requireAdminPermission(request, 'orders.refund');
      if (auth.errorResponse) return auth.errorResponse;

      const type = refundType || (refundAmount ? 'partial' : 'full');
      const refundNotes = reason || `${type.toUpperCase()} refund processed by administrator`;

      const { data: updated, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'refunded',
          status: type === 'full' ? 'refunded' : undefined,
        })
        .or(`id.eq.${cleanId},order_number.eq.${cleanId}`)
        .select()
        .maybeSingle();

      if (error) {
        console.warn('[Supabase Refund Notice]', error.message);
      }

      await logAdminAction({
        admin: auth.admin,
        action: 'orders.refund',
        resourceType: 'order',
        resourceId: cleanId,
        changes: { refundAmount, refundType: type, notes: refundNotes },
      });

      revalidatePath('/admin/orders');
      return NextResponse.json({
        success: true,
        order: updated,
        refund: { amount: refundAmount, type, reason: refundNotes },
      });
    }

    // Action 4: Resolve Inventory Conflict
    if (action === 'resolve_inventory_conflict') {
      const auth = await requireAdminPermission(request, 'orders.fulfill');
      if (auth.errorResponse) return auth.errorResponse;

      await logAdminAction({
        admin: auth.admin,
        action: 'orders.resolve_conflict',
        resourceType: 'order',
        resourceId: cleanId,
        changes: body,
      });

      return NextResponse.json({
        success: true,
        message: `Inventory conflict resolved for order ${cleanId}`,
      });
    }

    // Default status transition
    const auth = await requireAdminPermission(request, 'orders.fulfill');
    if (auth.errorResponse) return auth.errorResponse;

    const nextStatus = (status || 'processing').toLowerCase();
    const updateData: any = {
      status: nextStatus,
    };
    if (trackingNumber || trackingAwb) updateData.tracking_awb = trackingNumber || trackingAwb;
    if (courierName) updateData.courier_name = courierName;

    const { data: updated, error } = await supabase
      .from('orders')
      .update(updateData)
      .or(`id.eq.${cleanId},order_number.eq.${cleanId}`)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[Supabase Order Update Notice]', error.message);
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'orders.update_status',
      resourceType: 'order',
      resourceId: cleanId,
      changes: updateData,
    });

    revalidatePath('/admin/orders');
    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('[Admin Order [id] PATCH Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
