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
    const auth = await requireAdminPermission(request, 'reviews.read');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const supabase = createServerClient();

    const { data: review, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'reviews.moderate');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isVerified !== undefined) updateData.is_verified = Boolean(body.isVerified);
    if (body.comment !== undefined) updateData.comment = body.comment;

    const { data: updated, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'reviews.moderate',
      resourceType: 'review',
      resourceId: id,
      changes: updateData,
    });

    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'reviews.moderate');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const supabase = createServerClient();

    const { data: deleted, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'reviews.delete',
      resourceType: 'review',
      resourceId: id,
      changes: { deletedReview: deleted },
    });

    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');

    return NextResponse.json({ success: true, message: `Review ${id} deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
