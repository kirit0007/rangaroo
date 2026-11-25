import { createSessionPair } from '../../helpers/connection';
import { Barrier } from '../../helpers/barrier';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  cleanTestFixtures,
} from '../../helpers/db-fixtures';
import {
  assertStockMath,
  assertDistinctSessions,
} from '../../helpers/assertions';
import { TestResult } from './01-same-order-reservation.test';

/**
 * Race 2: Two Customers Racing for Final Stock (Zero Oversell)
 *
 * Vulnerability Vector:
 * Two distinct customers submit orders for the last remaining unit of an item (stock = 1, available = 1)
 * at the exact same millisecond. Without strict row-level locking (SELECT ... FOR UPDATE) and fresh
 * stock evaluation, both transactions could pass availability checks and reserve stock, causing
 * physical oversell (available = -1).
 *
 * Guaranteed Invariant:
 * Exactly ONE customer reservation succeeds.
 * Exactly ONE customer reservation fails with INSUFFICIENT_STOCK.
 * Physical stock remains 1, reserved_quantity = 1, available stock = 0 (NEVER negative).
 * Zero deadlocks (40P01).
 */
export async function runTest(): Promise<TestResult> {
  const startTime = Date.now();
  const runId = generateRunId('race2');
  const pair = await createSessionPair('race2');

  try {
    assertDistinctSessions(pair.sessionA, pair.sessionB);

    const productId = `prod_${runId}`;
    const orderIdA = `ord_A_${runId}`;
    const orderIdB = `ord_B_${runId}`;
    const initialStock = 1;
    const initialReserved = 0;
    const requestedQty = 1;

    // 1. Seed initial fixtures with exactly 1 unit of stock
    await seedProduct(pair.sessionA.client, {
      id: productId,
      stock: initialStock,
      reserved_quantity: initialReserved,
    });
    await seedOrder(pair.sessionA.client, { id: orderIdA, order_status: 'PENDING' });
    await seedOrder(pair.sessionA.client, { id: orderIdB, order_status: 'PENDING' });

    // 2. Setup Barrier for simultaneous dispatch
    const barrier = new Barrier(2);
    const itemsJson = JSON.stringify([{ product_id: productId, quantity: requestedQty }]);

    const execCustomer = async (session: typeof pair.sessionA, orderId: string) => {
      await barrier.wait(5000);
      return session.client.query(
        'SELECT public.reserve_order_inventory($1, $2::jsonb, $3) AS result',
        [orderId, itemsJson, 15]
      );
    };

    // 3. Dispatch simultaneous queries across independent PostgreSQL connections
    const [resA, resB] = await Promise.allSettled([
      execCustomer(pair.sessionA, orderIdA),
      execCustomer(pair.sessionB, orderIdB),
    ]);

    // 4. Evaluate outcomes: exactly ONE must succeed, exactly ONE must be rejected
    const successful: any[] = [];
    const failed: any[] = [];

    if (resA.status === 'fulfilled' && resA.value.rows[0]?.result?.success) {
      successful.push({ customer: 'A', data: resA.value.rows[0].result });
    } else {
      failed.push({ customer: 'A', error: resA.status === 'rejected' ? resA.reason.message : 'failed' });
    }

    if (resB.status === 'fulfilled' && resB.value.rows[0]?.result?.success) {
      successful.push({ customer: 'B', data: resB.value.rows[0].result });
    } else {
      failed.push({ customer: 'B', error: resB.status === 'rejected' ? resB.reason.message : 'failed' });
    }

    if (successful.length !== 1 || failed.length !== 1) {
      throw new Error(
        `CONCURRENCY OVERSELL VIOLATION: Expected exactly 1 success and 1 failure for final stock. Successful: ${successful.length}, Failed: ${failed.length}. Outcomes: A=${JSON.stringify(
          resA
        )}, B=${JSON.stringify(resB)}`
      );
    }

    // Verify error message indicates insufficient stock
    const failureReason = failed[0].error;
    if (!failureReason.includes('INSUFFICIENT_STOCK') && !failureReason.includes('stock')) {
      throw new Error(
        `Expected failure error to cite INSUFFICIENT_STOCK, got: ${failureReason}`
      );
    }

    // 5. Assert stock math invariants
    // Stock = 1, Reserved = 1, Available = 0 (NEVER negative)
    const stockState = await assertStockMath(pair.sessionA.client, productId, 1, 1);
    if (stockState.available < 0) {
      throw new Error(`CRITICAL INVARIANT VIOLATION: Available stock is negative (${stockState.available})!`);
    }

    const durationMs = Date.now() - startTime;
    return {
      name: '02-two-customers-final-stock',
      passed: true,
      durationMs,
      details: `Zero-oversell guaranteed. Exactly 1 customer won final stock; 2nd customer rejected with INSUFFICIENT_STOCK. Final stock: 1, reserved: 1, available: 0. PIDs: [${pair.sessionA.pid}, ${pair.sessionB.pid}]`,
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

if (process.argv[1] && process.argv[1].includes('02-two-customers-final-stock')) {
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
