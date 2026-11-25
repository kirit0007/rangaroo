import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, maskCustomerPII, checkRolePermission } from '@/lib/admin/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, ['customers.read', 'customers.read_masked']);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const admin = auth.admin;
    const canReadFullPII = checkRolePermission(admin.role, 'customers.read');
    const isMaskedPII = admin.role === 'SUPPORT_AGENT' || !canReadFullPII;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const segment = searchParams.get('segment') || 'all'; // all, VIP, Regular, Guest
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const sortBy = searchParams.get('sortBy') || 'totalSpent';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const supabase = createServerClient();

    // Query orders to derive comprehensive customer aggregates
    const { data: dbOrders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Customers Query Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to aggregate by email / customer key
    const customerMap = new Map<string, {
      id: string;
      email: string;
      fullName: string;
      phone: string;
      orderCount: number;
      totalSpent: number;
      firstOrderDate: string;
      lastOrderDate: string;
      segment: 'VIP' | 'Regular' | 'Guest';
      city?: string;
      state?: string;
      hasAccount: boolean;
    }>();

    (dbOrders || []).forEach((order: any) => {
      let shippingAddress: any = null;
      try {
        shippingAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
      } catch {
        shippingAddress = null;
      }

      const rawEmail = (order.customer_email || shippingAddress?.email || '').trim().toLowerCase();
      const rawName = (order.customer_name || shippingAddress?.fullName || 'Customer').trim();
      const rawPhone = (order.customer_phone || shippingAddress?.phone || '').trim();
      const orderTotal = Number(order.total || order.total_amount || 0);
      const createdAt = order.created_at || new Date().toISOString();
      const hasAccount = Boolean(order.user_id);

      // Key by email if available, otherwise by name+phone
      const key = rawEmail || `${rawName}_${rawPhone}` || order.id;

      const existing = customerMap.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += orderTotal;
        if (new Date(createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = createdAt;
        }
        if (new Date(createdAt) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = createdAt;
        }
        if (hasAccount) existing.hasAccount = true;
        if (!existing.phone && rawPhone) existing.phone = rawPhone;
        if (!existing.city && shippingAddress?.city) existing.city = shippingAddress.city;
        if (!existing.state && shippingAddress?.state) existing.state = shippingAddress.state;
      } else {
        customerMap.set(key, {
          id: order.user_id || `cust_${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email: rawEmail || 'no-email@customer.store',
          fullName: rawName,
          phone: rawPhone,
          orderCount: 1,
          totalSpent: orderTotal,
          firstOrderDate: createdAt,
          lastOrderDate: createdAt,
          segment: 'Guest',
          city: shippingAddress?.city || '',
          state: shippingAddress?.state || '',
          hasAccount,
        });
      }
    });

    let customers = Array.from(customerMap.values()).map((c) => {
      // Determine segmentation
      let derivedSegment: 'VIP' | 'Regular' | 'Guest' = 'Guest';
      if (c.totalSpent >= 2000 || c.orderCount >= 3) {
        derivedSegment = 'VIP';
      } else if (c.hasAccount || c.orderCount > 1) {
        derivedSegment = 'Regular';
      } else {
        derivedSegment = 'Guest';
      }

      return {
        ...c,
        segment: derivedSegment,
      };
    });

    // Apply segment filter
    if (segment !== 'all') {
      customers = customers.filter((c) => c.segment.toLowerCase() === segment.toLowerCase());
    }

    // Apply search filter (pre-masking so search works effectively)
    if (search) {
      customers = customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone.includes(search) ||
          (c.city && c.city.toLowerCase().includes(search))
      );
    }

    // Sort
    customers.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB || '');
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      valA = Number(valA || 0);
      valB = Number(valB || 0);
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const total = customers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const pageSlice = customers.slice(offset, offset + limit);

    // Apply PII Masking if role is SUPPORT_AGENT or lacks customers.read
    const sanitizedCustomers = pageSlice.map((c) => {
      if (isMaskedPII) {
        const masked = maskCustomerPII({
          customer_name: c.fullName,
          customer_email: c.email,
          customer_phone: c.phone,
        });

        return {
          ...c,
          fullName: masked.customer_name || '—',
          email: masked.customer_email || '—',
          phone: masked.customer_phone || '—',
        };
      }
      return c;
    });

    return NextResponse.json({
      customers: sanitizedCustomers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      piiMasked: isMaskedPII,
    });
  } catch (error: any) {
    console.error('[Admin Customers API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
