import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission } from '@/lib/admin/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'inventory.read');
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const movementType = searchParams.get('movementType');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));

    const supabase = createServerClient();

    let query = supabase
      .from('inventory_movements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (movementType) {
      query = query.eq('movement_type', movementType);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: movements, count, error } = await query;

    if (error) {
      console.error('[Inventory Movements Query Error]', error);
      // Return empty list gracefully if table is empty or error
      return NextResponse.json({
        movements: [],
        pagination: { total: 0, page, limit, totalPages: 1 },
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      movements: movements || [],
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('[Admin Inventory Movements API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
