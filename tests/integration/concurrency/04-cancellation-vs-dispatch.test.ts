import { createSessionPair } from '../../helpers/connection';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  seedInventoryReservation,
  cleanTestFixtures,
} from '../../helpers/db-fixtures';
import {
  assertStockMath,
  assertDistinctSessions,
  assertOrderStatus,
} from '../../helpers/assertions';
import { TestResult } from './01-same-order-reservation.test';

/**
 * Race 4: Cancellation Racing with Dispatch (No Phantom Restock)
 *
 * Vulnerability Vector:
 * Warehouse worker clicks "Dispatch" at the exact same millisecond a customer service agent
 * or customer triggers "Cancel Order". If cancellation succeeds on a dispatched order, stock
 * is restored to warehouse inventory while goods are physically handed to the carrier (phantom inventory).
 *
 * Guaranteed Invariants:
 * 1. When an order transitions to DISPATCHED, any competing cancellation MUST be rejected.
 * 2. Exactly 0 rows of inventory are restocked for dispatched orders.
 * 3. Physical stock is NEVER falsely incremented after dispatch.
 * 4. In reverse interleaving (Cancellation commits first): order is CANCELLED and restocked,
 *    subsequent dispatch attempt is rejected.
 */
export async function runTest(): Promise<TestResult> {
  const startTime = Date.now();
  const runId = generateRunId('race4');
  const pair = await createSessionPair('race4');

  try {
    assertDistinctSessions(pair.sessionA, pair.sessionB);

    // =========================================================================
    // SCENARIO 1: Dispatch Wins Lock -> Cancellation Must Be Rejected
    // =========================================================================
    const prodId1 = `prod_disp_${runId}`;
    const orderId1 = `ord_disp_${runId}`;
    const initialStock1 = 10;
    const orderQty1 = 3;

    await seedProduct(pair.sessionA.client, {
      id: prodId1,
      stock: initialStock1,
      reserved_quantity: 0, // already deducted upon payment confirmation
    });
    await seedOrder(pair.sessionA.client, {
      id: orderId1,
      order_status: 'PROCESSING',
      payment_status: 'PAID',
    });
    await seedInventoryReservation(pair.sessionA.client, {
      order_id: orderId1,
      product_id: prodId1,
      quantity: orderQty1,
      status: 'CONFIRMED',
    });

    // Session 1: Begins transaction, acquires exclusive order row lock, pauses for 50ms, then sets DISPATCHED
    const dispatchTask = async () => {
      await pair.sessionA.client.query('BEGIN');
      try {
        await pair.sessionA.client.query('SELECT * FROM public.orders WHERE id = $1 FOR UPDATE', [orderId1]);
        await pair.sessionA.client.query('SELECT pg_sleep(0.05)');
        await pair.sessionA.client.query(
          "UPDATE public.orders SET order_status = 'DISPATCHED', updated_at = clock_timestamp() WHERE id = $1",
          [orderId1]
        );
        await pair.sessionA.client.query('COMMIT');
        return { dispatched: true };
      } catch (err) {
        await pair.sessionA.client.query('ROLLBACK');
        throw err;
      }
    };

    // Session 2: Tries to cancel while Session 1 is holding the lock
    const cancelTask = async () => {
      // Small 10ms offset to guarantee Session 1 acquires lock first
      await new Promise((resolve) => setTimeout(resolve, 10));
      return pair.sessionB.client.query(
        'SELECT public.cancel_order_and_restore_inventory($1, $2, $3) AS result',
        [orderId1, 'Customer requested cancellation', 'support_agent_1']
      );
    };

    const [dispRes, cancelRes] = await Promise.allSettled([dispatchTask(), cancelTask()]);

    if (dispRes.status === 'rejected') {
      throw new Error(`Dispatch transaction failed: ${dispRes.reason.message}`);
    }

    // Cancellation must be rejected (either via exception or returning success: false / cannot cancel)
    if (cancelRes.status === 'fulfilled') {
      const result = cancelRes.value.rows[0]?.result;
      if (result?.success === true && result?.restocked !== false) {
        throw new Error(
          `CONCURRENCY INVARIANT VIOLATION: Dispatched order was allowed to be cancelled and restocked! Result: ${JSON.stringify(
            result
          )}`
        );
      }
    }

    // Physical stock must remain 10 (NOT increased to 13)
    await assertStockMath(pair.sessionA.client, prodId1, initialStock1, 0);

    // Order status must remain DISPATCHED
    await assertOrderStatus(pair.sessionA.client, orderId1, 'DISPATCHED', 'PAID');

    // =========================================================================
    // SCENARIO 2: Cancellation Commits First -> Subsequent Dispatch Rejected
    // =========================================================================
    const prodId2 = `prod_canc_${runId}`;
    const orderId2 = `ord_canc_${runId}`;
    const initialStock2 = 7;
    const orderQty2 = 3;

    await seedProduct(pair.sessionA.client, {
      id: prodId2,
      stock: initialStock2,
      reserved_quantity: 0,
    });
    await seedOrder(pair.sessionA.client, {
      id: orderId2,
      order_status: 'PROCESSING',
      payment_status: 'PAID',
    });
    await seedInventoryReservation(pair.sessionA.client, {
      order_id: orderId2,
      product_id: prodId2,
      quantity: orderQty2,
      status: 'CONFIRMED',
    });

    // Session 1: Executes cancellation (locks order FOR UPDATE, restores stock from 7 -> 10, marks CANCELLED)
    const cancelTask2 = async () => {
      return pair.sessionA.client.query(
        'SELECT public.cancel_order_and_restore_inventory($1, $2, $3) AS result',
        [orderId2, 'Customer cancelled before dispatch', 'support_agent_2']
      );
    };

    // Session 2: Tries to dispatch concurrently (with small offset to ensure cancellation acquires lock first)
    const dispatchTask2 = async () => {
      await new Promise((resolve) => setTimeout(resolve, 15));
      await pair.sessionB.client.query('BEGIN');
      try {
        const orderRes = await pair.sessionB.client.query(
          'SELECT * FROM public.orders WHERE id = $1 FOR UPDATE',
          [orderId2]
        );
        const order = orderRes.rows[0];
        if (order.order_status === 'CANCELLED') {
          throw new Error(
            `ORDER_ALREADY_CANCELLED: Order ${orderId2} cannot be dispatched because it is in status CANCELLED`
          );
        }
        await pair.sessionB.client.query(
          "UPDATE public.orders SET order_status = 'DISPATCHED', updated_at = clock_timestamp() WHERE id = $1",
          [orderId2]
        );
        await pair.sessionB.client.query('COMMIT');
        return { dispatched: true };
      } catch (err) {
        await pair.sessionB.client.query('ROLLBACK');
        throw err;
      }
    };

    const [cancelRes2, dispRes2] = await Promise.allSettled([cancelTask2(), dispatchTask2()]);

    if (cancelRes2.status === 'rejected') {
      throw new Error(`Cancellation failed in Scenario 2: ${cancelRes2.reason.message}`);
    }

    const cancelResult2 = cancelRes2.value.rows[0]?.result;
    if (!cancelResult2?.success) {
      throw new Error(`Cancellation RPC was not successful in Scenario 2: ${JSON.stringify(cancelResult2)}`);
    }

    // Subsequent dispatch must be rejected
    if (dispRes2.status === 'fulfilled') {
      throw new Error(
        `CONCURRENCY INVARIANT VIOLATION: Cancelled order was allowed to be dispatched! Outcome: ${JSON.stringify(
          dispRes2.value
        )}`
      );
    }

    // Physical stock must be restored to initialStock2 + orderQty2 (7 + 3 = 10)
    await assertStockMath(pair.sessionA.client, prodId2, initialStock2 + orderQty2, 0);

    // Order status must remain CANCELLED
    await assertOrderStatus(pair.sessionA.client, orderId2, 'CANCELLED', 'PAID');

    const durationMs = Date.now() - startTime;
    return {
      name: '04-cancellation-vs-dispatch',
      passed: true,
      durationMs,
      details: `Both race interleavings verified (Dispatch wins -> cancellation rejected; Cancellation wins -> dispatch rejected, stock restored). Zero phantom inventory. PIDs: [${pair.sessionA.pid}, ${pair.sessionB.pid}]`,
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

if (process.argv[1] && process.argv[1].includes('04-cancellation-vs-dispatch')) {
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
