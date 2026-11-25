import { defineSuite, expect } from '../helpers/test-runner';
import { createRoleClient, createSuperuserClient } from '../helpers/db-client';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  seedInventoryReservation,
  cleanTestFixtures,
} from '../helpers/fixtures';
import { assertStockMath, assertOrderStatus } from '../../helpers/assertions';

export const suite = defineSuite('Tier 3 Cross-Feature: Cancelled Order with Late Payment Webhook (R2 x R4)', (s) => {
  const runId = generateRunId('x_can_wh');
  const prodId = `prod_x_can_${runId}`;
  const orderId = `ord_x_can_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, { id: prodId, stock: 10, reserved_quantity: 0 });
      await seedOrder(superuser, {
        id: orderId,
        order_status: 'CANCELLED',
        payment_status: 'FAILED',
        total_amount: 1000,
        razorpay_order_id: `rzp_ord_${orderId}`,
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

  s.test('X-R2-R4-02', 'Cross-feature: Delayed payment webhook cannot transition CANCELLED order to PROCESSING', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    try {
      // Physical stock remains 10
      await assertStockMath(superuser, prodId, 10, 0);

      // Delayed webhook arrives attempting to confirm payment
      await svcClient.query(
        'SELECT public.confirm_order_payment($1, $2)',
        [orderId, `pay_late_${runId}`]
      );

      // Invariant: Order status must NEVER revert to PROCESSING or fulfillable
      const order = await assertOrderStatus(superuser, orderId, 'CANCELLED');
      expect(order.order_status).not.toBe('PROCESSING');

      // Stock invariant: stock was not double decremented
      await assertStockMath(superuser, prodId, 10, 0);
    } finally {
      await cleanup();
      await superuser.end();
    }
  });
});
