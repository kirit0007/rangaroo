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
    const auth = await requireAdminPermission(request, 'products.read');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const supabase = createServerClient();

    const { data: p, error } = await supabase
      .from('products')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();

    if (error || !p) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const physicalStock = Number(p.stock ?? p.stock_quantity ?? 0);
    const reservedStock = Number(p.reserved_quantity ?? 0);
    const availableStock = Math.max(0, physicalStock - reservedStock);

    let images: string[] = ['/logo.png'];
    let kitContents: string[] = [];
    let tags: string[] = [];

    try {
      images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || ['/logo.png']);
    } catch {}
    try {
      kitContents = typeof p.kit_contents === 'string' ? JSON.parse(p.kit_contents) : (p.kit_contents || []);
    } catch {}
    try {
      tags = typeof p.tags === 'string' ? JSON.parse(p.tags) : (p.tags || []);
    } catch {}

    const product = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.short_description || '',
      description: p.description || '',
      price: Number(p.price),
      compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
      categoryId: p.category_id,
      collectionId: p.collection_id,
      images,
      kitContents,
      ageGroup: p.age_group || '5+',
      difficulty: p.difficulty || 'beginner',
      paintType: p.paint_type || 'Tempera (Washable)',
      figureCount: Number(p.figure_count || 1),
      figureSize: p.figure_size || 'medium',
      weightGrams: Number(p.weight_grams || 250),
      physicalStock,
      reservedStock,
      availableStock,
      stockQuantity: physicalStock,
      isActive: p.is_active !== false,
      isFeatured: p.is_featured === true,
      tags,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'products.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.slug !== undefined) updateData.slug = body.slug.trim();
    if (body.shortDescription !== undefined) updateData.short_description = body.shortDescription;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.compareAtPrice !== undefined) updateData.compare_at_price = body.compareAtPrice ? Number(body.compareAtPrice) : null;
    if (body.categoryId !== undefined) updateData.category_id = body.categoryId;
    if (body.collectionId !== undefined) updateData.collection_id = body.collectionId;
    if (body.images !== undefined) updateData.images = JSON.stringify(body.images);
    if (body.kitContents !== undefined) updateData.kit_contents = JSON.stringify(body.kitContents);
    if (body.ageGroup !== undefined) updateData.age_group = body.ageGroup;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.paintType !== undefined) updateData.paint_type = body.paintType;
    if (body.figureCount !== undefined) updateData.figure_count = Number(body.figureCount);
    if (body.figureSize !== undefined) updateData.figure_size = body.figureSize;
    if (body.weightGrams !== undefined) updateData.weight_grams = Number(body.weightGrams);
    if (body.isActive !== undefined) updateData.is_active = Boolean(body.isActive);
    if (body.isFeatured !== undefined) updateData.is_featured = Boolean(body.isFeatured);
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);

    const { data: updated, error } = await supabase
      .from('products')
      .update(updateData)
      .or(`id.eq.${id},slug.eq.${id}`)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'products.update',
      resourceType: 'product',
      resourceId: id,
      changes: updateData,
    });

    revalidatePath('/products');
    revalidatePath('/admin/products');

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'products.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const supabase = createServerClient();

    const { data: deleted, error } = await supabase
      .from('products')
      .delete()
      .or(`id.eq.${id},slug.eq.${id}`)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'products.delete',
      resourceType: 'product',
      resourceId: id,
      changes: { deletedProduct: deleted },
    });

    revalidatePath('/products');
    revalidatePath('/admin/products');

    return NextResponse.json({ success: true, message: `Product ${id} deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
