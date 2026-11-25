import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export interface CmsContent {
  announcementText: string;
  announcementActive: boolean;
  heroSlides: {
    id: string;
    badge: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    image: string;
  }[];
  promotionalBanner: {
    active: boolean;
    title: string;
    highlight: string;
    code: string;
    expiryDate: string;
  };
  trustBadges: {
    icon: string;
    title: string;
    description: string;
  }[];
}

const defaultCmsContent: CmsContent = {
  announcementText: '🎨 Free Express Shipping on orders above ₹499! 🦘',
  announcementActive: true,
  heroSlides: [
    {
      id: 'slide-1',
      badge: '✨ India\'s Favorite DIY Plaster Craft Kits',
      title: 'Where Little Hands Create Big Smiles',
      subtitle: 'Premium DIY Paint Kits for Kids — Plaster Figurines, Non-Toxic Colors & Beautiful Gift Packaging',
      buttonText: 'Shop All Kits',
      buttonLink: '/products',
      image: '/images/hero/hero-slide-1.jpg',
    },
    {
      id: 'slide-2',
      badge: '🦕 Bestselling Prehistoric Adventure',
      title: 'Roar Into Fun With Dinosaur Kits',
      subtitle: 'Paint T-Rex, Stegosaurus, and Triceratops with washable non-toxic colors.',
      buttonText: 'Explore Dinosaurs',
      buttonLink: '/collections/dinosaur-collection',
      image: '/images/hero/hero-slide-2.jpg',
    },
  ],
  promotionalBanner: {
    active: true,
    title: 'Get 25% Off on All Craft Kits',
    highlight: 'Diwali Festive Sale',
    code: 'FESTIVE25',
    expiryDate: '2026-11-30T23:59:59.000Z',
  },
  trustBadges: [
    { icon: 'ShieldCheck', title: '100% Non-Toxic', description: 'Safe plaster & washable tempera paints' },
    { icon: 'Truck', title: 'Fast Nationwide Delivery', description: 'Express delivery within 2-4 business days' },
    { icon: 'Gift', title: 'Gift Packaging Included', description: 'Ready to gift with cards and gift box' },
    { icon: 'Heart', title: 'Made in India', description: 'Crafted with love for young artists' },
  ],
};

let memoryCms: CmsContent = { ...defaultCmsContent };

async function loadCmsContent(): Promise<CmsContent> {
  const supabase = createServerClient();
  try {
    const { data: row } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 'cms_content')
      .single();

    if (row?.settings) {
      return { ...defaultCmsContent, ...row.settings };
    }
  } catch {}
  return memoryCms;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, ['cms.manage', 'products.read']);
    if (auth.errorResponse) return auth.errorResponse;

    const cms = await loadCmsContent();
    return NextResponse.json({ cms });
  } catch (error: any) {
    console.error('[Admin CMS GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'cms.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const cms = body.cms || body;

    const current = await loadCmsContent();
    const updated: CmsContent = {
      ...current,
      announcementText: cms.announcementText !== undefined ? cms.announcementText : current.announcementText,
      announcementActive: cms.announcementActive !== undefined ? Boolean(cms.announcementActive) : current.announcementActive,
      heroSlides: cms.heroSlides !== undefined ? cms.heroSlides : current.heroSlides,
      promotionalBanner: cms.promotionalBanner !== undefined ? { ...current.promotionalBanner, ...cms.promotionalBanner } : current.promotionalBanner,
      trustBadges: cms.trustBadges !== undefined ? cms.trustBadges : current.trustBadges,
    };

    memoryCms = updated;
    const supabase = createServerClient();

    await supabase.from('site_settings').upsert({
      id: 'cms_content',
      settings: updated,
    });

    await logAdminAction({
      admin: auth.admin,
      action: 'cms.update',
      resourceType: 'cms',
      resourceId: 'cms_content',
      changes: cms,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    revalidatePath('/');
    revalidatePath('/admin/cms');

    return NextResponse.json({
      success: true,
      cms: updated,
      message: 'CMS sections updated successfully',
    });
  } catch (error: any) {
    console.error('[Admin CMS POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
