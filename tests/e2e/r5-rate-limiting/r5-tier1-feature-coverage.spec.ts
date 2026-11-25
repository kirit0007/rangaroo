import { defineSuite, expect } from '../helpers/test-runner';
import { createSuperuserClient } from '../helpers/db-client';
import { generateRunId, cleanTestFixtures } from '../helpers/fixtures';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

export const suite = defineSuite('R5 Distributed Rate Limiting - Tier 1 Feature Coverage', (s) => {
  const runId = generateRunId('r5_t1');

  s.afterAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await cleanTestFixtures(superuser, runId);
    } finally {
      await superuser.end();
    }
  });

  // R5-T1-01: check_rate_limit allows within limit
  s.test('R5-T1-01', 'check_rate_limit returns true for requests within specified limit', async () => {
    const superuser = await createSuperuserClient();
    const rateLimitKey = `rl_allow_${runId}`;
    try {
      // 5 requests allowed with limit = 5
      for (let i = 1; i <= 5; i++) {
        const res = await superuser.query(
          'SELECT public.check_rate_limit($1, 5, 60) AS allowed',
          [rateLimitKey]
        );
        expect(res.rows[0].allowed).toBe(true);
      }

      // Check stored counter
      const dbRes = await superuser.query(
        'SELECT count FROM public.rate_limits WHERE key = $1',
        [rateLimitKey]
      );
      expect(Number(dbRes.rows[0].count)).toBe(5);
    } finally {
      await superuser.end();
    }
  });

  // R5-T1-02: check_rate_limit rejects call exceeding limit
  s.test('R5-T1-02', 'check_rate_limit returns false when request count exceeds limit', async () => {
    const superuser = await createSuperuserClient();
    const rateLimitKey = `rl_reject_${runId}`;
    try {
      // Consume all 3 slots
      for (let i = 1; i <= 3; i++) {
        await superuser.query('SELECT public.check_rate_limit($1, 3, 60)', [rateLimitKey]);
      }

      // 4th request must be rejected
      const res = await superuser.query(
        'SELECT public.check_rate_limit($1, 3, 60) AS allowed',
        [rateLimitKey]
      );
      expect(res.rows[0].allowed).toBe(false);
    } finally {
      await superuser.end();
    }
  });

  // R5-T1-03: Guest order tracking route rate limiting (5 req/min)
  s.test('R5-T1-03', 'Guest order tracking rate limit key enforces 5 requests per minute ceiling', async () => {
    const superuser = await createSuperuserClient();
    const clientIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    const trackKey = `guest_track:${clientIp}`;
    try {
      // Allow 5 requests
      for (let i = 1; i <= 5; i++) {
        const res = await superuser.query(
          'SELECT public.check_rate_limit($1, 5, 60) AS allowed',
          [trackKey]
        );
        expect(res.rows[0].allowed).toBe(true);
      }

      // 6th request rejected
      const res6 = await superuser.query(
        'SELECT public.check_rate_limit($1, 5, 60) AS allowed',
        [trackKey]
      );
      expect(res6.rows[0].allowed).toBe(false);
    } finally {
      await superuser.end();
    }
  });

  // R5-T1-04: Checkout endpoint rate limiting
  s.test('R5-T1-04', 'Checkout endpoint rate limiting blocks flood requests to protect connection pool', async () => {
    const superuser = await createSuperuserClient();
    const checkoutKey = `checkout_ip_${runId}`;
    try {
      const checkoutLimit = 10;
      for (let i = 1; i <= checkoutLimit; i++) {
        const res = await superuser.query(
          'SELECT public.check_rate_limit($1, $2, 60) AS allowed',
          [checkoutKey, checkoutLimit]
        );
        expect(res.rows[0].allowed).toBe(true);
      }

      // Exceeded
      const resExceeded = await superuser.query(
        'SELECT public.check_rate_limit($1, $2, 60) AS allowed',
        [checkoutKey, checkoutLimit]
      );
      expect(resExceeded.rows[0].allowed).toBe(false);
    } finally {
      await superuser.end();
    }
  });

  // R5-T1-05: Rate limit key isolation between distinct clients
  s.test('R5-T1-05', 'Rate limit keys are strictly isolated; client A being rate limited does not affect client B', async () => {
    const superuser = await createSuperuserClient();
    const keyClientA = `client_a_${runId}`;
    const keyClientB = `client_b_${runId}`;
    try {
      // Exhaust Client A (limit 2)
      await superuser.query('SELECT public.check_rate_limit($1, 2, 60)', [keyClientA]);
      await superuser.query('SELECT public.check_rate_limit($1, 2, 60)', [keyClientA]);

      // Client A is blocked
      const resA = await superuser.query('SELECT public.check_rate_limit($1, 2, 60) AS allowed', [keyClientA]);
      expect(resA.rows[0].allowed).toBe(false);

      // Client B is NOT blocked
      const resB = await superuser.query('SELECT public.check_rate_limit($1, 2, 60) AS allowed', [keyClientB]);
      expect(resB.rows[0].allowed).toBe(true);
    } finally {
      await superuser.end();
    }
  });

  // R5-T1-06: Proxy security header injection
  s.test('R5-T1-06', 'Proxy edge layer injects nosniff and SAMEORIGIN security headers on all responses', async () => {
    const req = new NextRequest('http://localhost:3000/api/products');
    const res = await proxy(req);

    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
  });
});
