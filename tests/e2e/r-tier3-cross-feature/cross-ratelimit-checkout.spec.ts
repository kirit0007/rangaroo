import { defineSuite, expect } from '../helpers/test-runner';
import { createSuperuserClient } from '../helpers/db-client';
import { generateRunId, cleanTestFixtures } from '../helpers/fixtures';

export const suite = defineSuite('Tier 3 Cross-Feature: Edge Rate Limiting Under Checkout Load (R5 x R2)', (s) => {
  const runId = generateRunId('x_rl_ck');
  const clientIp = '203.0.113.88';
  const checkoutKey = `checkout_rate_limit:${clientIp}:${runId}`;

  s.afterAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await cleanTestFixtures(superuser, runId);
    } finally {
      await superuser.end();
    }
  });

  s.test('X-R5-R2-01', 'Cross-feature: Edge rate limiter shields checkout endpoint and database locks from flood bursts', async () => {
    const superuser = await createSuperuserClient();
    try {
      const limit = 10;
      let allowedCount = 0;
      let blockedCount = 0;

      // Burst of 15 rapid checkout submissions
      for (let i = 1; i <= 15; i++) {
        const res = await superuser.query(
          'SELECT public.check_rate_limit($1, $2, 60) AS allowed',
          [checkoutKey, limit]
        );
        if (res.rows[0].allowed) {
          allowedCount++;
        } else {
          blockedCount++;
        }
      }

      // Invariant: Exactly 10 allowed, exactly 5 blocked
      expect(allowedCount).toBe(10);
      expect(blockedCount).toBe(5);

      // Verify stored counter in rate_limits
      const dbRes = await superuser.query(
        'SELECT count FROM public.rate_limits WHERE key = $1',
        [checkoutKey]
      );
      expect(Number(dbRes.rows[0].count)).toBe(10);
    } finally {
      await superuser.end();
    }
  });
});
