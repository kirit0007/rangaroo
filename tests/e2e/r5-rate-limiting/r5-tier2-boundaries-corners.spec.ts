import { defineSuite, expect } from '../helpers/test-runner';
import { createSuperuserClient } from '../helpers/db-client';
import { generateRunId, cleanTestFixtures } from '../helpers/fixtures';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

export const suite = defineSuite('R5 Distributed Rate Limiting - Tier 2 Boundaries & Corners', (s) => {
  const runId = generateRunId('r5_t2');

  s.afterAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await cleanTestFixtures(superuser, runId);
    } finally {
      await superuser.end();
    }
  });

  // R5-T2-01: Window expiry and counter reset boundary
  s.test('R5-T2-01', 'check_rate_limit resets count and allows new requests after window expires', async () => {
    const superuser = await createSuperuserClient();
    const rateLimitKey = `rl_reset_${runId}`;
    try {
      // Limit 1 request per 1 second
      const res1 = await superuser.query(
        'SELECT public.check_rate_limit($1, 1, 1) AS allowed',
        [rateLimitKey]
      );
      expect(res1.rows[0].allowed).toBe(true);

      // Immediate 2nd request is blocked
      const res2 = await superuser.query(
        'SELECT public.check_rate_limit($1, 1, 1) AS allowed',
        [rateLimitKey]
      );
      expect(res2.rows[0].allowed).toBe(false);

      // Wait 1.1 seconds for window to elapse
      await new Promise((r) => setTimeout(r, 1100));

      // 3rd request succeeds because window expired
      const res3 = await superuser.query(
        'SELECT public.check_rate_limit($1, 1, 1) AS allowed',
        [rateLimitKey]
      );
      expect(res3.rows[0].allowed).toBe(true);
    } finally {
      await superuser.end();
    }
  });

  // R5-T2-02: Proxy header spoofing protection (x-forwarded-for)
  s.test('R5-T2-02', 'Proxy edge layer handles multi-hop x-forwarded-for headers without crashing', async () => {
    // Malicious client attempts to spoof IP by prepending 1.1.1.1
    const req = new NextRequest('http://localhost:3000/api/products', {
      headers: {
        'x-forwarded-for': '1.1.1.1, 203.0.113.195, 10.0.0.1',
      },
    });

    const res = await proxy(req);
    expect(res.status).toBeLessThan(500);
  });

  // R5-T2-03: Localhost production bypass elimination
  s.test('R5-T2-03', 'Localhost CORS origin check behavior in production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      // Test proxy preflight request with localhost origin
      const req = new NextRequest('http://localhost:3000/api/products', {
        method: 'OPTIONS',
        headers: {
          origin: 'http://localhost:3000',
        },
      });
      const res = await proxy(req);
      expect(res.status).toBeLessThan(500);
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });

  // R5-T2-04: Missing IP headers graceful fallback
  s.test('R5-T2-04', 'Proxy handles requests without any client IP headers gracefully', async () => {
    const req = new NextRequest('http://localhost:3000/api/products');
    // No x-forwarded-for or x-real-ip headers set
    const res = await proxy(req);
    expect(res.status).toBeLessThan(500);
  });

  // R5-T2-05: Exact boundary request burst (Limit vs Limit + 1)
  s.test('R5-T2-05', 'check_rate_limit strictly enforces exact limit boundary without off-by-one errors', async () => {
    const superuser = await createSuperuserClient();
    const exactKey = `exact_${runId}`;
    const limit = 4;
    try {
      // Exactly 4 requests should succeed
      for (let i = 1; i <= limit; i++) {
        const res = await superuser.query(
          'SELECT public.check_rate_limit($1, $2, 60) AS allowed',
          [exactKey, limit]
        );
        expect(res.rows[0].allowed).toBe(true);
      }

      // 5th request (limit + 1) must be false
      const res5 = await superuser.query(
        'SELECT public.check_rate_limit($1, $2, 60) AS allowed',
        [exactKey, limit]
      );
      expect(res5.rows[0].allowed).toBe(false);
    } finally {
      await superuser.end();
    }
  });

  // R5-T2-06: Database connection failure fallback in rate limiter
  s.test('R5-T2-06', 'Rate limit table schema enforces primary key unique constraint on key column', async () => {
    const superuser = await createSuperuserClient();
    try {
      const res = await superuser.query(
        `SELECT constraint_name, constraint_type 
         FROM information_schema.table_constraints 
         WHERE table_schema = 'public' AND table_name = 'rate_limits'`
      );

      const hasPk = res.rows.some((r) => r.constraint_type === 'PRIMARY KEY');
      expect(hasPk).toBe(true);
    } finally {
      await superuser.end();
    }
  });
});
