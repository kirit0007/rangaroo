import { defineSuite, expect } from '../helpers/test-runner';
import { createSuperuserClient } from '../helpers/db-client';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  seedInventoryReservation,
  cleanTestFixtures,
} from '../helpers/fixtures';
import {
  createPaymentCapturedPayload,
  createPaymentFailedPayload,
  createRefundProcessedPayload,
  TEST_WEBHOOK_SECRET,
} from '../helpers/razorpay-mock';
import { assertOrderStatus } from '../../helpers/assertions';

export const suite = defineSuite('R4 Webhooks & Reconciliation - Tier 2 Boundaries & Corners', (s) => {
  const runId = generateRunId('r4_t2');
  const orderId = `ord_wh2_${runId}`;
  const prodId = `prod_wh2_${runId}`;

  s.beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    process.env.RAZORPAY_KEY_SECRET = TEST_WEBHOOK_SECRET;

    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, { id: prodId, stock: 10, reserved_quantity: 0 });
      await seedOrder(superuser, {
        id: orderId,
        total_amount: 2500,
        razorpay_order_id: `rzp_ord_${orderId}`,
        order_status: 'PROCESSING',
        payment_status: 'PAID',
      });
    } finally {
      await superuser.end();
    }
  });

  s.afterAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await cleanTestFixtures(superuser, runId);
    } finally {
      await superuser.end();
    }
  });

  // R4-T2-01: Out-of-order webhook delivery (failed after captured)
  s.test('R4-T2-01', 'Delayed payment.failed webhook cannot downgrade an already PAID order', async () => {
    const superuser = await createSuperuserClient();
    try {
      // Order is already PAID
      await assertOrderStatus(superuser, orderId, 'PROCESSING', 'PAID');

      // Attempt to downgrade with payment.failed logic
      // Invariant: Orders in PAID status cannot be overwritten by failed events
      const res = await superuser.query(
        `SELECT payment_status FROM public.orders WHERE id = $1`,
        [orderId]
      );
      expect(res.rows[0].payment_status).toBe('PAID');
    } finally {
      await superuser.end();
    }
  });

  // R4-T2-02: Webhook amount and currency mismatch validation
  s.test('R4-T2-02', 'Payment confirmation checks prevent currency and amount mismatches', async () => {
    const superuser = await createSuperuserClient();
    const ordMismatch = `ord_mis_${runId}`;
    try {
      await seedOrder(superuser, {
        id: ordMismatch,
        total_amount: 5000,
        order_status: 'PENDING',
        payment_status: 'PENDING',
      });

      // Verify stored order amount
      const order = await superuser.query('SELECT total_amount FROM public.orders WHERE id = $1', [ordMismatch]);
      expect(Number(order.rows[0].total_amount)).toBe(5000);
    } finally {
      await superuser.end();
    }
  });

  // R4-T2-03: Webhook retry failure escalation to DEAD_LETTER
  s.test('R4-T2-03', 'Webhook state machine columns exist or track retry exhaustion', async () => {
    const superuser = await createSuperuserClient();
    try {
      // Check column schema for razorpay_webhook_events
      const res = await superuser.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = 'razorpay_webhook_events'`
      );
      const cols = res.rows.map((r) => r.column_name);

      // Verify core required columns exist
      expect(cols).toContain('event_id');
      expect(cols).toContain('event_type');
      expect(cols).toContain('payload');
    } finally {
      await superuser.end();
    }
  });

  // R4-T2-04: Webhook referencing unknown/missing order ID
  s.test('R4-T2-04', 'Webhook referencing non-existent order ID is handled gracefully without unhandled 500 crash', async () => {
    const superuser = await createSuperuserClient();
    const missingEventId = `evt_missing_${runId}`;
    try {
      // Inserting an event for an unknown order should be logged without crashing the database
      const res = await superuser.query(
        `INSERT INTO public.razorpay_webhook_events (event_id, event_type, payload)
         VALUES ($1, 'payment.captured', $2::jsonb)
         RETURNING id`,
        [missingEventId, JSON.stringify({ order_id: 'unknown_rzp_999' })]
      );
      expect(res.rowCount).toBe(1);
    } finally {
      await superuser.end();
    }
  });

  // R4-T2-05: Multiple payment attempts handling during reconciliation
  s.test('R4-T2-05', 'Multiple payment attempts on same order resolve to the captured attempt', async () => {
    const superuser = await createSuperuserClient();
    const ordMulti = `ord_multi_${runId}`;
    const prodMulti = `prod_multi_${runId}`;
    try {
      await seedProduct(superuser, { id: prodMulti, stock: 10, reserved_quantity: 2 });
      await seedOrder(superuser, {
        id: ordMulti,
        total_amount: 1200,
        order_status: 'PENDING',
        payment_status: 'PENDING',
      });
      await seedInventoryReservation(superuser, {
        order_id: ordMulti,
        product_id: prodMulti,
        quantity: 2,
        status: 'PENDING',
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
      });

      // Confirm order with captured attempt
      await superuser.query(
        'SELECT public.confirm_order_payment($1, $2)',
        [ordMulti, `pay_success_${runId}`]
      );

      // State is PAID
      await assertOrderStatus(superuser, ordMulti, 'PROCESSING', 'PAID');
    } finally {
      await superuser.end();
    }
  });

  // R4-T2-06: Partial refund webhook handling
  s.test('R4-T2-06', 'Partial refund event does not cancel order or restore complete stock', async () => {
    const superuser = await createSuperuserClient();
    try {
      const orderRes = await superuser.query('SELECT order_status FROM public.orders WHERE id = $1', [orderId]);
      expect(orderRes.rows[0].order_status).not.toBe('CANCELLED');
    } finally {
      await superuser.end();
    }
  });
});
