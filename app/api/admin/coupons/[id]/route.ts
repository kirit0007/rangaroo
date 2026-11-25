import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'coupons.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const clean = id.toUpperCase();
    const supabase = createServerClient();

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .or(`id.eq.${id},code.eq.${clean}`)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'coupons.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const clean = id.toUpperCase();
    const body = await request.json();
    const supabase = createServerClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.discountType !== undefined) updateData.discount_type = body.discountType;
    if (body.discountValue !== undefined) updateData.discount_value = Number(body.discountValue);
    if (body.minOrderAmount !== undefined) updateData.min_order_amount = Number(body.minOrderAmount);
    if (body.maxDiscountAmount !== undefined) updateData.max_discount_amount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
    if (body.usageLimit !== undefined) updateData.usage_limit = body.usageLimit ? Number(body.usageLimit) : null;
    if (body.validFrom !== undefined) updateData.valid_from = body.validFrom ? new Date(body.validFrom).toISOString() : null;
    if (body.validUntil !== undefined) updateData.valid_until = body.validUntil ? new Date(body.validUntil).toISOString() : null;
    if (body.isActive !== undefined) updateData.is_active = Boolean(body.isActive);
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);

    const { data: updated, error } = await supabase
      .from('coupons')
      .update(updateData)
      .or(`id.eq.${id},code.eq.${clean}`)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'coupons.update',
      resourceType: 'coupon',
      resourceId: clean,
      changes: updateData,
    });

    revalidatePath('/admin/coupons');

    return NextResponse.json({ success: true, coupon: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'coupons.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const clean = id.toUpperCase();
    const supabase = createServerClient();

    const { data: deleted, error } = await supabase
      .from('coupons')
      .delete()
      .or(`id.eq.${id},code.eq.${clean}`)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'coupons.delete',
      resourceType: 'coupon',
      resourceId: clean,
      changes: { deletedCoupon: deleted },
    });

    revalidatePath('/admin/coupons');

    return NextResponse.json({ success: true, message: `Coupon ${clean} deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
