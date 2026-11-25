import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { AdminCampaign } from '../route';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function loadCampaigns(): Promise<AdminCampaign[]> {
  const supabase = createServerClient();
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
  return [];
}

async function saveCampaigns(camps: AdminCampaign[]) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, ['campaigns.manage', 'products.read']);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const campaigns = await loadCampaigns();
    const campaign = campaigns.find((c) => c.id === id || c.code === id.toUpperCase());

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminPermission(request, 'campaigns.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const campaigns = await loadCampaigns();
    const idx = campaigns.findIndex((c) => c.id === id || c.code === id.toUpperCase());

    if (idx === -1) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const current = campaigns[idx];
    const updated: AdminCampaign = {
      ...current,
      name: body.name !== undefined ? body.name.trim() : current.name,
      description: body.description !== undefined ? body.description : current.description,
      discountType: body.discountType !== undefined ? body.discountType : current.discountType,
      discountValue: body.discountValue !== undefined ? Number(body.discountValue) : current.discountValue,
      minOrderAmount: body.minOrderAmount !== undefined ? Number(body.minOrderAmount) : current.minOrderAmount,
      maxDiscountAmount: body.maxDiscountAmount !== undefined ? Number(body.maxDiscountAmount) : current.maxDiscountAmount,
      startDate: body.startDate !== undefined ? new Date(body.startDate).toISOString() : current.startDate,
      endDate: body.endDate !== undefined ? new Date(body.endDate).toISOString() : current.endDate,
      bannerUrl: body.bannerUrl !== undefined ? body.bannerUrl : current.bannerUrl,
      bannerHeading: body.bannerHeading !== undefined ? body.bannerHeading : current.bannerHeading,
      bannerSubheading: body.bannerSubheading !== undefined ? body.bannerSubheading : current.bannerSubheading,
      productIds: body.productIds !== undefined ? body.productIds : current.productIds,
      collectionIds: body.collectionIds !== undefined ? body.collectionIds : current.collectionIds,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : current.isActive,
      updatedAt: new Date().toISOString(),
    };

    campaigns[idx] = updated;
    await saveCampaigns(campaigns);

    // Sync to coupons table
    const supabase = createServerClient();
    try {
      await supabase.from('coupons').upsert({
        code: updated.code,
        discount_type: updated.discountType,
        discount_value: updated.discountValue,
        min_order_amount: updated.minOrderAmount || 0,
        max_discount_amount: updated.maxDiscountAmount || null,
        is_active: updated.isActive,
        valid_from: updated.startDate,
        valid_until: updated.endDate,
      });
    } catch {}

    // Audit log
    await logAdminAction({
      admin: auth.admin,
      action: 'campaigns.update',
      resourceType: 'campaign',
      resourceId: updated.id,
      changes: body,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/admin/campaigns');
    revalidatePath('/admin/coupons');

    return NextResponse.json({
      success: true,
      campaign: updated,
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
    const auth = await requireAdminPermission(request, 'campaigns.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const campaigns = await loadCampaigns();
    const campaign = campaigns.find((c) => c.id === id || c.code === id.toUpperCase());

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const filtered = campaigns.filter((c) => c.id !== id && c.code !== id.toUpperCase());
    await saveCampaigns(filtered);

    // Deactivate coupon code
    const supabase = createServerClient();
    try {
      await supabase.from('coupons').update({ is_active: false }).eq('code', campaign.code);
    } catch {}

    // Audit log
    await logAdminAction({
      admin: auth.admin,
      action: 'campaigns.delete',
      resourceType: 'campaign',
      resourceId: id,
      changes: { deletedCampaign: campaign },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/admin/campaigns');

    return NextResponse.json({
      success: true,
      message: `Campaign ${campaign.name} deleted`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
