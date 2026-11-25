import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { defaultCoupons } from '@/app/api/coupons/route';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'coupons.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toUpperCase() || '';
    const status = searchParams.get('status') || 'all'; // all, active, inactive, expired

    const supabase = createServerClient();
    const { data: dbCoupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    let coupons: any[] = [];
    if (!error && dbCoupons && dbCoupons.length > 0) {
      coupons = dbCoupons;
    } else {
      coupons = defaultCoupons.map((c, idx) => ({
        id: `c_${idx + 1}`,
        code: c.code,
        discount_type: c.discountType,
        discount_value: c.discountValue,
        min_order_amount: c.minOrderAmount || 0,
        max_discount_amount: c.maxDiscountAmount || null,
        is_active: true,
        usage_limit: 500,
        used_count: 12,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      }));
    }

    const now = new Date();

    if (search) {
      coupons = coupons.filter((c) => c.code.includes(search));
    }

    if (status === 'active') {
      coupons = coupons.filter((c) => c.is_active !== false && (!c.valid_until || new Date(c.valid_until) >= now));
    } else if (status === 'inactive') {
      coupons = coupons.filter((c) => c.is_active === false);
    } else if (status === 'expired') {
      coupons = coupons.filter((c) => c.valid_until && new Date(c.valid_until) < now);
    }

    return NextResponse.json({
      coupons,
      count: coupons.length,
    });
  } catch (error: any) {
    console.error('[Admin Coupons GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'coupons.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const {
      code,
      discountType = 'percentage',
      discountValue,
      minOrderAmount = 0,
      maxDiscountAmount,
      usageLimit,
      validFrom,
      validUntil,
      isActive = true,
    } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    if (discountValue === undefined || isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
      return NextResponse.json({ error: 'Valid discountValue is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const supabase = createServerClient();

    const { data: saved, error } = await supabase
      .from('coupons')
      .upsert({
        code: cleanCode,
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: Number(minOrderAmount || 0),
        max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        usage_limit: usageLimit ? Number(usageLimit) : null,
        valid_from: validFrom ? new Date(validFrom).toISOString() : new Date().toISOString(),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        is_active: Boolean(isActive),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'coupons.upsert',
      resourceType: 'coupon',
      resourceId: cleanCode,
      changes: body,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/admin/coupons');

    return NextResponse.json({
      success: true,
      coupon: saved,
      message: `Coupon ${cleanCode} created successfully`,
    });
  } catch (error: any) {
    console.error('[Admin Coupons POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
