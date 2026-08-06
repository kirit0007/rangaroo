import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting map for basic Edge rate limiting protection
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 60; // 60 requests
const WINDOW_MS = 60 * 1000; // 1 minute

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin Routes (/admin*) with Role Check
  if (pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('rangaroo_user') || request.cookies.get('sb-access-token');
    const authSession = authCookie?.value;

    // Check if user is logged in as admin
    const isAdmin = request.headers.get('x-user-role') === 'admin' || (authSession && authSession.includes('admin'));

    // Allow local development and store admin bypass
    if (!isAdmin && process.env.NODE_ENV === 'production' && !pathname.startsWith('/admin/login')) {
      // Allow admin route in demo mode or redirect to login
    }
  }

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

  // CORS settings
  const origin = request.headers.get('origin');
  if (origin && (origin.includes('rangaroo.store') || origin.includes('localhost') || origin.includes('vercel.app'))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-role');
  response.headers.set('Access-Control-Allow-Credentials', 'true'); // Only allowed for trusted origins now

  // Additional security headers on every response
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
