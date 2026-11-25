import { createSessionPair } from '../../helpers/connection';
import { Barrier } from '../../helpers/barrier';
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
  assertWebhookEventCount,
} from '../../helpers/assertions';
import { TestResult } from './01-same-order-reservation.test';

/**
 * Race 7: Duplicate / Retryable Webhook Processing (Idempotent ACK)
 *
 * Vulnerability Vector:
 * Payment gateways (Razorpay) frequently redeliver webhooks due to network retries, or two webhook
 * worker lambdas receive the identical `payment.captured` event at the exact same millisecond.
 * If both execute payment confirmation concurrently without unique constraint deduplication
 * and payment idempotency guards, inventory could be permanently deducted twice (double stock deduction).
 *
 * Guaranteed Invariants:
 * 1. Exactly ONE event is persisted in razorpay_webhook_events (unique event_id).
 * 2. Exactly ONE payment confirmation commits; competing session executes idempotently.
 * 3. Physical stock is deducted by requested quantity exactly ONCE (from 10 to 8, never to 6).
 * 4. reserved_quantity decrements from 2 to 0.
 * 5. Exactly 1 RESERVATION_CONFIRMED entry in inventory_movements.
 * 6. Both workers return idempotent ACK (success) without deadlocks or unhandled exceptions.
 */
export async function runTest(): Promise<TestResult> {
  const startTime = Date.now();
  const runId = generateRunId('race7');
  const pair = await createSessionPair('race7');

  try {
    assertDistinctSessions(pair.sessionA, pair.sessionB);

    const eventId = `evt_rzp_${runId}`;
    const paymentId = `pay_rzp_${runId}`;
    const rzpOrderId = `order_rzp_${runId}`;
    const orderId = `ord_wh_${runId}`;
    const productId = `prod_wh_${runId}`;
    const initialStock = 10;
    const reservedQty = 2;

    // 1. Seed initial fixtures: product, order with pending payment, active reservation
    await seedProduct(pair.sessionA.client, {
      id: productId,
      stock: initialStock,
      reserved_quantity: reservedQty,
    });
    await seedOrder(pair.sessionA.client, {
      id: orderId,
      order_status: 'PENDING',
      payment_status: 'PENDING',
      total_amount: 600,
      razorpay_order_id: rzpOrderId,
    });
    await seedInventoryReservation(pair.sessionA.client, {
      order_id: orderId,
      product_id: productId,
      quantity: reservedQty,
      status: 'PENDING',
    });

    // 2. Setup Barrier for simultaneous dispatch of duplicate webhook event
    const barrier = new Barrier(2);
    const payloadJson = JSON.stringify({
      order_id: rzpOrderId,
      payment_id: paymentId,
      amount: 60000,
      currency: 'INR',
    });

    const execWebhookWorker = async (session: typeof pair.sessionA, workerId: string) => {
      await barrier.wait(5000);

      await session.client.query('BEGIN');
      try {
        // Atomic event deduplication check/insert
        const insertRes = await session.client.query(
          `INSERT INTO public.razorpay_webhook_events (event_id, event_type, payload)
           VALUES ($1, 'payment.captured', $2::jsonb)
           ON CONFLICT (event_id) DO NOTHING
           RETURNING id;`,
          [eventId, payloadJson]
        );

        const isOriginalEvent = insertRes.rowCount === 1;

        // Payment confirmation RPC with idempotency check
        const confirmRes = await session.client.query(
          'SELECT public.confirm_order_payment($1, $2) AS result',
          [orderId, paymentId]
        );

        await session.client.query('COMMIT');
        return {
          workerId,
          isOriginalEvent,
          confirmResult: confirmRes.rows[0]?.result,
        };
      } catch (err) {
        await session.client.query('ROLLBACK');
        throw err;
      }
    };

    // 3. Dispatch simultaneous webhook executions across independent PostgreSQL connections
    const [workerA, workerB] = await Promise.allSettled([
      execWebhookWorker(pair.sessionA, 'worker_A'),
      execWebhookWorker(pair.sessionB, 'worker_B'),
    ]);

    if (workerA.status === 'rejected') {
      throw new Error(`Worker A failed: ${workerA.reason.message}`);
    }
    if (workerB.status === 'rejected') {
      throw new Error(`Worker B failed: ${workerB.reason.message}`);
    }

    const resA = workerA.value;
    const resB = workerB.value;

    // Both workers must complete with success: true (idempotent ACK)
    if (!resA.confirmResult?.success || !resB.confirmResult?.success) {
      throw new Error(
        `Both webhook workers must return idempotent success. Got A: ${JSON.stringify(
          resA.confirmResult
        )}, B: ${JSON.stringify(resB.confirmResult)}`
      );
    }

    // Exactly one worker must have inserted the original webhook event
    const insertedEvents = (resA.isOriginalEvent ? 1 : 0) + (resB.isOriginalEvent ? 1 : 0);
    if (insertedEvents !== 1) {
      throw new Error(
        `Expected exactly 1 worker to insert event, but ${insertedEvents} inserted!`
      );
    }

    // At least one worker must have observed idempotent: true on confirmation
    const hasIdempotentConfirmation =
      resA.confirmResult?.idempotent === true || resB.confirmResult?.idempotent === true;
    if (!hasIdempotentConfirmation) {
      throw new Error('Expected at least one session to be flagged as idempotent confirmation');
    }

    // 4. Assert database invariants
    // Exactly 1 webhook event row stored
    await assertWebhookEventCount(pair.sessionA.client, eventId, 1);

    // Physical stock is deducted by 2 (from 10 to 8), NEVER to 6!
    await assertStockMath(pair.sessionA.client, productId, initialStock - reservedQty, 0);

    // Order is marked PAID and PROCESSING
    await assertOrderStatus(pair.sessionA.client, orderId, 'PROCESSING', 'PAID');

    // Movement ledger has exactly 1 RESERVATION_CONFIRMED entry
    const movements = await pair.sessionA.client.query(
      `SELECT * FROM public.inventory_movements 
       WHERE reference_id = $1 AND movement_type = 'RESERVATION_CONFIRMED'`,
      [orderId]
    );
    if (movements.rowCount !== 1) {
      throw new Error(
        `Expected exactly 1 RESERVATION_CONFIRMED movement, but found ${movements.rowCount}`
      );
    }

    const durationMs = Date.now() - startTime;
    return {
      name: '07-webhook-deduplication',
      passed: true,
      durationMs,
      details: `Concurrent duplicate webhook deliveries deduplicated. Stock deducted once (10 -> 8). Exactly 1 event stored. PIDs: [${pair.sessionA.pid}, ${pair.sessionB.pid}]`,
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

if (process.argv[1] && process.argv[1].includes('07-webhook-deduplication')) {
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
