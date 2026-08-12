import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting map for Edge protection
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 60; // 60 requests per minute
const WINDOW_MS = 60 * 1000;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for API endpoints
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const now = Date.now();

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
  const origin = request.headers.get('origin');
  if (origin && (origin.includes('rangaroo.store') || origin.includes('localhost') || origin.includes('vercel.app'))) {
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
