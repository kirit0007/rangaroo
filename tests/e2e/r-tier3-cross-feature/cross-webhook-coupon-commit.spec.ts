import { defineSuite, expect } from '../helpers/test-runner';
import { createRoleClient, createSuperuserClient } from '../helpers/db-client';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  seedCoupon,
  seedInventoryReservation,
  cleanTestFixtures,
} from '../helpers/fixtures';
import { assertCouponReservationCount } from '../../helpers/assertions';

export const suite = defineSuite('Tier 3 Cross-Feature: Webhook Confirmation Commits Coupon Usage (R3 x R4)', (s) => {
  const runId = generateRunId('x_wh_cp');
  const prodId = `prod_wh_cp_${runId}`;
  const couponCode = `SINGLEUSE_${runId}`;
  const order1 = `ord_wh_cp1_${runId}`;
  const order2 = `ord_wh_cp2_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, { id: prodId, stock: 10, reserved_quantity: 1 });
      await seedOrder(superuser, {
        id: order1,
        total_amount: 1000,
        subtotal: 1000,
        customer_email: 'buyer1@test.com',
        order_status: 'PENDING',
        payment_status: 'PENDING',
      });
      await seedCoupon(superuser, {
        code: couponCode,
        discount_type: 'FIXED',
        discount_value: 100,
        min_order_amount: 500,
        max_uses: 1,
        used_count: 0,
      });
      await seedInventoryReservation(superuser, {
        order_id: order1,
        product_id: prodId,
        quantity: 1,
        status: 'PENDING',
      });

      // Reserve coupon usage for Order 1
      await superuser.query(
        'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15)',
        [couponCode, order1, 'buyer1@test.com', 1000]
      );
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

  s.test('X-R3-R4-01', 'Cross-feature: Successful payment confirmation commits coupon usage and exhausts single-use coupon', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    try {
      // 1. Payment confirmation commits Order 1
      const payRes = await svcClient.query(
        'SELECT public.confirm_order_payment($1, $2) AS result',
        [order1, `pay_cp_${runId}`]
      );
      expect(payRes.rows[0].result.success).toBe(true);

      // In coupon handling, confirm reservation status if tracked
      await assertCouponReservationCount(superuser, couponCode, 1);

      // 2. Order 2 attempts to claim the exhausted single-use coupon
      await seedOrder(superuser, {
        id: order2,
        total_amount: 1000,
        subtotal: 1000,
        customer_email: 'buyer2@test.com',
      });

      let threw = false;
      try {
        await superuser.query(
          'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15)',
          [couponCode, order2, 'buyer2@test.com', 1000]
        );
      } catch (err: any) {
        threw = true;
        expect(err.message).toMatch(/COUPON_EXHAUSTED|maximum usage/i);
      }
      expect(threw).toBe(true);

      // Exactly 1 reservation remains for SINGLEUSE coupon
      await assertCouponReservationCount(superuser, couponCode, 1);
    } finally {
      await cleanup();
      await superuser.end();
    }
  });
});
