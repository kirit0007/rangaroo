import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, checkRolePermission } from '@/lib/admin/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, ['orders.read', 'orders.read_masked']);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const admin = auth.admin;
    const canViewFinancials = checkRolePermission(admin.role, 'orders.read');

    // Strict security check: SUPPORT_AGENT is forbidden from accessing financial analytics
    if (admin.role === 'SUPPORT_AGENT' || !canViewFinancials) {
      return NextResponse.json(
        { error: 'Forbidden: SUPPORT_AGENT is not permitted to access financial analytics' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const exportFormat = searchParams.get('export'); // 'csv' or null
    const reportType = searchParams.get('report') || 'overview'; // 'overview', 'revenue', 'orders', 'products', 'categories'

    const now = new Date();
    let startDate: Date;
    if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === '12m') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
      // Default 30d
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const supabase = createServerClient();

    // Query orders
    const { data: dbOrders, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (ordersErr) {
      console.error('[Analytics Orders Query Error]', ordersErr);
      return NextResponse.json({ error: ordersErr.message }, { status: 500 });
    }

    const orders = dbOrders || [];

    // Query products
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, name, category_id, collection_id, price');

    const productMap = new Map<string, any>();
    (dbProducts || []).forEach((p: any) => productMap.set(p.id, p));

    // Aggregations
    let totalGrossRevenue = 0;
    let totalDiscounts = 0;
    let totalShippingRevenue = 0;
    let totalRefunds = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;
    let cancelledOrdersCount = 0;

    // Time-series daily buckets
    const dailyMap = new Map<string, { date: string; revenue: number; orders: number; aov: number }>();

    // Product performance
    const productStats = new Map<string, {
      id: string;
      name: string;
      unitsSold: number;
      revenue: number;
      orderCount: number;
      category: string;
    }>();

    // Category performance
    const categoryStats = new Map<string, {
      categoryId: string;
      orderCount: number;
      revenue: number;
      unitsSold: number;
    }>();

    orders.forEach((o: any) => {
      const total = Number(o.total || o.total_amount || 0);
      const discount = Number(o.discount_amount || 0);
      const shipping = Number(o.shipping_fee || 0);
      const status = (o.status || o.order_status || 'PENDING').toLowerCase();
      const paymentStatus = (o.payment_status || 'PENDING').toLowerCase();

      totalGrossRevenue += total;
      totalDiscounts += discount;
      totalShippingRevenue += shipping;

      if (paymentStatus === 'paid') paidOrdersCount++;
      if (status === 'pending') pendingOrdersCount++;
      if (status === 'cancelled') {
        cancelledOrdersCount++;
        totalRefunds += total;
      }

      // Time-series
      const day = (o.created_at || '').slice(0, 10);
      const dayBucket = dailyMap.get(day) || { date: day, revenue: 0, orders: 0, aov: 0 };
      dayBucket.revenue += total;
      dayBucket.orders += 1;
      dailyMap.set(day, dayBucket);

      // Line items breakdown
      try {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const pId = item.productId || item.product_id || item.id || 'unknown';
            const pName = item.productName || item.name || 'Product';
            const qty = Number(item.quantity || 1);
            const price = Number(item.unitPrice || item.price || 0);
            const lineRev = price * qty;
            const catalogItem = productMap.get(pId);
            const catId = catalogItem?.category_id || item.categoryId || 'standard';

            // Update product stats
            const pStat = productStats.get(pId) || {
              id: pId,
              name: pName,
              unitsSold: 0,
              revenue: 0,
              orderCount: 0,
              category: catId,
            };
            pStat.unitsSold += qty;
            pStat.revenue += lineRev;
            pStat.orderCount += 1;
            productStats.set(pId, pStat);

            // Update category stats
            const catStat = categoryStats.get(catId) || {
              categoryId: catId,
              orderCount: 0,
              revenue: 0,
              unitsSold: 0,
            };
            catStat.orderCount += 1;
            catStat.revenue += lineRev;
            catStat.unitsSold += qty;
            categoryStats.set(catId, catStat);
          });
        }
      } catch {}
    });

    const netRevenue = Math.max(0, totalGrossRevenue - totalDiscounts - totalRefunds);
    const averageOrderValue = orders.length > 0 ? Math.round(totalGrossRevenue / orders.length) : 0;

    // Finalize daily buckets
    const timeline = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        aov: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0,
      }));

    const productRanking = Array.from(productStats.values()).sort((a, b) => b.revenue - a.revenue);
    const categoryRanking = Array.from(categoryStats.values()).sort((a, b) => b.revenue - a.revenue);

    // CSV Export
    if (exportFormat === 'csv') {
      let csvContent = '';
      if (reportType === 'products') {
        csvContent = 'Product ID,Product Name,Category,Units Sold,Revenue (INR),Order Count\n';
        productRanking.forEach((p) => {
          csvContent += `"${p.id}","${p.name.replace(/"/g, '""')}","${p.category}",${p.unitsSold},${p.revenue},${p.orderCount}\n`;
        });
      } else if (reportType === 'orders') {
        csvContent = 'Order ID,Date,Status,Payment Status,Customer Email,Total (INR),Discount (INR),Shipping (INR)\n';
        orders.forEach((o: any) => {
          csvContent += `"${o.order_number || o.id}","${o.created_at}","${o.status || o.order_status}","${o.payment_status}","${o.customer_email || ''}",${o.total || o.total_amount || 0},${o.discount_amount || 0},${o.shipping_fee || 0}\n`;
        });
      } else {
        // Daily revenue overview CSV
        csvContent = 'Date,Total Orders,Gross Revenue (INR),Average Order Value (INR)\n';
        timeline.forEach((t) => {
          csvContent += `"${t.date}",${t.orders},${t.revenue},${t.aov}\n`;
        });
      }

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="rangaroo-analytics-${reportType}-${range}.csv"`,
        },
      });
    }

    return NextResponse.json({
      summary: {
        grossRevenue: totalGrossRevenue,
        netRevenue,
        discounts: totalDiscounts,
        refunds: totalRefunds,
        shippingRevenue: totalShippingRevenue,
        averageOrderValue,
        totalOrders: orders.length,
        paidOrders: paidOrdersCount,
        pendingOrders: pendingOrdersCount,
        cancelledOrders: cancelledOrdersCount,
      },
      timeline,
      products: productRanking,
      categories: categoryRanking,
      filter: {
        range,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Admin Analytics API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
