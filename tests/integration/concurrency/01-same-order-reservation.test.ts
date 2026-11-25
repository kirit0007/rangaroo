import { createSessionPair, stopDatabase } from '../../helpers/connection';
import { Barrier } from '../../helpers/barrier';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  cleanTestFixtures,
} from '../../helpers/db-fixtures';
import {
  assertStockMath,
  assertReservationCount,
  assertDistinctSessions,
} from '../../helpers/assertions';

export interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
  pids?: { sessionA: number; sessionB: number };
}

/**
 * Race 1: Same-Order Duplicate Reservation Serialization
 *
 * Vulnerability Vector:
 * Two concurrent reservation requests for the exact same order_id arrive at the same millisecond
 * (e.g., checkout button double-click or network retry).
 *
 * Guaranteed Invariant:
 * Exactly ONE reservation hold is created for the order; reserved_quantity increases by requested
 * quantity exactly ONCE (never duplicated); competing session receives idempotent success without
 * overselling stock or deadlocking.
 */
export async function runTest(): Promise<TestResult> {
  const startTime = Date.now();
  const runId = generateRunId('race1');
  const pair = await createSessionPair('race1');

  try {
    assertDistinctSessions(pair.sessionA, pair.sessionB);

    const productId = `prod_${runId}`;
    const orderId = `ord_${runId}`;
    const initialStock = 10;
    const initialReserved = 0;
    const requestedQty = 2;

    // 1. Seed initial fixtures
    await seedProduct(pair.sessionA.client, {
      id: productId,
      stock: initialStock,
      reserved_quantity: initialReserved,
    });
    await seedOrder(pair.sessionA.client, {
      id: orderId,
      order_status: 'PENDING',
      payment_status: 'PENDING',
    });

    // 2. Setup Barrier for simultaneous execution
    const barrier = new Barrier(2);
    const itemsJson = JSON.stringify([{ product_id: productId, quantity: requestedQty }]);

    const execSession = async (session: typeof pair.sessionA) => {
      await barrier.wait(5000);
      return session.client.query(
        'SELECT public.reserve_order_inventory($1, $2::jsonb, $3) AS result',
        [orderId, itemsJson, 15]
      );
    };

    // 3. Dispatch simultaneous queries across independent PostgreSQL connections
    const [resA, resB] = await Promise.allSettled([
      execSession(pair.sessionA),
      execSession(pair.sessionB),
    ]);

    // 4. Verify execution outcomes
    if (resA.status === 'rejected') throw new Error(`Session A failed: ${resA.reason}`);
    if (resB.status === 'rejected') throw new Error(`Session B failed: ${resB.reason}`);

    const resultA = resA.value.rows[0]?.result;
    const resultB = resB.value.rows[0]?.result;

    if (!resultA?.success || !resultB?.success) {
      throw new Error(
        `Both sessions must succeed idempotently. Got Session A: ${JSON.stringify(
          resultA
        )}, Session B: ${JSON.stringify(resultB)}`
      );
    }

    // At least one session must be flagged as idempotent or existing hold
    const hasIdempotent = resultA.idempotent === true || resultB.idempotent === true;
    if (!hasIdempotent) {
      // If neither is flagged idempotent, verify if reservation count is strictly 1
      const reservations = await assertReservationCount(pair.sessionA.client, orderId, 1);
      if (reservations.length !== 1) {
        throw new Error(
          `Idempotency violation: expected exactly 1 reservation, but created duplicate reservations!`
        );
      }
    }

    // 5. Assert database state invariants
    // Physical stock remains 10, reserved_quantity increased by exactly 2 (to 2), NEVER 4
    await assertStockMath(pair.sessionA.client, productId, initialStock, initialReserved + requestedQty);

    // Exactly 1 reservation row created
    await assertReservationCount(pair.sessionA.client, orderId, 1, 'PENDING');

    const durationMs = Date.now() - startTime;
    return {
      name: '01-same-order-reservation',
      passed: true,
      durationMs,
      details: `Successfully serialized same-order duplicate reservations. Stock conserved: 10, reserved: 2. PIDs: [${pair.sessionA.pid}, ${pair.sessionB.pid}]`,
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

if (process.argv[1] && process.argv[1].includes('01-same-order-reservation')) {
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
