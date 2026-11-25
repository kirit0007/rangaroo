import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'reviews.read');
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status') || 'all'; // all, approved, pending, rejected
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));

    const supabase = createServerClient();
    let query = supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (status !== 'all') {
      if (status === 'approved') {
        query = query.eq('status', 'approved');
      } else if (status === 'rejected') {
        query = query.eq('status', 'rejected');
      } else if (status === 'pending') {
        query = query.or('status.eq.pending,status.is.null');
      }
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: dbReviews, count, error } = await query;

    if (error) {
      console.error('[Admin Reviews GET Error]', error);
      return NextResponse.json({ reviews: [], pagination: { total: 0, page, limit, totalPages: 1 } });
    }

    const reviews = (dbReviews || []).map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      customerName: r.customer_name || 'Verified Customer',
      customerEmail: r.customer_email || '—',
      title: r.title || '',
      rating: Number(r.rating || 5),
      comment: r.comment || '',
      status: r.status || 'approved',
      isVerified: r.is_verified === true,
      images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []),
      createdAt: r.created_at,
    }));

    const total = count || reviews.length;
    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('[Admin Reviews API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'reviews.moderate');
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { reviewId, status, isVerified } = body;

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const updateData: any = {};
    if (status) updateData.status = status;
    if (isVerified !== undefined) updateData.is_verified = Boolean(isVerified);

    const { data: updated, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'reviews.moderate',
      resourceType: 'review',
      resourceId: reviewId,
      changes: updateData,
    });

    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
