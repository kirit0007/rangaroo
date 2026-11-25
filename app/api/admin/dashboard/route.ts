import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, maskCustomerPII, checkRolePermission } from '@/lib/admin/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, [
      'orders.read',
      'orders.read_masked',
      'products.read',
    ]);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const admin = auth.admin;
    const canViewFinancials = checkRolePermission(admin.role, 'orders.read');
    const isMaskedPII = admin.role === 'SUPPORT_AGENT' || !canViewFinancials;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === 'custom' && customStart) {
      startDate = new Date(customStart);
      if (customEnd) endDate = new Date(customEnd);
    } else {
      // Default 7d
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const supabase = createServerClient();

    // 1. Fetch Orders within date range
    const { data: dbOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[Dashboard Orders Fetch Error]', ordersError);
    }

    const orders = dbOrders || [];

    // 2. Compute Metric Totals
    let grossRevenue = 0;
    let totalDiscount = 0;
    let pendingOrdersCount = 0;
    const totalOrdersCount = orders.length;

    // Track product sales for best-sellers
    const productSalesMap = new Map<string, { id: string; name: string; quantity: number; revenue: number; image?: string }>();

    // Sales trend daily buckets
    const trendBuckets = new Map<string, { date: string; revenue: number; orders: number }>();

    // Initialize daily buckets
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dateKey = cursor.toISOString().slice(0, 10);
      trendBuckets.set(dateKey, { date: dateKey, revenue: 0, orders: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    orders.forEach((o: any) => {
      const orderTotal = Number(o.total || o.total_amount || 0);
      const discount = Number(o.discount_amount || 0);
      const status = (o.status || o.order_status || 'PENDING').toLowerCase();

      if (status === 'pending') {
        pendingOrdersCount++;
      }

      if (canViewFinancials) {
        grossRevenue += orderTotal;
        totalDiscount += discount;
      }

      // Group into daily trend
      const orderDateKey = (o.created_at || '').slice(0, 10);
      const bucket = trendBuckets.get(orderDateKey) || { date: orderDateKey, revenue: 0, orders: 0 };
      bucket.orders += 1;
      if (canViewFinancials) {
        bucket.revenue += orderTotal;
      }
      trendBuckets.set(orderDateKey, bucket);

      // Parse items for best sellers
      try {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const pId = item.productId || item.product_id || item.id || 'unknown';
            const pName = item.productName || item.name || item.title || 'Product';
            const qty = Number(item.quantity || 1);
            const price = Number(item.unitPrice || item.price || 0);
            const lineRev = price * qty;

            const existing = productSalesMap.get(pId) || {
              id: pId,
              name: pName,
              quantity: 0,
              revenue: 0,
              image: item.productImage || item.image,
            };
            existing.quantity += qty;
            existing.revenue += lineRev;
            if (!existing.image && (item.productImage || item.image)) {
              existing.image = item.productImage || item.image;
            }
            productSalesMap.set(pId, existing);
          });
        }
      } catch {
        // Ignore item parse errors
      }
    });

    const netRevenue = canViewFinancials ? Math.max(0, grossRevenue - totalDiscount) : 0;
    const aov = canViewFinancials && totalOrdersCount > 0 ? Math.round(grossRevenue / totalOrdersCount) : 0;

    // Convert sales trends to sorted array
    const salesTrends = Array.from(trendBuckets.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Sort best sellers
    const bestSellers = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        revenue: canViewFinancials ? item.revenue : 0,
      }));

    // 3. Low-Stock Alerts
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, name, slug, stock, stock_quantity, reserved_quantity, images, price')
      .order('stock', { ascending: true })
      .limit(20);

    const lowStockAlerts = (dbProducts || [])
      .map((p: any) => {
        const physical = Number(p.stock ?? p.stock_quantity ?? 0);
        const reserved = Number(p.reserved_quantity ?? 0);
        const available = Math.max(0, physical - reserved);
        const images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          physicalStock: physical,
          reservedStock: reserved,
          availableStock: available,
          price: Number(p.price || 0),
          image: images[0] || '/logo.png',
        };
      })
      .filter((p) => p.availableStock <= 10)
      .slice(0, 8);

    // 4. Recent Orders (Latest 10)
    const recentOrders = orders.slice(0, 10).map((o: any) => {
      let shippingAddress: any = null;
      try {
        shippingAddress = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
      } catch {
        shippingAddress = null;
      }

      let customerName = o.customer_name || shippingAddress?.fullName || 'Guest Customer';
      let customerEmail = o.customer_email || '—';
      let customerPhone = o.customer_phone || shippingAddress?.phone || '—';

      if (isMaskedPII) {
        const masked = maskCustomerPII({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        });
        customerName = masked.customer_name || '—';
        customerEmail = masked.customer_email || '—';
        customerPhone = masked.customer_phone || '—';
      }

      return {
        id: o.id,
        orderNumber: o.order_number || o.id,
        customerName,
        customerEmail,
        customerPhone,
        status: o.status || (o.order_status ? o.order_status.toLowerCase() : 'pending'),
        paymentStatus: o.payment_status || 'PENDING',
        total: canViewFinancials ? Number(o.total || o.total_amount || 0) : 0,
        createdAt: o.created_at,
      };
    });

    return NextResponse.json({
      metrics: {
        grossRevenue: canViewFinancials ? grossRevenue : 0,
        netRevenue: canViewFinancials ? netRevenue : 0,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        averageOrderValue: aov,
      },
      salesTrends,
      bestSellers,
      lowStockAlerts,
      recentOrders,
      filter: {
        range,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      permissions: {
        canViewFinancials,
        isMaskedPII,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('[Admin Dashboard API Error]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
