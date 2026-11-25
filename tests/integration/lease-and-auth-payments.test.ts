import { Client } from 'pg';
import { ensureDatabaseRunning, createSession, createSessionPair } from '../helpers/connection';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  seedInventoryReservation,
  cleanTestFixtures,
} from '../helpers/db-fixtures';
import {
  assertStockMath,
  assertDistinctSessions,
  assertOrderStatus,
  assertReservationCount,
} from '../helpers/assertions';

export interface TestCaseResult {
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

/**
 * Suite: Reconciliation Leases & Authorized Payment Lifecycles
 *
 * Verifies:
 * 1. Two workers attempting to acquire a lease simultaneously (atomic mutual exclusion).
 * 2. Worker termination while owning a lease (crash resilience & TTL hold).
 * 3. Lease expiry and recovery.
 * 4. A second worker acquiring an expired lease (fence token incrementation).
 * 5. Preventing a stale worker from completing work after losing ownership (fencing safety).
 * 6. Authorization remaining active beyond normal inventory reservation TTL (reservation not expired while payment authorized).
 * 7. Capture after reservation expiry properly enters INVENTORY_CONFLICT.
 */
export async function runLeaseAndAuthSuite(): Promise<boolean> {
  const suiteStart = Date.now();
  console.log('='.repeat(80));
  console.log('RECONCILIATION LEASES & AUTHORIZED PAYMENT LIFECYCLES INTEGRATION SUITE');
  console.log('='.repeat(80));

  const dbUrl = await ensureDatabaseRunning();
  console.log(`Connected to Database: ${dbUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  const results: TestCaseResult[] = [];

  // Helper to record test results
  async function runCase(name: string, fn: () => Promise<string>): Promise<void> {
    const start = Date.now();
    try {
      const details = await fn();
      const durationMs = Date.now() - start;
      results.push({ name, passed: true, durationMs, details });
      console.log(`  ✓ [PASS] ${name} (${durationMs}ms)`);
      console.log(`         ${details}\n`);
    } catch (err: any) {
      const durationMs = Date.now() - start;
      const details = err.message || String(err);
      results.push({ name, passed: false, durationMs, details });
      console.log(`  ✗ [FAIL] ${name} (${durationMs}ms)`);
      console.log(`         ERROR: ${details}\n`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Two workers attempting to acquire a lease simultaneously
  // ---------------------------------------------------------------------------
  await runCase('Two workers attempting to acquire a lease simultaneously', async () => {
    const runId = generateRunId('lease_simul');
    const leaseName = `lease_${runId}`;
    const pair = await createSessionPair('lease_simul');

    try {
      assertDistinctSessions(pair.sessionA, pair.sessionB);

      // Race acquire_reconciliation_lease simultaneously from independent sessions
      const [resA, resB] = await Promise.all([
        pair.sessionA.client.query('SELECT public.acquire_reconciliation_lease($1, $2, $3) AS result', [
          leaseName,
          'worker_A',
          30,
        ]),
        pair.sessionB.client.query('SELECT public.acquire_reconciliation_lease($1, $2, $3) AS result', [
          leaseName,
          'worker_B',
          30,
        ]),
      ]);

      const resultA = resA.rows[0].result;
      const resultB = resB.rows[0].result;

      const aAcquired = resultA.acquired === true;
      const bAcquired = resultB.acquired === true;

      // Invariant: Exactly one must succeed, the other must be rejected
      if ((aAcquired && bAcquired) || (!aAcquired && !bAcquired)) {
        throw new Error(
          `Mutual exclusion violation: Worker A acquired=${aAcquired}, Worker B acquired=${bAcquired}`
        );
      }

      const winner = aAcquired ? 'worker_A' : 'worker_B';
      const loserResult = aAcquired ? resultB : resultA;

      if (loserResult.lease_owner !== winner) {
        throw new Error(`Loser lease_owner report mismatch: expected ${winner}, got ${loserResult.lease_owner}`);
      }

      // Check DB row
      const checkRes = await pair.sessionA.client.query(
        'SELECT lease_owner, fence_token FROM public.reconciliation_leases WHERE lease_name = $1',
        [leaseName]
      );
      if (checkRes.rowCount !== 1 || checkRes.rows[0].lease_owner !== winner || Number(checkRes.rows[0].fence_token) !== 1) {
        throw new Error(`DB state mismatch: owner=${checkRes.rows[0]?.lease_owner}, fence_token=${checkRes.rows[0]?.fence_token}`);
      }

      return `Mutual exclusion verified. Winner: ${winner} (fence_token=1). Competing worker rejected with acquired=false.`;
    } finally {
      await pair.sessionA.client.query('DELETE FROM public.reconciliation_leases WHERE lease_name = $1', [leaseName]);
      await pair.cleanup();
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Worker termination while owning a lease
  // ---------------------------------------------------------------------------
  await runCase('Worker termination while owning a lease', async () => {
    const runId = generateRunId('lease_crash');
    const leaseName = `lease_${runId}`;
    const sessionA = await createSession('lease_workerA');
    const sessionB = await createSession('lease_workerB');

    try {
      // Worker A acquires lease for 3 seconds
      const acqRes = await sessionA.client.query(
        'SELECT public.acquire_reconciliation_lease($1, $2, $3) AS result',
        [leaseName, 'worker_A', 3]
      );
      if (!acqRes.rows[0].result.acquired) {
        throw new Error('Initial lease acquisition failed for worker A');
      }

      // Worker A crashes / disconnects abruptly without releasing lease
      await sessionA.client.end();

      // Immediately, Worker B attempts to acquire before TTL expires (e.g. at ~100ms)
      const acqB = await sessionB.client.query(
        'SELECT public.acquire_reconciliation_lease($1, $2, $3) AS result',
        [leaseName, 'worker_B', 10]
      );

      if (acqB.rows[0].result.acquired === true) {
        throw new Error('Worker B acquired lease prematurely before Worker A TTL elapsed');
      }

      // DB row still reflects worker_A ownership
      const checkRes = await sessionB.client.query(
        'SELECT lease_owner, fence_token, lease_expires_at > clock_timestamp() AS is_active FROM public.reconciliation_leases WHERE lease_name = $1',
        [leaseName]
      );
      if (!checkRes.rows[0].is_active || checkRes.rows[0].lease_owner !== 'worker_A') {
        throw new Error('Lease row was corrupted or expired prematurely on worker disconnect');
      }

      return 'Crash resilience verified. Terminated worker connection did not crash DB or orphan lock; unexpired lease remains protected by TTL.';
    } finally {
      await sessionB.client.query('DELETE FROM public.reconciliation_leases WHERE lease_name = $1', [leaseName]);
      await sessionB.client.end().catch(() => {});
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 3: Lease expiry and recovery
  // ---------------------------------------------------------------------------
  await runCase('Lease expiry and recovery', async () => {
    const runId = generateRunId('lease_expiry');
    const leaseName = `lease_${runId}`;
    const session = await createSession('lease_exp_session');

    try {
      // Acquire lease with 1 second TTL
      const acq = await session.client.query(
        'SELECT public.acquire_reconciliation_lease($1, $2, $3) AS result',
        [leaseName, 'worker_original', 1]
      );
      if (!acq.rows[0].result.acquired) {
        throw new Error('Failed to acquire initial 1s lease');
      }

      // Wait 1.2s for lease to expire naturally
      await new Promise((r) => setTimeout(r, 1200));

      // Recovery: acquire again with new owner
      const recoverRes = await session.client.query(
        'SELECT public.acquire_reconciliation_lease($1, $2, $3) AS result',
        [leaseName, 'worker_recovery', 10]
      );

      const rData = recoverRes.rows[0].result;
      if (!rData.acquired || rData.lease_owner !== 'worker_recovery') {
        throw new Error(`Failed to recover expired lease: ${JSON.stringify(rData)}`);
      }

      if (rData.fence_token <= 1) {
        throw new Error(`Expected incremented fence_token on recovery, received ${rData.fence_token}`);
      }

      return `Expired lease automatically recovered by recovery worker. Fence token incremented from 1 to ${rData.fence_token}.`;
    } finally {
      await session.client.query('DELETE FROM public.reconciliation_leases WHERE lease_name = $1', [leaseName]);
      await session.client.end();
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 4: A second worker acquiring an expired lease
  // ---------------------------------------------------------------------------
  await runCase('A second worker acquiring an expired lease', async () => {
    const runId = generateRunId('lease_sec');
    const leaseName = `lease_${runId}`;
    const pair = await createSessionPair('lease_sec');

    try {
      // Worker 1 acquires with 1 second TTL
      const w1 = await pair.sessionA.client.query(
        'SELECT public.acquire_reconciliation_lease($1, $2, $3) AS result',
        [leaseName, 'worker_1', 1]
      );
      if (!w1.rows[0].result.acquired || w1.rows[0].result.fence_token !== 1) {
        throw new Error('Worker 1 failed to acquire lease with token 1');
      }

      // Wait 1.1s for lease expiration
      await new Promise((r) => setTimeout(r, 1100));

      // Worker 2 takes over expired lease
      const w2 = await pair.sessionB.client.query(
        'SELECT public.acquire_reconciliation_lease($1, $2, $3) AS result',
        [leaseName, 'worker_2', 30]
      );

      const w2Data = w2.rows[0].result;
      if (!w2Data.acquired || w2Data.lease_owner !== 'worker_2' || w2Data.fence_token !== 2) {
        throw new Error(`Worker 2 failed takeover: acquired=${w2Data.acquired}, owner=${w2Data.lease_owner}, fence=${w2Data.fence_token}`);
      }

      // Verify DB row
      const row = await pair.sessionA.client.query(
        'SELECT lease_owner, fence_token FROM public.reconciliation_leases WHERE lease_name = $1',
        [leaseName]
      );
      if (row.rows[0].lease_owner !== 'worker_2' || Number(row.rows[0].fence_token) !== 2) {
        throw new Error('DB row not updated to worker_2 with fence_token 2');
      }

      return 'Second worker acquired expired lease cleanly. Ownership updated to worker_2, fence_token safely bumped to 2.';
    } finally {
      await pair.sessionA.client.query('DELETE FROM public.reconciliation_leases WHERE lease_name = $1', [leaseName]);
      await pair.cleanup();
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 5: Preventing a stale worker from completing work after losing ownership
  // ---------------------------------------------------------------------------
  await runCase('Preventing a stale worker from completing work after losing ownership', async () => {
    const runId = generateRunId('lease_stale');
    const leaseName = `lease_${runId}`;
    const pair = await createSessionPair('lease_stale');

    try {
      // Worker 1 acquires lease with short TTL (1 sec)
      const w1Acq = await pair.sessionA.client.query(
        'SELECT public.acquire_reconciliation_lease($1, $2, $3) AS result',
        [leaseName, 'worker_1', 1]
      );
      const staleToken = w1Acq.rows[0].result.fence_token; // 1

      // Worker 1 hangs / pauses (sleep 1.2s)
      await new Promise((r) => setTimeout(r, 1200));

      // Worker 2 notices expiry and acquires lease
      const w2Acq = await pair.sessionB.client.query(
        'SELECT public.acquire_reconciliation_lease($1, $2, $3) AS result',
        [leaseName, 'worker_2', 30]
      );
      if (!w2Acq.rows[0].result.acquired || w2Acq.rows[0].result.fence_token !== 2) {
        throw new Error('Worker 2 failed takeover');
      }

      // Stale Worker 1 wakes up and tries heartbeat with old token 1
      const staleHeartbeat = await pair.sessionA.client.query(
        'SELECT public.heartbeat_reconciliation_lease($1, $2, $3, $4) AS renewed',
        [leaseName, 'worker_1', staleToken, 30]
      );
      if (staleHeartbeat.rows[0].renewed === true) {
        throw new Error('FENCING VIOLATION: Stale worker renewed lease with obsolete fence token!');
      }

      // Stale Worker 1 tries release with old token 1
      const staleRelease = await pair.sessionA.client.query(
        'SELECT public.release_reconciliation_lease($1, $2, $3) AS released',
        [leaseName, 'worker_1', staleToken]
      );
      if (staleRelease.rows[0].released === true) {
        throw new Error('FENCING VIOLATION: Stale worker released lease owned by Worker 2!');
      }

      // Verify Worker 2 still owns the lease securely
      const dbRow = await pair.sessionB.client.query(
        'SELECT lease_owner, fence_token FROM public.reconciliation_leases WHERE lease_name = $1',
        [leaseName]
      );
      if (dbRow.rows[0].lease_owner !== 'worker_2' || Number(dbRow.rows[0].fence_token) !== 2) {
        throw new Error('Worker 2 ownership was compromised by stale worker');
      }

      return 'Fencing verified: Stale worker rejected on heartbeat & release. Active owner worker_2 (fence_token=2) fully protected.';
    } finally {
      await pair.sessionA.client.query('DELETE FROM public.reconciliation_leases WHERE lease_name = $1', [leaseName]);
      await pair.cleanup();
    }
  });

  // ---------------------------------------------------------------------------
  // TEST 6: Authorization remaining active beyond normal inventory reservation TTL
  // ---------------------------------------------------------------------------
  await runCase(
    'Authorization remaining active beyond normal inventory reservation TTL (reservation not expired while payment authorized)',
    async () => {
      const runId = generateRunId('auth_ttl');
      const session = await createSession('auth_ttl_session');
      const prodId = `prod_auth_${runId}`;
      const orderId = `ord_auth_${runId}`;
      const stock = 10;
      const reserved = 2;

      try {
        await seedProduct(session.client, {
          id: prodId,
          stock,
          reserved_quantity: reserved,
        });

        // Seed order with payment_status = 'authorized'
        await seedOrder(session.client, {
          id: orderId,
          order_status: 'PENDING',
          payment_status: 'authorized' as any,
          total_amount: 1000,
        });

        // Seed reservation that expired 10 seconds ago
        await seedInventoryReservation(session.client, {
          order_id: orderId,
          product_id: prodId,
          quantity: reserved,
          status: 'PENDING',
          expires_at: new Date(Date.now() - 10000),
        });

        // Run expiration sweeper
        const sweepRes = await session.client.query(
          'SELECT public.release_expired_reservations() AS swept_count'
        );
        const swept = Number(sweepRes.rows[0].swept_count);

        // Invariant: Sweeper must skip reservations whose order has payment_status 'authorized'
        if (swept !== 0) {
          throw new Error(`Sweeper incorrectly swept ${swept} reservation(s) for an authorized order!`);
        }

        // Check reservation is still PENDING
        const resRows = await assertReservationCount(session.client, orderId, 1, 'PENDING');
        if (resRows[0].status !== 'PENDING') {
          throw new Error(`Reservation status expected PENDING, found ${resRows[0].status}`);
        }

        // Check stock math is untouched
        await assertStockMath(session.client, prodId, stock, reserved);

        return 'Authorized payment invariant verified: Reservation hold preserved past TTL; release_expired_reservations() skipped authorized order.';
      } finally {
        await cleanTestFixtures(session.client, runId);
        await session.client.end();
      }
    }
  );

  // ---------------------------------------------------------------------------
  // TEST 7: Capture after reservation expiry properly enters INVENTORY_CONFLICT
  // ---------------------------------------------------------------------------
  await runCase('Capture after reservation expiry properly enters INVENTORY_CONFLICT', async () => {
    const runId = generateRunId('late_cap');
    const session = await createSession('late_cap_session');
    const prodId = `prod_late_${runId}`;
    const orderId = `ord_late_${runId}`;
    const stock = 8;

    try {
      // Seed product with 0 reserved
      await seedProduct(session.client, {
        id: prodId,
        stock,
        reserved_quantity: 0,
      });

      // Seed order with PENDING
      await seedOrder(session.client, {
        id: orderId,
        order_status: 'PENDING',
        payment_status: 'PENDING',
        total_amount: 750,
      });

      // Seed already EXPIRED reservation
      await seedInventoryReservation(session.client, {
        order_id: orderId,
        product_id: prodId,
        quantity: 2,
        status: 'EXPIRED',
        expires_at: new Date(Date.now() - 60000),
      });

      // Confirm payment arrives late (e.g. webhook delivery after hold expired)
      const confirmRes = await session.client.query(
        'SELECT public.confirm_order_payment($1, $2) AS result',
        [orderId, `pay_late_${runId}`]
      );

      const resData = confirmRes.rows[0].result;

      // Invariant: order must enter INVENTORY_CONFLICT to avoid ghost order fulfillment
      await assertOrderStatus(session.client, orderId, 'INVENTORY_CONFLICT', 'PAID');

      // Invariant: physical stock must NOT be decremented (stock remains 8, reserved remains 0)
      await assertStockMath(session.client, prodId, stock, 0);

      return 'Late capture invariant verified: Order safely routed to INVENTORY_CONFLICT, payment marked PAID, zero stock deducted.';
    } finally {
      await cleanTestFixtures(session.client, runId);
      await session.client.end();
    }
  });

  const duration = Date.now() - suiteStart;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('='.repeat(80));
  console.log('RECONCILIATION LEASES & AUTH PAYMENTS SUITE EXECUTION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Scenarios:    ${results.length}`);
  console.log(`Passed:             ${passed}`);
  console.log(`Failed / Defects:   ${failed}`);
  console.log(`Total Duration:     ${duration}ms\n`);

  return failed === 0;
}

// Direct CLI execution
if (require.main === module || process.argv[1]?.includes('lease-and-auth-payments')) {
  runLeaseAndAuthSuite()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
      console.error('FATAL TEST ERROR:', err);
      process.exit(1);
    });
}
