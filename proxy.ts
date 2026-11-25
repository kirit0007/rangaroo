import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// In-memory edge rate limiting map with automatic garbage collection
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 60; // 60 requests per minute per IP
const WINDOW_MS = 60 * 1000;
const MAX_MAP_SIZE = 5000;

function isAllowedOrigin(origin: string): boolean {
  if (origin === 'https://rangaroo.store' || origin === 'https://www.rangaroo.store') {
    return true;
  }
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    return true;
  }
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
    return true;
  }
  if (/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) {
    return true;
  }
  return false;
}

/**
 * Resolves the client IP address using trusted edge headers with strict prioritization:
 * 1. x-vercel-forwarded-for (authoritative Vercel edge header)
 * 2. x-real-ip
 * 3. x-forwarded-for (takes the RIGHTMOST hop to eliminate upstream client spoofing)
 */
export function getClientIp(headers: Headers): string | null {
  const vercelForwardedFor = headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor && vercelForwardedFor.trim()) {
    const parts = vercelForwardedFor.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }

  const realIp = headers.get('x-real-ip');
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor && forwardedFor.trim()) {
    const parts = forwardedFor.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1]; // RIGHTMOST hop!
    }
  }

  return null;
}

/**
 * Next.js 16 Proxy Implementation
 * 
 * Invariants:
 * 1. Synchronous handling for preflight OPTIONS (0ms latency, returns 204 directly).
 * 2. Untrusted alternate ingress rejection in production: requests without trusted IP headers return HTTP 400.
 * 3. Trusted IP resolution: prioritizes x-vercel-forwarded-for, then x-real-ip, then rightmost x-forwarded-for hop.
 * 4. Edge rate limiting on /api/ endpoints with LRU cleanup.
 * 5. Preserves Supabase SSR session token refresh on content requests.
 * 6. Does NOT set HttpOnly on Supabase browser-managed auth tokens.
 * 7. Enforces security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
 */
export function proxy(request: NextRequest): NextResponse | Promise<NextResponse> {
  const origin = request.headers.get('origin');

  // Handle preflight OPTIONS requests immediately (synchronous)
  if (request.method === 'OPTIONS') {
    const headers = new Headers();
    if (origin && isAllowedOrigin(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Max-Age', '86400');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return new NextResponse(null, { status: 204, headers });
  }

  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request.headers);

  // In production, reject requests lacking trusted IP headers with HTTP 400
  if (process.env.NODE_ENV === 'production' && !clientIp) {
    return new NextResponse(
      JSON.stringify({ error: 'Untrusted ingress: missing trusted edge IP header' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }

  // Rate limiting for API endpoints
  if (pathname.startsWith('/api/')) {
    const ip = clientIp || 'anonymous';
    const now = Date.now();

    // Prevent memory leaks by evicting expired entries
    if (rateLimitMap.size >= MAX_MAP_SIZE) {
      for (const [key, val] of rateLimitMap.entries()) {
        if (now - val.lastReset > WINDOW_MS) {
          rateLimitMap.delete(key);
        }
      }
      if (rateLimitMap.size >= MAX_MAP_SIZE) {
        rateLimitMap.clear();
      }
    }

    const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - record.lastReset > WINDOW_MS) {
      record.count = 1;
      record.lastReset = now;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(ip, record);

    if (record.count > LIMIT) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  return handleRequest(request, origin);
}

async function handleRequest(request: NextRequest, origin: string | null): Promise<NextResponse> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Supabase SSR Session Refresh (without forcing HttpOnly on browser auth cookies)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
          });
        },
      },
    });

    await supabase.auth.getUser();
  }

  // CORS settings for trusted origins
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  // Security headers on every response
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export default proxy;
export { proxy as middleware };

export const config = {
  matcher: ['/admin/:path*', '/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
