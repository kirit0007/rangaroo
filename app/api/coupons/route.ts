import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isUserAdmin } from '@/lib/auth/serverAuth';
import { Coupon } from '@/types';
import { revalidatePath } from 'next/cache';

export const defaultCoupons: Coupon[] = [
  {
    code: 'FIRST10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 149,
    maxDiscountAmount: 100,
  },
  {
    code: 'PARTY20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 699,
    maxDiscountAmount: 300,
  },
  {
    code: 'FLAT50',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 299,
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // Individual coupon code validation against public.coupons
    if (code) {
      const { data: coupon, error: couponErr } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .single();

      if (couponErr || !coupon) {
        return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      }

      if (coupon.is_active === false) {
        return NextResponse.json({ error: 'Coupon is inactive' }, { status: 400 });
      }

      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return NextResponse.json({ error: 'Coupon is not yet active' }, { status: 400 });
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
      }

      if (coupon.max_uses !== null && coupon.max_uses !== undefined && Number(coupon.used_count) >= Number(coupon.max_uses)) {
        return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
      }

      const maxDisc = coupon.max_discount !== undefined && coupon.max_discount !== null
        ? Number(coupon.max_discount)
        : (coupon.max_discount_amount !== undefined && coupon.max_discount_amount !== null ? Number(coupon.max_discount_amount) : undefined);

      return NextResponse.json({
        valid: true,
        coupon: {
          code: coupon.code,
          discountType: (coupon.discount_type || coupon.discountType || 'PERCENTAGE').toLowerCase(),
          discountValue: Number(coupon.discount_value || coupon.discountValue),
          minOrderAmount: coupon.min_order_amount !== null && coupon.min_order_amount !== undefined ? Number(coupon.min_order_amount) : undefined,
          maxDiscountAmount: maxDisc,
          maxDiscount: maxDisc,
          isActive: coupon.is_active !== false,
        },
      });
    }

    const { data: dbCoupons, error } = await supabase
      .from('coupons')
      .select('*');

    if (!error && dbCoupons && dbCoupons.length > 0) {
      const formatted: Coupon[] = dbCoupons.map((row: any) => {
        const maxDisc = row.max_discount !== undefined && row.max_discount !== null
          ? Number(row.max_discount)
          : (row.max_discount_amount !== undefined && row.max_discount_amount !== null ? Number(row.max_discount_amount) : undefined);

        return {
          code: row.code,
          discountType: (row.discount_type || row.discountType || 'percentage').toLowerCase(),
          discountValue: Number(row.discount_value || row.discountValue),
          minOrderAmount: row.min_order_amount !== null && row.min_order_amount !== undefined ? Number(row.min_order_amount) : undefined,
          maxDiscountAmount: maxDisc,
        };
      });
      return NextResponse.json({ coupons: formatted, source: 'supabase' });
    }

    return NextResponse.json({ coupons: defaultCoupons, source: 'default_fallback' });
  } catch (err: any) {
    console.error('Error fetching coupons from Supabase:', err);
    return NextResponse.json({ coupons: defaultCoupons, source: 'default_fallback' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const coupon: Coupon = body.coupon || body;

    if (!coupon || !coupon.code) {
      return NextResponse.json({ error: 'Invalid coupon data' }, { status: 400 });
    }

    const supabase = createServerClient();
    const discType = (coupon.discountType || 'percentage').toLowerCase();
    const validatedDiscType = discType === 'fixed' ? 'fixed' : 'percentage';
    const maxDiscountVal = coupon.maxDiscountAmount ?? (coupon as any).max_discount ?? null;

    const insertPayload: any = {
      code: coupon.code.toUpperCase(),
      discount_type: validatedDiscType,
      discount_value: coupon.discountValue,
      min_order_amount: coupon.minOrderAmount || 0,
    };
    if (maxDiscountVal !== null) {
      insertPayload.max_discount_amount = maxDiscountVal;
    }

    const { error: upsertError } = await supabase
      .from('coupons')
      .upsert(insertPayload);

    if (upsertError) {
      console.warn('[Supabase Coupon Upsert Warning]', upsertError.message);
    }

    revalidatePath('/admin');

    return NextResponse.json({ success: true, coupon });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save coupon';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { error: deleteError } = await supabase
      .from('coupons')
      .delete()
      .eq('code', code.toUpperCase());

    if (deleteError) {
      console.error('[Supabase Coupon Delete Error]', deleteError);
      throw new Error(deleteError.message || 'Database deletion failed');
    }

    revalidatePath('/admin');

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete coupon';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
