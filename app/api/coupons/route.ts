import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isUserAdmin } from '@/lib/auth/serverAuth';
import { Coupon } from '@/types';

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

let globalCouponsStore: Coupon[] = [...defaultCoupons];

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: dbCoupons, error } = await supabase
      .from('coupons')
      .select('*');

    if (!error && dbCoupons && dbCoupons.length > 0) {
      const formatted: Coupon[] = dbCoupons.map((row: any) => ({
        code: row.code,
        discountType: row.discount_type || row.discountType,
        discountValue: Number(row.discount_value || row.discountValue),
        minOrderAmount: row.min_order_amount ? Number(row.min_order_amount) : undefined,
        maxDiscountAmount: row.max_discount_amount ? Number(row.max_discount_amount) : undefined,
      }));
      globalCouponsStore = formatted;
      return NextResponse.json({ coupons: formatted, source: 'supabase' });
    }
  } catch (err) {
    console.error('Error fetching coupons from Supabase:', err);
  }

  return NextResponse.json({ coupons: globalCouponsStore, source: 'memory_fallback' });
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

    globalCouponsStore = [coupon, ...globalCouponsStore.filter(c => c.code.toUpperCase() !== coupon.code.toUpperCase())];

    const supabase = createServerClient();
    const { error: upsertError } = await supabase
      .from('coupons')
      .upsert({
        code: coupon.code.toUpperCase(),
        discount_type: coupon.discountType,
        discount_value: coupon.discountValue,
        min_order_amount: coupon.minOrderAmount || 0,
        max_discount_amount: coupon.maxDiscountAmount || null,
        created_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.warn('Could not upsert into Supabase coupons table (using memory store):', upsertError.message);
    }

    return NextResponse.json({ success: true, coupons: globalCouponsStore });
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

    globalCouponsStore = globalCouponsStore.filter(c => c.code.toUpperCase() !== code.toUpperCase());

    const supabase = createServerClient();
    const { error: deleteError } = await supabase
      .from('coupons')
      .delete()
      .eq('code', code.toUpperCase());

    if (deleteError) {
      console.warn('Could not delete from Supabase coupons table:', deleteError.message);
    }

    return NextResponse.json({ success: true, coupons: globalCouponsStore });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete coupon';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
