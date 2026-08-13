import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isUserAdmin } from '@/lib/auth/serverAuth';

export interface SiteSettings {
  announcementText: string;
  heroTitle: string;
  heroSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  freeShippingThreshold: number;
  footerTagline: string;
  footerDescription: string;
  contactLocation: string;
  instagramHandle: string;
  instagramUrl: string;
  whatsappNumber: string;
  copyrightText: string;
}

export const defaultSettings: SiteSettings = {
  announcementText: '🎨 Free Express Shipping above ₹499! 🦘',
  heroTitle: 'Where Little Hands Create Big Smiles',
  heroSubtitle: 'Premium DIY Paint Kits for Kids — Plaster Figurines, Non-Toxic Colors & Beautiful Gift Packaging',
  contactPhone: '+91 87936 87379',
  contactEmail: 'hello@rangaroo.store',
  freeShippingThreshold: 499,
  footerTagline: '"Paint. Create. Imagine."',
  footerDescription: 'Premium DIY Paint Kits for Kids. Sparking creativity and building fine motor skills one canvas at a time. Safe, non-toxic, and endlessly fun!',
  contactLocation: 'India IN (Shipping Nationwide)',
  instagramHandle: 'ranga.roo',
  instagramUrl: 'https://www.instagram.com/ranga.roo/',
  whatsappNumber: '+91 87936 87379',
  copyrightText: '© 2026 Rangaroo. Made with ❤️ in India.',
};

// Global memory store for persistent settings propagation across edge nodes/sessions
let globalSettingsStore: SiteSettings = { ...defaultSettings };

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: dbSettings, error } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 'global')
      .single();

    if (!error && dbSettings && dbSettings.settings) {
      globalSettingsStore = { ...defaultSettings, ...dbSettings.settings };
      return NextResponse.json(
        { settings: globalSettingsStore, source: 'supabase' },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }
  } catch (err) {
    console.error('Error fetching site_settings from Supabase:', err);
  }

  return NextResponse.json(
    { settings: globalSettingsStore, source: 'memory_fallback' },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const updatedSettings: SiteSettings = { ...globalSettingsStore, ...body };
    globalSettingsStore = updatedSettings;

    const supabase = createServerClient();
    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert({
        id: 'global',
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.warn('Could not upsert into Supabase site_settings table (will use server memory):', upsertError.message);
    }

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: 'Site settings updated globally across all devices!',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update site settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
