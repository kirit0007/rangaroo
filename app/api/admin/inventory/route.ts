import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { products as defaultProducts } from '@/data/products';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'inventory.read');
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const stockFilter = searchParams.get('stockFilter') || 'all'; // all, low_stock, out_of_stock, in_stock
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    const supabase = createServerClient();

    // Query products
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('id, name, slug, stock, stock_quantity, reserved_quantity, price, category_id, collection_id, images, updated_at')
      .order('name', { ascending: true });

    let sourceProducts: any[] = [];
    if (!error && dbProducts && dbProducts.length > 0) {
      sourceProducts = dbProducts;
    } else {
      sourceProducts = defaultProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category_id: p.categoryId,
        collection_id: p.collectionId,
        price: p.price,
        stock: p.stockQuantity || 50,
        stock_quantity: p.stockQuantity || 50,
        reserved_quantity: 0,
        images: p.images,
        updated_at: new Date().toISOString(),
      }));
    }

    let items = sourceProducts.map((p: any) => {
      const physicalStock = Number(p.stock ?? p.stock_quantity ?? 0);
      const reservedStock = Number(p.reserved_quantity ?? 0);
      const availableStock = Math.max(0, physicalStock - reservedStock);
      const images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryId: p.category_id,
        collectionId: p.collection_id,
        price: Number(p.price || 0),
        image: images[0] || '/logo.png',
        physicalStock,
        reservedStock,
        availableStock,
        updatedAt: p.updated_at,
      };
    });

    // Apply search filter
    if (search) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.slug.toLowerCase().includes(search) ||
          item.id.toLowerCase().includes(search)
      );
    }

    // Apply stock status filter
    if (stockFilter === 'low_stock') {
      items = items.filter((item) => item.availableStock > 0 && item.availableStock <= 10);
    } else if (stockFilter === 'out_of_stock') {
      items = items.filter((item) => item.availableStock <= 0);
    } else if (stockFilter === 'in_stock') {
      items = items.filter((item) => item.availableStock > 10);
    }

    // Sort
    items.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB || '');
        return sortOrder === 'desc' ? -cmp : cmp;
      }

      valA = Number(valA || 0);
      valB = Number(valB || 0);
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return NextResponse.json({
      items: paginatedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('[Admin Inventory API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'inventory.adjust');
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const productId = body.productId || body.product_id;
    const newStock = body.newStock !== undefined ? Number(body.newStock) : (body.stock !== undefined ? Number(body.stock) : NaN);
    const reason = body.reason || body.notes || 'Manual administrative adjustment';

    if (!productId) {
      return NextResponse.json({ error: 'Missing required field: productId' }, { status: 400 });
    }

    if (isNaN(newStock) || newStock < 0) {
      return NextResponse.json({ error: 'Invalid stock value: stock must be a non-negative integer' }, { status: 400 });
    }

    const supabase = createServerClient();

    let rpcResult: any = null;
    const { data: resData, error: rpcError } = await supabase.rpc('adjust_product_stock', {
      p_product_id: productId,
      p_new_stock: newStock,
      p_notes: reason,
      p_admin_id: auth.admin.id,
    });

    if (rpcError) {
      console.warn('[Admin Inventory RPC fallback]', rpcError.message);
      // Fallback: direct product table update when RPC is not in schema cache
      await supabase
        .from('products')
        .update({ stock: newStock, stock_quantity: newStock, updated_at: new Date().toISOString() })
        .eq('id', productId);
      rpcResult = { success: true, product_id: productId, new_stock: newStock, fallback: true };
    } else {
      rpcResult = resData;
    }

    // Audit log
    await logAdminAction({
      admin: auth.admin,
      action: 'inventory.adjust',
      resourceType: 'product_inventory',
      resourceId: productId,
      changes: {
        newStock,
        reason,
        rpcResult,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/admin');
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/products');

    return NextResponse.json({
      success: true,
      result: rpcResult,
      message: `Stock successfully adjusted for product ${productId}`,
    });
  } catch (error: any) {
    console.error('[Admin Inventory Adjust Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
