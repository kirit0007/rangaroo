import { createSessionPair } from '../../helpers/connection';
import { Barrier } from '../../helpers/barrier';
import {
  generateRunId,
  seedOrder,
  seedCoupon,
  cleanTestFixtures,
} from '../../helpers/db-fixtures';
import {
  assertCouponReservationCount,
  assertDistinctSessions,
} from '../../helpers/assertions';
import { TestResult } from './01-same-order-reservation.test';

/**
 * Race 5: Coupon Final-Use Contention (Zero Oversubscription)
 *
 * Vulnerability Vector:
 * Two customers race to claim the single remaining usage of a limited-use promotional coupon (max_uses = 1).
 * Without row-level exclusive locks (SELECT ... FOR UPDATE) and active hold counting across both
 * confirmed and unexpired pending reservations, both checkouts could succeed, exceeding promotional budget.
 *
 * Guaranteed Invariant:
 * Exactly ONE customer reservation succeeds.
 * Exactly ONE customer reservation fails with COUPON_EXHAUSTED.
 * Exactly 1 row created in coupon_reservations.
 * Zero oversubscription guaranteed.
 */
export async function runTest(): Promise<TestResult> {
  const startTime = Date.now();
  const runId = generateRunId('race5');
  const pair = await createSessionPair('race5');

  try {
    assertDistinctSessions(pair.sessionA, pair.sessionB);

    const couponCode = `SAVE100_${runId.toUpperCase()}`;
    const orderId1 = `ord_cup1_${runId}`;
    const orderId2 = `ord_cup2_${runId}`;
    const email1 = `customer1_${runId}@example.com`;
    const email2 = `customer2_${runId}@example.com`;

    // 1. Seed coupon with max_uses = 1, used_count = 0
    await seedCoupon(pair.sessionA.client, {
      code: couponCode,
      discount_type: 'FIXED',
      discount_value: 100.0,
      min_order_amount: 200.0,
      max_uses: 1,
      max_uses_per_user: 1,
      used_count: 0,
      is_active: true,
    });

    // Seed orders for both customers with subtotal 500
    await seedOrder(pair.sessionA.client, {
      id: orderId1,
      customer_email: email1,
      subtotal: 500,
      total_amount: 500,
    });
    await seedOrder(pair.sessionA.client, {
      id: orderId2,
      customer_email: email2,
      subtotal: 500,
      total_amount: 500,
    });

    // 2. Setup Barrier for simultaneous dispatch
    const barrier = new Barrier(2);

    const execClaim = async (
      session: typeof pair.sessionA,
      orderId: string,
      email: string
    ) => {
      await barrier.wait(5000);
      return session.client.query(
        'SELECT public.reserve_coupon_usage($1, $2, $3, $4, $5) AS result',
        [couponCode, orderId, email, 500.0, 15]
      );
    };

    // 3. Dispatch simultaneous claims across independent PostgreSQL connections
    const [res1, res2] = await Promise.allSettled([
      execClaim(pair.sessionA, orderId1, email1),
      execClaim(pair.sessionB, orderId2, email2),
    ]);

    // 4. Assert exactly ONE success and exactly ONE failure
    const successful: any[] = [];
    const failed: any[] = [];

    if (res1.status === 'fulfilled' && res1.value.rows[0]?.result?.success) {
      successful.push({ user: '1', data: res1.value.rows[0].result });
    } else {
      failed.push({
        user: '1',
        error: res1.status === 'rejected' ? res1.reason.message : 'failed',
      });
    }

    if (res2.status === 'fulfilled' && res2.value.rows[0]?.result?.success) {
      successful.push({ user: '2', data: res2.value.rows[0].result });
    } else {
      failed.push({
        user: '2',
        error: res2.status === 'rejected' ? res2.reason.message : 'failed',
      });
    }

    if (successful.length !== 1 || failed.length !== 1) {
      throw new Error(
        `COUPON CONCURRENCY VIOLATION: Expected exactly 1 claim to succeed and 1 to fail. Succeeded: ${successful.length}, Failed: ${failed.length}. Outcomes: 1=${JSON.stringify(
          res1
        )}, 2=${JSON.stringify(res2)}`
      );
    }

    // Verify rejection specifies exhaustion
    const failureMsg = failed[0].error;
    if (!failureMsg.includes('COUPON_EXHAUSTED') && !failureMsg.includes('limit')) {
      throw new Error(
        `Expected failure error to cite COUPON_EXHAUSTED or limit, got: ${failureMsg}`
      );
    }

    // 5. Assert table invariant: exactly 1 reservation in public.coupon_reservations
    await assertCouponReservationCount(pair.sessionA.client, couponCode, 1);

    const durationMs = Date.now() - startTime;
    return {
      name: '05-coupon-final-use',
      passed: true,
      durationMs,
      details: `Zero-oversubscription verified. Exactly 1 user claimed final coupon use; competing user rejected with COUPON_EXHAUSTED. Exactly 1 reservation row. PIDs: [${pair.sessionA.pid}, ${pair.sessionB.pid}]`,
      pids: { sessionA: pair.sessionA.pid, sessionB: pair.sessionB.pid },
    };
  } finally {
    try {
      await cleanTestFixtures(pair.sessionA.client, runId);
    } catch {
      // Ignore cleanup error to preserve test exception
    }
    await pair.cleanup();
  }
}

if (process.argv[1] && process.argv[1].includes('05-coupon-final-use')) {
  runTest()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}
