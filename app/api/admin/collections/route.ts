import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { collections as initialCollections } from '@/data/products';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export interface AdminCollectionItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  emoji: string;
  image: string;
  displayOrder: number;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  productCount?: number;
  productIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Global in-memory cache to ensure instant synchrony across requests
let memoryCollections: AdminCollectionItem[] = initialCollections.map((col, idx) => ({
  ...col,
  displayOrder: col.displayOrder || idx + 1,
  isActive: true,
  metaTitle: `${col.name} - DIY Paint Kits | Rangaroo`,
  metaDescription: col.description,
  productCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

async function loadCollectionsFromDb(): Promise<AdminCollectionItem[]> {
  const supabase = createServerClient();

  // 1. Try table collections first
  try {
    const { data: dbCols, error } = await supabase
      .from('collections')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && dbCols && dbCols.length > 0) {
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

  // 2. Try site_settings key admin_collections
  try {
    const { data: settingRow } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 'admin_collections')
      .single();

    if (settingRow && settingRow.settings && Array.isArray(settingRow.settings.collections)) {
      return settingRow.settings.collections;
    }
  } catch {}

  return memoryCollections;
}

async function saveCollectionsToDb(cols: AdminCollectionItem[]) {
  memoryCollections = [...cols];
  const supabase = createServerClient();

  // Save to site_settings as guaranteed persistent store
  try {
    await supabase.from('site_settings').upsert({
      id: 'admin_collections',
      settings: { collections: cols, updated_at: new Date().toISOString() },
    });
  } catch (err) {
    console.error('[Save Collections to site_settings error]', err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, ['collections.manage', 'products.read']);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    const cols = await loadCollectionsFromDb();
    const supabase = createServerClient();

    // Fetch product counts per collection from products table
    const { data: dbProducts } = await supabase.from('products').select('id, collection_id');
    const productCounts: Record<string, number> = {};

    (dbProducts || []).forEach((p: any) => {
      if (p.collection_id) {
        productCounts[p.collection_id] = (productCounts[p.collection_id] || 0) + 1;
      }
    });

    let collections = cols.map((col) => ({
      ...col,
      productCount: productCounts[col.id] || productCounts[col.slug] || (col.productIds ? col.productIds.length : 0),
    }));

    if (search) {
      collections = collections.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.slug.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search)
      );
    }

    // Sort by display order
    collections.sort((a, b) => a.displayOrder - b.displayOrder);

    return NextResponse.json({
      collections,
      count: collections.length,
    });
  } catch (error: any) {
    console.error('[Admin Collections GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'collections.manage');
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const {
      name,
      slug: customSlug,
      description,
      emoji = '🎨',
      image = '/images/collections/dinosaur.jpg',
      displayOrder,
      isActive = true,
      metaTitle,
      metaDescription,
      productIds = [],
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const slug = (customSlug || name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const id = slug || `col_${Date.now()}`;
    const cols = await loadCollectionsFromDb();

    // Check duplicate slug
    if (cols.some((c) => c.slug === slug || c.id === id)) {
      return NextResponse.json({ error: `Collection with slug '${slug}' already exists` }, { status: 400 });
    }

    const newCollection: AdminCollectionItem = {
      id,
      name: name.trim(),
      slug,
      description: description || '',
      emoji: emoji.trim() || '🎨',
      image: image.trim() || '/logo.png',
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : cols.length + 1,
      isActive: Boolean(isActive),
      metaTitle: metaTitle || `${name} - DIY Paint Kits`,
      metaDescription: metaDescription || description || '',
      productIds: Array.isArray(productIds) ? productIds : [],
      productCount: Array.isArray(productIds) ? productIds.length : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cols.push(newCollection);
    await saveCollectionsToDb(cols);

    // If productIds assigned, update products in DB
    const supabase = createServerClient();
    if (Array.isArray(productIds) && productIds.length > 0) {
      await supabase
        .from('products')
        .update({ collection_id: newCollection.id })
        .in('id', productIds);
    }

    // Audit log
    await logAdminAction({
      admin: auth.admin,
      action: 'collections.create',
      resourceType: 'collection',
      resourceId: newCollection.id,
      changes: newCollection,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/collections');
    revalidatePath(`/collections/${newCollection.slug}`);
    revalidatePath('/admin/collections');

    return NextResponse.json({
      success: true,
      collection: newCollection,
    });
  } catch (error: any) {
    console.error('[Admin Collections POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
