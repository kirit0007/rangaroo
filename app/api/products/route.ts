import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Product } from '@/types';
import { products as initialProducts } from '@/data/products';

// Global memory store for newly created/edited products across sessions
const globalProductsStore: Product[] = [...initialProducts];

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && dbProducts && dbProducts.length > 0) {
      const formattedProducts: Product[] = dbProducts.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        shortDescription: row.short_description || '',
        description: row.description || '',
        price: Number(row.price),
        compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
        categoryId: row.category_id || 'fun-paint-kit',
        collectionId: row.collection_id || 'dinosaur',
        images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || ['/logo.png']),
        kitContents: typeof row.kit_contents === 'string' ? JSON.parse(row.kit_contents) : (row.kit_contents || []),
        ageGroup: row.age_group || '5+',
        difficulty: row.difficulty || 'beginner',
        paintType: row.paint_type || 'Tempera (Washable)',
        figureCount: Number(row.figure_count || 1),
        figureSize: row.figure_size || 'medium',
        weightGrams: Number(row.weight_grams || 250),
        stockQuantity: Number(row.stock_quantity || 50),
        isActive: row.is_active !== false,
        isFeatured: row.is_featured === true,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
      }));

      return NextResponse.json({ products: formattedProducts, source: 'supabase' });
    }

    return NextResponse.json({ products: globalProductsStore, source: 'memory' });
  } catch (error) {
    return NextResponse.json({ products: globalProductsStore, source: 'memory_fallback' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product } = body;

    if (!product) {
      return NextResponse.json({ error: 'Product payload required' }, { status: 400 });
    }

    // Upsert into memory store
    const idx = globalProductsStore.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      globalProductsStore[idx] = product;
    } else {
      globalProductsStore.unshift(product);
    }

    // Upsert into Supabase DB
    try {
      const supabase = createServerClient();
      await supabase.from('products').upsert({
        id: product.id,
        name: product.name,
        slug: product.slug,
        short_description: product.shortDescription,
        description: product.description,
        price: product.price,
        compare_at_price: product.compareAtPrice,
        category_id: product.categoryId,
        collection_id: product.collectionId,
        images: JSON.stringify(product.images),
        kit_contents: JSON.stringify(product.kitContents),
        age_group: product.ageGroup,
        difficulty: product.difficulty,
        paint_type: product.paintType,
        figure_count: product.figureCount,
        figure_size: product.figureSize,
        weight_grams: product.weightGrams,
        stock_quantity: product.stockQuantity,
        is_active: product.isActive,
        is_featured: product.isFeatured,
        tags: JSON.stringify(product.tags),
      });
    } catch (dbErr) {
      console.warn('[Supabase Product Upsert Warning]', dbErr);
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const idx = globalProductsStore.findIndex(p => p.id === productId);
    if (idx >= 0) {
      globalProductsStore.splice(idx, 1);
    }

    try {
      const supabase = createServerClient();
      await supabase.from('products').delete().eq('id', productId);
    } catch (dbErr) {
      console.warn('[Supabase Product Delete Warning]', dbErr);
    }

    return NextResponse.json({ success: true, productId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
