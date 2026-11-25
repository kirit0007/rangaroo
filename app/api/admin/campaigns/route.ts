import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export interface AdminCampaign {
  id: string;
  name: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  bannerUrl?: string;
  bannerHeading?: string;
  bannerSubheading?: string;
  productIds: string[];
  collectionIds: string[];
  status: 'active' | 'upcoming' | 'expired' | 'draft';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultCampaigns: AdminCampaign[] = [
  {
    id: 'camp_diwali_2026',
    name: 'Diwali Festive Spark Sale',
    code: 'FESTIVE25',
    description: 'Special 25% discount across all dinosaur and animal paint kits for Diwali.',
    discountType: 'percentage',
    discountValue: 25,
    minOrderAmount: 499,
    maxDiscountAmount: 200,
    startDate: '2026-10-15T00:00:00.000Z',
    endDate: '2026-11-30T23:59:59.000Z',
    bannerUrl: '/images/hero/hero-slide-1.jpg',
    bannerHeading: '✨ Diwali Festive Crafting Specials!',
    bannerSubheading: 'Save 25% on Festive Paint Kits. Use Code FESTIVE25 at checkout.',
    productIds: ['mini-dinosaur-duo-paint-kit', 'fun-dinosaur-trio-paint-kit'],
    collectionIds: ['dinosaur', 'animal'],
    status: 'active',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'camp_space_launch',
    name: 'Cosmic Space Explorer Week',
    code: 'COSMIC50',
    description: 'Flat ₹50 off on all Space Collection figurines.',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 299,
    startDate: '2026-12-01T00:00:00.000Z',
    endDate: '2026-12-15T23:59:59.000Z',
    bannerUrl: '/images/collections/space.jpg',
    bannerHeading: '🚀 Cosmic Space Week!',
    bannerSubheading: 'Paint the universe with Flat ₹50 off using COSMIC50.',
    productIds: ['fun-space-trio-paint-kit'],
    collectionIds: ['space'],
    status: 'upcoming',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let memoryCampaigns: AdminCampaign[] = [...defaultCampaigns];

async function loadCampaigns(): Promise<AdminCampaign[]> {
  const supabase = createServerClient();
  try {
    const { data: dbCamps } = await supabase.from('campaigns').select('*');
    if (dbCamps && dbCamps.length > 0) {
      return dbCamps.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        description: c.description,
        discountType: c.discount_type || c.discountType || 'percentage',
        discountValue: Number(c.discount_value || c.discountValue || 0),
        minOrderAmount: c.min_order_amount ? Number(c.min_order_amount) : undefined,
        maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : undefined,
        startDate: c.start_date || c.startDate,
        endDate: c.end_date || c.endDate,
        bannerUrl: c.banner_url || c.bannerUrl,
        bannerHeading: c.banner_heading || c.bannerHeading,
        bannerSubheading: c.banner_subheading || c.bannerSubheading,
        productIds: typeof c.product_ids === 'string' ? JSON.parse(c.product_ids) : (c.product_ids || []),
        collectionIds: typeof c.collection_ids === 'string' ? JSON.parse(c.collection_ids) : (c.collection_ids || []),
        status: c.status || 'active',
        isActive: c.is_active !== false,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));
    }
  } catch {}

  try {
    const { data: row } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 'admin_campaigns')
      .single();

    if (row?.settings?.campaigns) {
      return row.settings.campaigns;
    }
  } catch {}

  return memoryCampaigns;
}

async function saveCampaigns(camps: AdminCampaign[]) {
  memoryCampaigns = [...camps];
  const supabase = createServerClient();
  try {
    await supabase.from('site_settings').upsert({
      id: 'admin_campaigns',
      settings: { campaigns: camps, updated_at: new Date().toISOString() },
    });
  } catch (err) {
    console.error('[Save Campaigns Error]', err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, ['campaigns.manage', 'products.read']);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';
    const search = searchParams.get('search')?.toLowerCase() || '';

    const allCampaigns = await loadCampaigns();
    const now = new Date();

    // Dynamically compute status based on schedule
    let campaigns = allCampaigns.map((camp) => {
      let derivedStatus: 'active' | 'upcoming' | 'expired' | 'draft' = camp.status;
      if (!camp.isActive) {
        derivedStatus = 'draft';
      } else {
        const start = new Date(camp.startDate);
        const end = new Date(camp.endDate);
        if (now < start) {
          derivedStatus = 'upcoming';
        } else if (now > end) {
          derivedStatus = 'expired';
        } else {
          derivedStatus = 'active';
        }
      }

      return {
        ...camp,
        status: derivedStatus,
      };
    });

    if (statusFilter !== 'all') {
      campaigns = campaigns.filter((c) => c.status === statusFilter);
    }

    if (search) {
      campaigns = campaigns.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.code.toLowerCase().includes(search) ||
          (c.description && c.description.toLowerCase().includes(search))
      );
    }

    campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      campaigns,
      count: campaigns.length,
    });
  } catch (error: any) {
    console.error('[Admin Campaigns GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'campaigns.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const {
      name,
      code,
      description,
      discountType = 'percentage',
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      bannerUrl,
      bannerHeading,
      bannerSubheading,
      productIds = [],
      collectionIds = [],
      isActive = true,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Campaign promotional coupon code is required' }, { status: 400 });
    }

    if (discountValue === undefined || isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
      return NextResponse.json({ error: 'Valid discountValue is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const campaigns = await loadCampaigns();

    if (campaigns.some((c) => c.code === cleanCode)) {
      return NextResponse.json({ error: `Campaign with code '${cleanCode}' already exists` }, { status: 400 });
    }

    const start = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const end = endDate
      ? new Date(endDate).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const newCampaign: AdminCampaign = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      code: cleanCode,
      description: description || '',
      discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      startDate: start,
      endDate: end,
      bannerUrl: bannerUrl || '/images/hero/hero-slide-1.jpg',
      bannerHeading: bannerHeading || name,
      bannerSubheading: bannerSubheading || description || '',
      productIds: Array.isArray(productIds) ? productIds : [],
      collectionIds: Array.isArray(collectionIds) ? collectionIds : [],
      status: 'active',
      isActive: Boolean(isActive),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    campaigns.push(newCampaign);
    await saveCampaigns(campaigns);

    // Also register coupon code in public.coupons table so storefront can redeem it!
    const supabase = createServerClient();
    try {
      await supabase.from('coupons').upsert({
        code: cleanCode,
        discount_type: newCampaign.discountType,
        discount_value: newCampaign.discountValue,
        min_order_amount: newCampaign.minOrderAmount || 0,
        max_discount_amount: newCampaign.maxDiscountAmount || null,
        is_active: newCampaign.isActive,
        valid_from: newCampaign.startDate,
        valid_until: newCampaign.endDate,
      });
    } catch (couponErr) {
      console.warn('[Sync campaign to coupons table warn]', couponErr);
    }

    // Audit log
    await logAdminAction({
      admin: auth.admin,
      action: 'campaigns.create',
      resourceType: 'campaign',
      resourceId: newCampaign.id,
      changes: newCampaign,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/admin/campaigns');
    revalidatePath('/admin/coupons');

    return NextResponse.json({
      success: true,
      campaign: newCampaign,
    });
  } catch (error: any) {
    console.error('[Admin Campaigns POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
