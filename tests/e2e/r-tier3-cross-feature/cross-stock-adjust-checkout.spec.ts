import { defineSuite, expect } from '../helpers/test-runner';
import { createRoleClient, createSuperuserClient } from '../helpers/db-client';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  seedAdminUser,
  cleanTestFixtures,
} from '../helpers/fixtures';
import { assertStockMath, assertReservationCount } from '../../helpers/assertions';

export const suite = defineSuite('Tier 3 Cross-Feature: Admin Stock Adjustment vs Checkout (R2 x R3)', (s) => {
  const runId = generateRunId('x_stk_ck');
  const prodId = `prod_x_stk_${runId}`;
  const order1 = `ord_x_stk1_${runId}`;
  const order2 = `ord_x_stk2_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, { id: prodId, stock: 10, reserved_quantity: 0 });
      await seedAdminUser(superuser, { role: 'PRODUCT_MANAGER', is_active: true });
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

  s.test('X-R2-R3-03', 'Cross-feature: Admin cannot reduce stock below active checkout reservations', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    try {
      await seedOrder(superuser, { id: order1 });

      // Customer 1 reserves 4 units
      const items1 = JSON.stringify([{ product_id: prodId, quantity: 4 }]);
      const res1 = await svcClient.query(
        'SELECT public.reserve_order_inventory($1, $2::jsonb, 15) AS result',
        [order1, items1]
      );
      expect(res1.rows[0].result.success).toBe(true);

      // Verify stock: physical 10, reserved 4, available 6
      await assertStockMath(superuser, prodId, 10, 4);

      // Step 1: Admin attempts to reduce stock to 3 (less than active reserved quantity 4) -> must be rejected
      let threw = false;
      try {
        await superuser.query(
          'SELECT public.adjust_product_stock($1, $2, $3)',
          [prodId, 3, 'Reduction below active reservation']
        );
      } catch (err: any) {
        threw = true;
        expect(err.message).toMatch(/BOUNDARY_VIOLATION.*currently committed in active reservations/i);
      }
      expect(threw).toBe(true);

      // Step 2: Admin reduces stock to 5 (valid: 5 >= 4 reserved). Available becomes 5 - 4 = 1.
      const adjRes = await superuser.query(
        'SELECT public.adjust_product_stock($1, $2, $3) AS result',
        [prodId, 5, 'Valid adjustment to 5']
      );
      expect(adjRes.rows[0].result.success).toBe(true);
      await assertStockMath(superuser, prodId, 5, 4);

      // Step 3: Customer 2 attempts checkout for 2 units (available is only 1) -> must be rejected
      await seedOrder(superuser, { id: order2 });
      const items2 = JSON.stringify([{ product_id: prodId, quantity: 2 }]);
      let threwC2 = false;
      try {
        await svcClient.query(
          'SELECT public.reserve_order_inventory($1, $2::jsonb, 15) AS result',
          [order2, items2]
        );
      } catch (err: any) {
        threwC2 = true;
        expect(err.message).toMatch(/INSUFFICIENT_STOCK/i);
      }
      expect(threwC2).toBe(true);

      // Step 4: Catalog view available stock reflects exactly 1 unit
      const { client: anonClient, cleanup: cleanupAnon } = await createRoleClient('anon');
      try {
        const viewRes = await anonClient.query(
          'SELECT stock FROM public.public_products WHERE id = $1',
          [prodId]
        );
        expect(Number(viewRes.rows[0].stock)).toBe(1);
      } finally {
        await cleanupAnon();
      }
    } finally {
      await cleanup();
      await superuser.end();
    }
  });
});
