import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { products as defaultProducts } from '@/data/products';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'products.read');
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const category = searchParams.get('category');
    const collection = searchParams.get('collection');
    const stockStatus = searchParams.get('stockStatus'); // in_stock, low_stock, out_of_stock
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const supabase = createServerClient();
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    let sourceProducts: any[] = [];
    if (!error && dbProducts && dbProducts.length > 0) {
      sourceProducts = dbProducts;
    } else {
      sourceProducts = defaultProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        short_description: p.shortDescription,
        description: p.description,
        price: p.price,
        compare_at_price: p.compareAtPrice,
        category_id: p.categoryId,
        collection_id: p.collectionId,
        images: p.images,
        kit_contents: p.kitContents,
        age_group: p.ageGroup,
        difficulty: p.difficulty,
        paint_type: p.paintType,
        figure_count: p.figureCount,
        figure_size: p.figureSize,
        weight_grams: p.weightGrams,
        stock: p.stockQuantity || 50,
        stock_quantity: p.stockQuantity || 50,
        reserved_quantity: 0,
        is_active: p.isActive,
        is_featured: p.isFeatured,
        tags: p.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    }

    let products = sourceProducts.map((row: any) => {
      const physicalStock = Number(row.stock ?? row.stock_quantity ?? 0);
      const reservedStock = Number(row.reserved_quantity ?? 0);
      const availableStock = Math.max(0, physicalStock - reservedStock);

      let images: string[] = ['/logo.png'];
      let kitContents: string[] = [];
      let tags: string[] = [];

      try {
        images = typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || ['/logo.png']);
      } catch {}
      try {
        kitContents = typeof row.kit_contents === 'string' ? JSON.parse(row.kit_contents) : (row.kit_contents || []);
      } catch {}
      try {
        tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []);
      } catch {}

      return {
        id: row.id,
        name: row.name,
        slug: row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        shortDescription: row.short_description || '',
        description: row.description || '',
        price: Number(row.price),
        compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
        categoryId: row.category_id || 'fun-paint-kit',
        collectionId: row.collection_id || 'dinosaur',
        images,
        kitContents,
        ageGroup: row.age_group || '5+',
        difficulty: row.difficulty || 'beginner',
        paintType: row.paint_type || 'Tempera (Washable)',
        figureCount: Number(row.figure_count || 1),
        figureSize: row.figure_size || 'medium',
        weightGrams: Number(row.weight_grams || 250),
        physicalStock,
        reservedStock,
        availableStock,
        stockQuantity: physicalStock,
        isActive: row.is_active !== false,
        isFeatured: row.is_featured === true,
        tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.slug.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }

    if (category && category !== 'all') {
      products = products.filter((p) => p.categoryId === category);
    }

    if (collection && collection !== 'all') {
      products = products.filter((p) => p.collectionId === collection);
    }

    if (stockStatus === 'low_stock') {
      products = products.filter((p) => p.availableStock > 0 && p.availableStock <= 10);
    } else if (stockStatus === 'out_of_stock') {
      products = products.filter((p) => p.availableStock <= 0);
    } else if (stockStatus === 'in_stock') {
      products = products.filter((p) => p.availableStock > 10);
    }

    products.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'createdAt') {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      }

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB || '');
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      valA = Number(valA || 0);
      valB = Number(valB || 0);
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const total = products.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = products.slice(offset, offset + limit);

    return NextResponse.json({
      products: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('[Admin Products GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'products.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const product = body.product || body;

    if (!product || !product.name) {
      return NextResponse.json({ error: 'Product name and details are required' }, { status: 400 });
    }

    const slug = (product.slug || product.name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const id = product.id || slug || `prod_${Date.now()}`;
    const stock = Number(product.stockQuantity ?? product.stock ?? 50);

    const supabase = createServerClient();
    const { data: saved, error } = await supabase
      .from('products')
      .upsert({
        id,
        name: product.name.trim(),
        slug,
        short_description: product.shortDescription || '',
        description: product.description || '',
        price: Number(product.price || 0),
        compare_at_price: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        category_id: product.categoryId || 'fun-paint-kit',
        collection_id: product.collectionId || 'dinosaur',
        images: JSON.stringify(product.images || ['/logo.png']),
        kit_contents: JSON.stringify(product.kitContents || []),
        age_group: product.ageGroup || '5+',
        difficulty: product.difficulty || 'beginner',
        paint_type: product.paintType || 'Tempera (Washable)',
        figure_count: Number(product.figureCount || 1),
        figure_size: product.figureSize || 'medium',
        weight_grams: Number(product.weightGrams || 250),
        stock: stock,
        stock_quantity: stock,
        is_active: product.isActive !== false,
        is_featured: product.isFeatured === true,
        tags: JSON.stringify(product.tags || []),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Admin Product Upsert DB Error]', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'products.upsert',
      resourceType: 'product',
      resourceId: id,
      changes: product,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/products');
    revalidatePath(`/products/${slug}`);
    revalidatePath('/admin/products');

    return NextResponse.json({
      success: true,
      product: saved,
      message: `Product ${product.name} saved successfully`,
    });
  } catch (error: any) {
    console.error('[Admin Products POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
