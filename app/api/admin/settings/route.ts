import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { defaultSettings, SiteSettings } from '@/app/api/settings/route';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Strictly SUPER_ADMIN only!
    const auth = await requireAdminPermission(request, 'settings.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const supabase = createServerClient();
    const { data: dbSettings, error } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 'global')
      .single();

    let settings: SiteSettings = defaultSettings;
    if (!error && dbSettings && dbSettings.settings) {
      settings = { ...defaultSettings, ...dbSettings.settings };
    }

    // Secure gateway status — zero secret keys exposed!
    const paymentGatewayStatus = {
      razorpayConfigured: Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      razorpayKeyIdMasked: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        ? `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.slice(0, 8)}...`
        : 'Not Configured',
      webhookSecretConfigured: Boolean(process.env.RAZORPAY_KEY_SECRET),
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json({
      settings,
      paymentGateway: paymentGatewayStatus,
    });
  } catch (error: any) {
    console.error('[Admin Settings GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'settings.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const newSettings = body.settings || body;

    const supabase = createServerClient();
    const { data: currentDb } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 'global')
      .single();

    const merged = { ...defaultSettings, ...(currentDb?.settings || {}), ...newSettings };

    const { error: upsertErr } = await supabase.from('site_settings').upsert({
      id: 'global',
      settings: merged,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    await logAdminAction({
      admin: auth.admin,
      action: 'settings.update',
      resourceType: 'site_settings',
      resourceId: 'global',
      changes: newSettings,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/');
    revalidatePath('/admin/settings');

    return NextResponse.json({
      success: true,
      settings: merged,
      message: 'Store settings updated successfully',
    });
  } catch (error: any) {
    console.error('[Admin Settings POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
