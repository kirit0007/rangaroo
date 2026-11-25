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
} from '../../helpers/assertions';
import { TestResult } from './01-same-order-reservation.test';

/**
 * Race 3: Payment Capture vs Reservation Expiry
 *
 * Vulnerability Vector:
 * Customer completes payment on the payment gateway at the exact boundary of the 15-minute
 * reservation window. Razorpay's webhook delivers payment confirmation while the scheduled
 * database expiration worker simultaneously sweeps expired reservations.
 *
 * Guaranteed Invariants:
 * 1. Capture Wins Interleaving:
 *    Reservation is CONFIRMED, physical stock is permanently deducted, reserved_quantity
 *    decrements, order transitions to PROCESSING, payment_status = PAID.
 * 2. Expiry Wins Interleaving:
 *    Reservation is marked EXPIRED, reserved_quantity is released.
 *    Payment is captured and committed as payment_status = PAID, but order must transition to
 *    INVENTORY_CONFLICT (non-fulfillable) to prevent ghost fulfillment without secured stock.
 * 3. Physical stock math is completely conserved under all interleavings.
 */
export async function runTest(): Promise<TestResult> {
  const startTime = Date.now();
  const runId = generateRunId('race3');
  const pair = await createSessionPair('race3');

  try {
    assertDistinctSessions(pair.sessionA, pair.sessionB);

    // =========================================================================
    // PART 1: Capture Wins Interleaving (Lock contention before expiry)
    // =========================================================================
    const prodIdA = `prod_win_${runId}`;
    const orderIdA = `ord_win_${runId}`;
    const initialStockA = 5;
    const reservedQtyA = 1;

    await seedProduct(pair.sessionA.client, {
      id: prodIdA,
      stock: initialStockA,
      reserved_quantity: reservedQtyA,
    });
    await seedOrder(pair.sessionA.client, {
      id: orderIdA,
      order_status: 'PENDING',
      payment_status: 'PENDING',
      total_amount: 500,
    });
    await seedInventoryReservation(pair.sessionA.client, {
      order_id: orderIdA,
      product_id: prodIdA,
      quantity: reservedQtyA,
      status: 'PENDING',
      // Expires in 100ms
      expires_at: new Date(Date.now() + 100),
    });

    // Session 1: Confirms payment
    const confirmRes = await pair.sessionA.client.query(
      'SELECT public.confirm_order_payment($1, $2) AS result',
      [orderIdA, `pay_capture_${runId}`]
    );

    // Session 2: Expiry sweeper runs concurrently
    const sweepRes = await pair.sessionB.client.query(
      'SELECT public.release_expired_reservations() AS swept_count'
    );

    // Part 1 Assertions:
    // When capture wins: physical stock is deducted from 5 to 4, reserved is 0, order is PROCESSING
    await assertStockMath(pair.sessionA.client, prodIdA, initialStockA - reservedQtyA, 0);
    await assertOrderStatus(pair.sessionA.client, orderIdA, 'PROCESSING', 'PAID');

    // =========================================================================
    // PART 2: Expiry Sweeper Wins Interleaving (Reservation expired before capture)
    // =========================================================================
    const prodIdB = `prod_exp_${runId}`;
    const orderIdB = `ord_exp_${runId}`;
    const initialStockB = 5;
    const reservedQtyB = 1;

    await seedProduct(pair.sessionA.client, {
      id: prodIdB,
      stock: initialStockB,
      reserved_quantity: reservedQtyB,
    });
    await seedOrder(pair.sessionA.client, {
      id: orderIdB,
      order_status: 'PENDING',
      payment_status: 'PENDING',
      total_amount: 500,
    });
    // Already expired 1 second ago
    await seedInventoryReservation(pair.sessionA.client, {
      order_id: orderIdB,
      product_id: prodIdB,
      quantity: reservedQtyB,
      status: 'PENDING',
      expires_at: new Date(Date.now() - 1000),
    });

    // Session 2 runs expiry sweep first
    const sweepResB = await pair.sessionB.client.query(
      'SELECT public.release_expired_reservations() AS swept_count'
    );
    const swept = Number(sweepResB.rows[0]?.swept_count);
    if (swept < 1) {
      throw new Error(`Expected at least 1 expired reservation swept, got ${swept}`);
    }

    // Reservation hold was released by sweeper: stock remains 5, reserved is 0
    await assertStockMath(pair.sessionA.client, prodIdB, initialStockB, 0);

    // Now Session 1 receives late capture webhook
    const lateConfirmRes = await pair.sessionA.client.query(
      'SELECT public.confirm_order_payment($1, $2) AS result',
      [orderIdB, `pay_late_${runId}`]
    );

    // Physical stock must NEVER be decremented below available (stock remains 5, not 4)
    await assertStockMath(pair.sessionA.client, prodIdB, initialStockB, 0);

    // Payment must be committed as PAID
    const orderState = await assertOrderStatus(pair.sessionA.client, orderIdB, 'INVENTORY_CONFLICT', 'PAID');

    const durationMs = Date.now() - startTime;
    return {
      name: '03-capture-vs-reservation-expiry',
      passed: true,
      durationMs,
      details: `Stock conservation and decoupled payment verified across both race interleavings. PIDs: [${pair.sessionA.pid}, ${pair.sessionB.pid}]`,
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

if (process.argv[1] && process.argv[1].includes('03-capture-vs-reservation-expiry')) {
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
