import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const PRIMARY_KEY_VERSION = process.env.GUEST_TRACKING_PRIMARY_KEY_VERSION || 'v1';

/**
 * Resolves the HMAC secret for a specific key version from server-side environment variables.
 * Invariant: Secrets are strictly server-side and never exposed to clients, DB rows, or logs.
 */
function getHmacSecretForVersion(version: string): string {
  const upper = version.toUpperCase();
  const versionSecret = process.env[`GUEST_TRACKING_HMAC_SECRET_${upper}`];
  if (versionSecret) {
    return versionSecret;
  }

  const defaultSecret = process.env.GUEST_TRACKING_HMAC_SECRET;
  if (defaultSecret) {
    return defaultSecret;
  }

  return 'rangaroo-default-dev-hmac-secret-v1';
}

/**
 * Computes a keyed HMAC-SHA256 digest for an incoming raw token using the versioned secret.
 */
function computeKeyedHmac(token: string, version: string): string {
  const secret = getHmacSecretForVersion(version);
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

/**
 * Timing-safe constant-time hexadecimal buffer equality check.
 * Protects against side-channel timing analysis attacks.
 */
function timingSafeCompareHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length || bufA.length === 0) {
    const dummy = Buffer.alloc(32, 0);
    crypto.timingSafeEqual(dummy, dummy);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    return fwd.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

function maskName(name: string): string {
  return name.replace(/(\w)\w+/g, '$1***');
}

function maskEmail(email: string): string {
  return email.replace(/^(.)(.*)(@.)(.*)(\..*)$/, '$1***$3***$5');
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return phone.slice(0, 3) + ' ***** **' + phone.slice(-3);
}

/**
 * Secure Guest Order Tracking Route
 * Accepts orderNumber and raw token query parameters.
 * Validates against versioned HMAC-SHA256 hash at rest, enforces rate limiting,
 * provides transparent key rotation upgrade, and returns masked customer data.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const token = searchParams.get('token');

    if (!orderNumber || !token) {
      return NextResponse.json(
        { error: 'Order number and tracking token are required', message: 'Order number and tracking token are required' },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const supabase = createServerClient();

    // 1. Rate Limiting Check (Max 5 requests per minute per IP)
    const { data: isAllowed, error: rlErr } = await supabase.rpc('check_rate_limit', {
      p_key: `guest_track:${clientIp}`,
      p_limit: 5,
      p_window_seconds: 60,
    });

    if (!rlErr && isAllowed === false) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many tracking attempts. Please try again in 1 minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 2. Query order by order_number or id
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        order_status,
        payment_status,
        total,
        total_amount,
        subtotal,
        shipping_fee,
        discount_amount,
        customer_name,
        customer_email,
        customer_phone,
        city,
        state,
        pin_code,
        items,
        tracking_token_hash,
        tracking_token_expires_at,
        tracking_token_revoked_at,
        created_at
      `)
      .or(`order_number.eq.${orderNumber},id.eq.${orderNumber}`)
      .single();

    // 3. Cryptographic Token Verification
    const storedHash = order?.tracking_token_hash;
    let isMatch = false;

    if (storedHash && typeof storedHash === 'string') {
      const colonIndex = storedHash.indexOf(':');
      if (colonIndex > 0) {
        // Versioned token hash format (e.g. v1:<hex>, v2:<hex>)
        const tokenVersion = storedHash.slice(0, colonIndex);
        const storedDigest = storedHash.slice(colonIndex + 1);
        const computedDigest = computeKeyedHmac(token, tokenVersion);
        isMatch = timingSafeCompareHex(computedDigest, storedDigest);
      } else {
        // Legacy unversioned format fallback (plain sha256 or unversioned HMAC)
        const plainSha256 = crypto.createHash('sha256').update(token).digest('hex');
        const legacyHmac = computeKeyedHmac(token, 'v1');
        isMatch = timingSafeCompareHex(plainSha256, storedHash) || timingSafeCompareHex(legacyHmac, storedHash);
      }
    } else {
      // Order not found or tracking token absent: execute constant-time dummy comparison
      const dummy = Buffer.alloc(32, 0);
      crypto.timingSafeEqual(dummy, dummy);
    }

    if (orderErr || !order || !isMatch) {
      // Anti-enumeration: Return generic 404
      return NextResponse.json(
        { error: 'ORDER_NOT_FOUND', message: 'Order not found or tracking link is invalid' },
        { status: 404 }
      );
    }

    // 4. Transparent upgrade of historical / legacy token to current primary key version
    const primaryDigest = computeKeyedHmac(token, PRIMARY_KEY_VERSION);
    const expectedPrimaryFormat = `${PRIMARY_KEY_VERSION}:${primaryDigest}`;
    if (order.id && storedHash !== expectedPrimaryFormat) {
      await supabase
        .from('orders')
        .update({
          tracking_token_hash: expectedPrimaryFormat,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);
    }

    // 5. Expiration check
    if (order.tracking_token_expires_at && new Date() > new Date(order.tracking_token_expires_at)) {
      return NextResponse.json(
        { error: 'LINK_EXPIRED', message: 'Tracking link has expired' },
        { status: 410 }
      );
    }

    // 6. Revocation check
    if (order.tracking_token_revoked_at) {
      return NextResponse.json(
        { error: 'LINK_REVOKED', message: 'Tracking link has been revoked' },
        { status: 403 }
      );
    }

    // 7. Return masked customer data
    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.order_number,
        status: order.order_status || order.status,
        orderStatus: order.order_status || order.status,
        paymentStatus: order.payment_status,
        createdAt: order.created_at,
        customerName: maskName(order.customer_name || 'Customer'),
        customerEmail: maskEmail(order.customer_email || 'customer@example.com'),
        customerPhone: maskPhone(order.customer_phone || '+910000000000'),
        city: order.city,
        state: order.state,
        pinCode: order.pin_code,
        subtotal: order.subtotal,
        shippingFee: order.shipping_fee,
        discountAmount: order.discount_amount,
        total: order.total || order.total_amount,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      },
    });
  } catch (error: unknown) {
    console.error('[Guest Order Track Error]', error);
    return NextResponse.json({ error: 'Failed to retrieve tracking details' }, { status: 500 });
  }
}
