import { defineSuite, expect } from '../helpers/test-runner';
import { createSuperuserClient } from '../helpers/db-client';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  seedInventoryReservation,
  cleanTestFixtures,
} from '../helpers/fixtures';
import { assertStockMath, assertOrderStatus } from '../../helpers/assertions';

export const suite = defineSuite('Tier 3 Cross-Feature: Webhook Capture vs Expired Reservation (R2 x R4)', (s) => {
  const runId = generateRunId('x_wh_exp');
  const prodId = `prod_exp_${runId}`;
  const orderId = `ord_exp_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      // Stock = 1, reserved = 1
      await seedProduct(superuser, { id: prodId, stock: 1, reserved_quantity: 1 });
      await seedOrder(superuser, {
        id: orderId,
        order_status: 'PENDING',
        payment_status: 'PENDING',
        total_amount: 1500,
        razorpay_order_id: `rzp_ord_${orderId}`,
      });

      // Seed expired reservation (expired 20 minutes ago)
      await seedInventoryReservation(superuser, {
        order_id: orderId,
        product_id: prodId,
        quantity: 1,
        status: 'PENDING',
        expires_at: new Date(Date.now() - 20 * 60 * 1000),
      });

      // Automated sweep releases the expired hold
      await superuser.query('SELECT public.release_expired_reservations()');

      // Another shopper purchases the last remaining unit (stock becomes 0)
      await superuser.query('UPDATE public.products SET stock = 0 WHERE id = $1', [prodId]);
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

  s.test('X-R2-R4-01', 'Late captured payment for expired reservation marks PAID but transitions order to INVENTORY_CONFLICT', async () => {
    const superuser = await createSuperuserClient();
    try {
      // Verify reservation is expired and available stock is 0
      await assertStockMath(superuser, prodId, 0, 0);

      // Webhook confirms captured payment
      await superuser.query(
        'SELECT public.confirm_order_payment($1, $2)',
        [orderId, `pay_late_${runId}`]
      );

      // Invariant: payment is captured (marked PAID), but order is INVENTORY_CONFLICT and not fulfillable
      const order = await assertOrderStatus(superuser, orderId, 'INVENTORY_CONFLICT', 'PAID');
      expect(order.order_status).toBe('INVENTORY_CONFLICT');

      // Critical oversell invariant: Physical stock must never drop below 0!
      await assertStockMath(superuser, prodId, 0, 0);
    } finally {
      await superuser.end();
    }
  });
});
