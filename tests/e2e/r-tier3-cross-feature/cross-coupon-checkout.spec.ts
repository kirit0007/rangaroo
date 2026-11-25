import { defineSuite, expect } from '../helpers/test-runner';
import { createRoleClient, createSuperuserClient } from '../helpers/db-client';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  seedCoupon,
  cleanTestFixtures,
} from '../helpers/fixtures';
import { assertStockMath, assertReservationCount, assertCouponReservationCount } from '../../helpers/assertions';

export const suite = defineSuite('Tier 3 Cross-Feature: Coupon + Checkout Hold Rollback (R2 x R3)', (s) => {
  const runId = generateRunId('x_cp_ck');
  const prodId = `prod_x_cp_${runId}`;
  const couponCode = `SAVE20_${runId}`;
  const orderId = `ord_x_cp_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, { id: prodId, stock: 10, reserved_quantity: 0, price: 500 });
      await seedCoupon(superuser, {
        code: couponCode,
        discount_type: 'PERCENTAGE',
        discount_value: 20,
        min_order_amount: 800,
        max_uses: 1,
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

  s.test('X-R2-R3-01', 'Cross-feature: Valid checkout reserves inventory hold and locks coupon usage', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    try {
      // 1. Order created with subtotal 1000 (2 items of 500)
      await seedOrder(superuser, {
        id: orderId,
        subtotal: 1000,
        total_amount: 800, // 20% discount applied
        customer_email: 'shopper@test.com',
      });

      // 2. Reserve inventory for 2 units
      const items = JSON.stringify([{ product_id: prodId, quantity: 2 }]);
      const invRes = await svcClient.query(
        'SELECT public.reserve_order_inventory($1, $2::jsonb, 15) AS result',
        [orderId, items]
      );
      expect(invRes.rows[0].result.success).toBe(true);

      // 3. Reserve coupon usage
      const cpRes = await superuser.query(
        'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15) AS result',
        [couponCode, orderId, 'shopper@test.com', 1000]
      );
      expect(cpRes.rows[0].result.success).toBe(true);

      // 4. Assert composite state
      // Inventory hold: physical 10, reserved 2, available 8
      await assertStockMath(superuser, prodId, 10, 2);
      await assertReservationCount(superuser, orderId, 1, 'PENDING');

      // Coupon hold: exactly 1 pending reservation
      await assertCouponReservationCount(superuser, couponCode, 1);

      // Public products catalog view reports sanitized stock = 8
      const { client: anonClient, cleanup: cleanupAnon } = await createRoleClient('anon');
      try {
        const viewRes = await anonClient.query(
          'SELECT stock FROM public.public_products WHERE id = $1',
          [prodId]
        );
        expect(Number(viewRes.rows[0].stock)).toBe(8);
      } finally {
        await cleanupAnon();
      }
    } finally {
      await cleanup();
      await superuser.end();
    }
  });

  s.test('X-R2-R3-02', 'Cross-feature: If inventory reservation fails, coupon is not claimed', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    const failOrderId = `ord_fail_${runId}`;
    try {
      await seedOrder(superuser, { id: failOrderId, subtotal: 1000, customer_email: 'fail@test.com' });

      // Request 50 units (stock is only 10)
      const items = JSON.stringify([{ product_id: prodId, quantity: 50 }]);
      let threw = false;
      try {
        await svcClient.query('SELECT public.reserve_order_inventory($1, $2::jsonb, 15)', [failOrderId, items]);
      } catch (err: any) {
        threw = true;
        expect(err.message).toMatch(/INSUFFICIENT_STOCK/i);
      }
      expect(threw).toBe(true);

      // Verify no reservation created for failOrderId
      await assertReservationCount(superuser, failOrderId, 0);
    } finally {
      await cleanup();
      await superuser.end();
    }
  });
});
