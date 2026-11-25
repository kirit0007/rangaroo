import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { AdminCollectionItem } from '../route';
import { collections as initialCollections } from '@/data/products';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function loadCollections(): Promise<AdminCollectionItem[]> {
  const supabase = createServerClient();
  try {
    const { data: dbCols } = await supabase.from('collections').select('*');
    if (dbCols && dbCols.length > 0) {
      return dbCols.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        emoji: c.emoji || '🎨',
        image: c.image || '/logo.png',
        displayOrder: Number(c.display_order || c.displayOrder || 1),
        isActive: c.is_active !== false,
        metaTitle: c.meta_title || c.metaTitle,
        metaDescription: c.meta_description || c.metaDescription,
        productIds: typeof c.product_ids === 'string' ? JSON.parse(c.product_ids) : (c.product_ids || []),
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));
    }
  } catch {}

  try {
    const { data: row } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 'admin_collections')
      .single();

    if (row?.settings?.collections) {
      return row.settings.collections;
    }
  } catch {}

  return initialCollections.map((col, idx) => ({
    ...col,
    displayOrder: col.displayOrder || idx + 1,
    isActive: true,
    metaTitle: `${col.name} - DIY Paint Kits`,
    metaDescription: col.description,
    productCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

async function saveCollections(cols: AdminCollectionItem[]) {
  const supabase = createServerClient();
  try {
    await supabase.from('site_settings').upsert({
      id: 'admin_collections',
      settings: { collections: cols, updated_at: new Date().toISOString() },
    });
  } catch (err) {
    console.error('[Save Collections Error]', err);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, ['collections.manage', 'products.read']);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const cols = await loadCollections();
    const collection = cols.find((c) => c.id === id || c.slug === id);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Fetch assigned products
    const supabase = createServerClient();
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, name, slug, price, stock, stock_quantity, images, category_id, collection_id')
      .or(`collection_id.eq.${collection.id},collection_id.eq.${collection.slug}`);

    const products = (dbProducts || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price || 0),
      stock: Number(p.stock ?? p.stock_quantity ?? 0),
      image: typeof p.images === 'string' ? JSON.parse(p.images)[0] : (p.images?.[0] || '/logo.png'),
    }));

    return NextResponse.json({
      collection: {
        ...collection,
        products,
        productCount: products.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'collections.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const cols = await loadCollections();
    const idx = cols.findIndex((c) => c.id === id || c.slug === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const current = cols[idx];
    const updated: AdminCollectionItem = {
      ...current,
      name: body.name !== undefined ? body.name.trim() : current.name,
      slug: body.slug !== undefined ? body.slug.trim() : current.slug,
      description: body.description !== undefined ? body.description : current.description,
      emoji: body.emoji !== undefined ? body.emoji : current.emoji,
      image: body.image !== undefined ? body.image : current.image,
      displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : current.displayOrder,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : current.isActive,
      metaTitle: body.metaTitle !== undefined ? body.metaTitle : current.metaTitle,
      metaDescription: body.metaDescription !== undefined ? body.metaDescription : current.metaDescription,
      productIds: body.productIds !== undefined ? body.productIds : current.productIds,
      updatedAt: new Date().toISOString(),
    };

    cols[idx] = updated;
    await saveCollections(cols);

    // If product reordering or reassignment provided
    const supabase = createServerClient();
    if (Array.isArray(body.productIds)) {
      // Reassign products to this collection
      await supabase.from('products').update({ collection_id: updated.id }).in('id', body.productIds);
    }

    // Audit log
    await logAdminAction({
      admin: auth.admin,
      action: 'collections.update',
      resourceType: 'collection',
      resourceId: updated.id,
      changes: body,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/collections');
    revalidatePath(`/collections/${updated.slug}`);
    revalidatePath('/admin/collections');

    return NextResponse.json({
      success: true,
      collection: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'collections.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const cols = await loadCollections();
    const collection = cols.find((c) => c.id === id || c.slug === id);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const filtered = cols.filter((c) => c.id !== id && c.slug !== id);
    await saveCollections(filtered);

    // Audit log
    await logAdminAction({
      admin: auth.admin,
      action: 'collections.delete',
      resourceType: 'collection',
      resourceId: id,
      changes: { deletedCollection: collection },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/collections');
    revalidatePath('/admin/collections');

    return NextResponse.json({
      success: true,
      message: `Collection ${collection.name} deleted`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
