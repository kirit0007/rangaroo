import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Review } from '@/types';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';


function calculateReviewSummary(reviews: Review[]) {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const total = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
  const averageRating = Number((sum / total).toFixed(1));

  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
    ratingBreakdown[star as keyof typeof ratingBreakdown] += 1;
  });

  return {
    averageRating,
    totalReviews: total,
    ratingBreakdown,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const minRating = searchParams.get('minRating');
    const featured = searchParams.get('featured');

    let allReviews: Review[] = [];

    // 1. Query Supabase DB
    try {
      const supabase = createServerClient();
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (minRating) {
        query = query.gte('rating', Number(minRating));
      }

      const { data: dbReviews, error } = await query;
      if (!error && dbReviews && dbReviews.length > 0) {
        allReviews = dbReviews.map((row: any) => ({
          id: row.id,
          productId: row.product_id,
          customerName: row.customer_name || 'Verified Customer',
          title: row.title || '',
          rating: Number(row.rating || 5),
          comment: row.comment || '',
          isVerified: row.is_verified !== false,
          createdAt: row.created_at || new Date().toISOString(),
        }));
      }
    } catch (dbErr) {
      console.warn('[Reviews GET Supabase Warning]', dbErr);
    }

    if (featured === 'true') {
      allReviews = allReviews.filter(r => r.rating >= 4);
    }

    const summary = calculateReviewSummary(allReviews);

    return NextResponse.json({
      reviews: allReviews,
      summary,
      count: allReviews.length,
    });
  } catch (error: any) {
    console.error('[Reviews GET Error]', error);
    return NextResponse.json({ 
      reviews: [], 
      summary: { averageRating: 0, totalReviews: 0, ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }, 
      count: 0 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, customerName, title, rating, comment } = body;
    const user = await getAuthenticatedUser(request);

    if (!productId || !comment || !rating) {
      return NextResponse.json({ error: 'Product ID, rating, and review comment are required' }, { status: 400 });
    }

    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId,
      customerName: customerName?.trim() || user?.email?.split('@')[0] || 'Customer',
      title: title?.trim() || '',
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment.trim(),
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    let supabase;
    // Save to Supabase DB if available
    try {
      supabase = createServerClient();
      await supabase.from('reviews').insert({
        id: newReview.id,
        product_id: newReview.productId,
        customer_name: newReview.customerName,
        title: newReview.title,
        rating: newReview.rating,
        comment: newReview.comment,
        is_verified: newReview.isVerified,
        created_at: newReview.createdAt,
      });
    } catch (dbErr) {
      console.warn('[Reviews POST Supabase Warning]', dbErr);
    }

    const { data: productReviews } = await (supabase || createServerClient()).from('reviews').select('*').eq('product_id', productId);
    const summary = calculateReviewSummary(productReviews || []);

    return NextResponse.json({
      success: true,
      review: newReview,
      summary,
    });
  } catch (error: any) {
    console.error('[Reviews POST Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}
