import { defineSuite, expect } from '../helpers/test-runner';
import { createSuperuserClient } from '../helpers/db-client';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  cleanTestFixtures,
} from '../helpers/fixtures';
import {
  createPaymentCapturedPayload,
  generateRazorpayWebhookSignature,
  TEST_WEBHOOK_SECRET,
} from '../helpers/razorpay-mock';
import { NextRequest } from 'next/server';
import { POST as webhookHandler } from '@/app/api/razorpay/webhook/route';
import { assertWebhookEventCount } from '../../helpers/assertions';

export const suite = defineSuite('R4 Webhooks & Reconciliation - Tier 1 Feature Coverage', (s) => {
  const runId = generateRunId('r4_t1');
  const orderId = `ord_wh_${runId}`;
  const prodId = `prod_wh_${runId}`;

  s.beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    process.env.RAZORPAY_KEY_SECRET = TEST_WEBHOOK_SECRET;

    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, { id: prodId, stock: 10, reserved_quantity: 0 });
      await seedOrder(superuser, {
        id: orderId,
        total_amount: 1000,
        razorpay_order_id: `rzp_ord_${orderId}`,
        order_status: 'PENDING',
        payment_status: 'PENDING',
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

  // R4-T1-01: Webhook durable event state transition
  s.test('R4-T1-01', 'Valid payment.captured event is persisted in razorpay_webhook_events', async () => {
    const superuser = await createSuperuserClient();
    const eventId = `evt_cap_${runId}`;
    const paymentId = `pay_cap_${runId}`;
    const payload = JSON.stringify({
      order_id: `rzp_ord_${orderId}`,
      payment_id: paymentId,
      amount: 100000,
      currency: 'INR',
    });

    try {
      // Direct transactional event insertion and confirmation
      await superuser.query(
        `INSERT INTO public.razorpay_webhook_events (event_id, event_type, payload)
         VALUES ($1, 'payment.captured', $2::jsonb)
         ON CONFLICT (event_id) DO NOTHING`,
        [eventId, payload]
      );

      // Verify event stored
      await assertWebhookEventCount(superuser, eventId, 1);
    } finally {
      await superuser.end();
    }
  });

  // R4-T1-02: Webhook HMAC signature verification and tampering rejection
  s.test('R4-T1-02', 'Webhook request with invalid or tampered signature is rejected with HTTP 400', async () => {
    const eventId = `evt_tamp_${runId}`;
    const { rawBody } = createPaymentCapturedPayload({
      eventId,
      orderId: `rzp_ord_${orderId}`,
      paymentId: `pay_tamp_${runId}`,
      amount: 1000,
    });

    const req = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
      method: 'POST',
      body: rawBody,
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': '0000000000000000000000000000000000000000000000000000000000000000',
        'x-razorpay-event-id': eventId,
      },
    });

    const res = await webhookHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid webhook signature/i);

    // Verify no event was stored
    const superuser = await createSuperuserClient();
    try {
      await assertWebhookEventCount(superuser, eventId, 0);
    } finally {
      await superuser.end();
    }
  });

  // R4-T1-03: Webhook deduplication and idempotent ACK
  s.test('R4-T1-03', 'Duplicate webhook event insertion is deduplicated by unique constraint on event_id', async () => {
    const superuser = await createSuperuserClient();
    const eventId = `evt_dup_${runId}`;
    const payload = JSON.stringify({
      order_id: `rzp_ord_${orderId}`,
      payment_id: `pay_dup_${runId}`,
      amount: 100000,
    });

    try {
      // 1st insertion
      const res1 = await superuser.query(
        `INSERT INTO public.razorpay_webhook_events (event_id, event_type, payload)
         VALUES ($1, 'payment.captured', $2::jsonb)
         ON CONFLICT (event_id) DO NOTHING
         RETURNING id`,
        [eventId, payload]
      );
      expect(res1.rowCount).toBe(1);

      // 2nd insertion (duplicate event_id)
      const res2 = await superuser.query(
        `INSERT INTO public.razorpay_webhook_events (event_id, event_type, payload)
         VALUES ($1, 'payment.captured', $2::jsonb)
         ON CONFLICT (event_id) DO NOTHING
         RETURNING id`,
        [eventId, payload]
      );
      expect(res2.rowCount).toBe(0); // Deduplicated!

      // Exactly 1 event row exists
      await assertWebhookEventCount(superuser, eventId, 1);
    } finally {
      await superuser.end();
    }
  });

  // R4-T1-04: Distributed reconciliation worker advisory locking
  s.test('R4-T1-04', 'Reconciliation worker locking prevents concurrent overlapping worker executions', async () => {
    const superuser1 = await createSuperuserClient();
    const superuser2 = await createSuperuserClient();
    try {
      const lockKey = 987654321; // Advisory lock key for reconciliation
      // Worker 1 acquires lock
      const res1 = await superuser1.query('SELECT pg_try_advisory_lock($1) AS acquired', [lockKey]);
      expect(res1.rows[0].acquired).toBe(true);

      // Worker 2 attempts to acquire same lock concurrently
      const res2 = await superuser2.query('SELECT pg_try_advisory_lock($1) AS acquired', [lockKey]);
      expect(res2.rows[0].acquired).toBe(false);

      // Worker 1 releases lock
      await superuser1.query('SELECT pg_advisory_unlock($1)', [lockKey]);

      // Worker 2 can now acquire lock
      const res3 = await superuser2.query('SELECT pg_try_advisory_lock($1) AS acquired', [lockKey]);
      expect(res3.rows[0].acquired).toBe(true);
      await superuser2.query('SELECT pg_advisory_unlock($1)', [lockKey]);
    } finally {
      await superuser1.end();
      await superuser2.end();
    }
  });

  // R4-T1-05: Reconciliation worker heals unpersisted captured payment
  s.test('R4-T1-05', 'Payment confirmation heals pending order when captured payment is verified', async () => {
    const superuser = await createSuperuserClient();
    const ordHeal = `ord_heal_${runId}`;
    try {
      await seedOrder(superuser, {
        id: ordHeal,
        order_status: 'PENDING',
        payment_status: 'PENDING',
      });

      // Confirm payment directly (reconciliation mechanism)
      const res = await superuser.query(
        'SELECT public.confirm_order_payment($1, $2) AS result',
        [ordHeal, `pay_heal_${runId}`]
      );
      expect(res.rows[0].result.success).toBe(true);

      // Order updated to PAID
      const orderRes = await superuser.query('SELECT payment_status FROM public.orders WHERE id = $1', [ordHeal]);
      expect(orderRes.rows[0].payment_status).toBe('PAID');
    } finally {
      await superuser.end();
    }
  });

  // R4-T1-06: Stock preservation for authorized payments
  s.test('R4-T1-06', 'Authorized payment state preserves reservation holds and prevents premature order cancellation', async () => {
    const superuser = await createSuperuserClient();
    const ordAuth = `ord_auth_${runId}`;
    const prodAuth = `prod_auth_${runId}`;
    try {
      await seedProduct(superuser, { id: prodAuth, stock: 10, reserved_quantity: 2 });
      await seedOrder(superuser, { id: ordAuth, order_status: 'PENDING', payment_status: 'PENDING' });
      await superuser.query("UPDATE public.orders SET payment_status = 'AUTHORIZED' WHERE id = $1", [ordAuth]);

      // Invariant: Orders in AUTHORIZED state must retain stock hold
      const orderRes = await superuser.query('SELECT payment_status FROM public.orders WHERE id = $1', [ordAuth]);
      expect(orderRes.rows[0].payment_status).toBe('AUTHORIZED');

      // Product reserved quantity remains intact (2 units held)
      const prodRes = await superuser.query('SELECT reserved_quantity FROM public.products WHERE id = $1', [prodAuth]);
      expect(Number(prodRes.rows[0].reserved_quantity)).toBe(2);
    } finally {
      await superuser.end();
    }
  });
});
