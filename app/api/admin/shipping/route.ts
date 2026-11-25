import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission, logAdminAction } from '@/lib/admin/adminAuth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export interface CourierPartner {
  id: string;
  name: string;
  code: string;
  serviceType: 'express' | 'surface' | 'standard';
  trackingUrlTemplate: string;
  isActive: boolean;
  rating: number;
}

const defaultCouriers: CourierPartner[] = [
  {
    id: 'delhivery',
    name: 'Delhivery Surface & Express',
    code: 'DELHIVERY',
    serviceType: 'express',
    trackingUrlTemplate: 'https://www.delhivery.com/track/package/{awb}',
    isActive: true,
    rating: 4.8,
  },
  {
    id: 'bluedart',
    name: 'Blue Dart Air Express',
    code: 'BLUEDART',
    serviceType: 'express',
    trackingUrlTemplate: 'https://www.bluedart.com/tracking?awb={awb}',
    isActive: true,
    rating: 4.9,
  },
  {
    id: 'xpressbees',
    name: 'XpressBees Logistics',
    code: 'XPRESSBEES',
    serviceType: 'surface',
    trackingUrlTemplate: 'https://www.xpressbees.com/track?awb={awb}',
    isActive: true,
    rating: 4.6,
  },
  {
    id: 'dtdc',
    name: 'DTDC Courier & Cargo',
    code: 'DTDC',
    serviceType: 'standard',
    trackingUrlTemplate: 'https://www.dtdc.in/tracking/tracking_results.asp?trkid={awb}',
    isActive: true,
    rating: 4.5,
  },
];

// Sample pin code registry for Indian postal serviceability
const PINCODE_METRO_PREFIXES = ['11', '12', '40', '41', '56', '50', '60', '70'];

function lookupPincode(pincode: string) {
  const clean = pincode.trim().replace(/[^0-9]/g, '');
  if (clean.length !== 6) {
    return { serviceable: false, error: 'Pincode must be exactly 6 numeric digits' };
  }

  const prefix = clean.substring(0, 2);
  const isMetro = PINCODE_METRO_PREFIXES.includes(prefix);

  let state = 'Karnataka';
  let city = 'Bengaluru';
  let zone: 'Metro' | 'Tier 1' | 'Tier 2' | 'Special' = 'Tier 2';
  let estimatedDays = 4;

  if (prefix === '11') {
    state = 'Delhi';
    city = 'New Delhi';
    zone = 'Metro';
    estimatedDays = 2;
  } else if (prefix === '40') {
    state = 'Maharashtra';
    city = 'Mumbai';
    zone = 'Metro';
    estimatedDays = 2;
  } else if (prefix === '56') {
    state = 'Karnataka';
    city = 'Bengaluru';
    zone = 'Metro';
    estimatedDays = 2;
  } else if (prefix === '50') {
    state = 'Telangana';
    city = 'Hyderabad';
    zone = 'Metro';
    estimatedDays = 3;
  } else if (prefix === '60') {
    state = 'Tamil Nadu';
    city = 'Chennai';
    zone = 'Metro';
    estimatedDays = 3;
  } else if (prefix === '70') {
    state = 'West Bengal';
    city = 'Kolkata';
    zone = 'Metro';
    estimatedDays = 3;
  } else if (isMetro) {
    zone = 'Tier 1';
    estimatedDays = 3;
  }

  return {
    serviceable: true,
    pincode: clean,
    city,
    state,
    zone,
    estimatedDays,
    codAvailable: true,
    prepaidAvailable: true,
    supportedCouriers: ['Delhivery', 'BlueDart', 'DTDC', 'XpressBees'],
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'shipping.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');

    // 1. Pincode lookup if provided
    if (pincode) {
      const result = lookupPincode(pincode);
      return NextResponse.json(result);
    }

    // 2. Otherwise return shipping configs and courier partners
    const supabase = createServerClient();
    let shippingRules = {
      standardShippingRate: 50,
      freeShippingThreshold: 499,
      expressShippingFee: 120,
      cashOnDeliveryFee: 40,
      estimatedDeliveryDaysMin: 2,
      estimatedDeliveryDaysMax: 5,
    };

    try {
      const { data: row } = await supabase
        .from('site_settings')
        .select('settings')
        .eq('id', 'shipping_rules')
        .single();

      if (row?.settings) {
        shippingRules = { ...shippingRules, ...row.settings };
      }
    } catch {}

    return NextResponse.json({
      couriers: defaultCouriers,
      rules: shippingRules,
      trackingStages: [
        'Order Confirmed',
        'Packed & Ready to Dispatch',
        'Handed Over to Courier',
        'In Transit',
        'Out for Delivery',
        'Delivered',
      ],
    });
  } catch (error: any) {
    console.error('[Admin Shipping GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'shipping.manage');
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { action, orderId, courierName, trackingAwb, status, reason, rules } = body;
    const supabase = createServerClient();

    // Action A: Generate AWB for an order
    if (action === 'generate_awb') {
      if (!orderId) {
        return NextResponse.json({ error: 'orderId is required to generate AWB' }, { status: 400 });
      }

      const assignedCourier = courierName || 'Delhivery Surface & Express';
      const awb = trackingAwb || `RNG-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;

      const { data: updatedOrder, error: updateErr } = await supabase
        .from('orders')
        .update({
          tracking_awb: awb,
          courier_name: assignedCourier,
          order_status: 'PROCESSING',
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      await logAdminAction({
        admin: auth.admin,
        action: 'shipping.awb_generated',
        resourceType: 'order',
        resourceId: orderId,
        changes: { courierName: assignedCourier, trackingAwb: awb },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      revalidatePath('/admin/orders');
      revalidatePath('/admin/shipping');

      return NextResponse.json({
        success: true,
        orderId,
        courierName: assignedCourier,
        trackingAwb: awb,
        status: 'processing',
        message: `AWB ${awb} generated and linked to order`,
      });
    }

    // Action B: Update tracking status (Dispatched, In Transit, Delivered)
    if (action === 'update_tracking') {
      if (!orderId || !status) {
        return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
      }

      const normStatus = status.toLowerCase();
      const dbStatus = normStatus.toUpperCase();

      const updateData: any = {
        status: normStatus,
        order_status: dbStatus,
        updated_at: new Date().toISOString(),
      };
      if (trackingAwb) updateData.tracking_awb = trackingAwb;
      if (courierName) updateData.courier_name = courierName;

      const { error: updErr } = await supabase
        .from('orders')
        .update(updateData)
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 400 });
      }

      await logAdminAction({
        admin: auth.admin,
        action: 'shipping.tracking_updated',
        resourceType: 'order',
        resourceId: orderId,
        changes: { status: normStatus, trackingAwb, courierName, reason },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      revalidatePath('/admin/orders');
      revalidatePath('/admin/shipping');

      return NextResponse.json({
        success: true,
        orderId,
        status: normStatus,
        trackingAwb,
        courierName,
      });
    }

    // Action C: Update Shipping Rules
    if (action === 'update_rules') {
      if (!rules) {
        return NextResponse.json({ error: 'rules payload required' }, { status: 400 });
      }

      await supabase.from('site_settings').upsert({
        id: 'shipping_rules',
        settings: rules,
      });

      await logAdminAction({
        admin: auth.admin,
        action: 'shipping.rules_updated',
        resourceType: 'shipping_rules',
        resourceId: 'shipping_rules',
        changes: rules,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      revalidatePath('/admin/shipping');
      revalidatePath('/checkout');

      return NextResponse.json({
        success: true,
        rules,
      });
    }

    return NextResponse.json({ error: 'Invalid or missing action in request body' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Shipping POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
