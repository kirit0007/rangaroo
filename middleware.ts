import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting map for Edge protection
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 60; // 60 requests per minute
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

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Handle preflight OPTIONS requests immediately
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

  // Rate limiting for API endpoints
  if (pathname.startsWith('/api/')) {
    const rawFwd = request.headers.get('x-forwarded-for');
    const ip = (rawFwd ? rawFwd.split(',')[0].trim() : null) || request.headers.get('x-real-ip') || 'anonymous';
    const now = Date.now();

    // Prevent memory leaks by capping rateLimitMap size and evicting expired entries
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

  const response = NextResponse.next();

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

export const config = {
  matcher: ['/admin/:path*', '/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
