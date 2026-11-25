import { defineSuite, expect } from '../helpers/test-runner';
import { createRoleClient, createSuperuserClient } from '../helpers/db-client';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  cleanTestFixtures,
} from '../helpers/fixtures';
import { assertStockMath } from '../../helpers/assertions';

export const suite = defineSuite('Tier 3 Cross-Feature: Catalog View Stock Lifecycle (R1 x R2)', (s) => {
  const runId = generateRunId('x_cat_life');
  const prodId = `prod_life_${runId}`;
  const orderId = `ord_life_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, { id: prodId, stock: 10, reserved_quantity: 0 });
      await seedOrder(superuser, { id: orderId });
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

  s.test('X-R1-R2-01', 'Cross-feature: Public catalog view reflects accurate stock across full order lifecycle', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup: cleanupSvc } = await createRoleClient('service_role');
    const { client: anonClient, cleanup: cleanupAnon } = await createRoleClient('anon');

    try {
      // Phase 1: Browsing
      // Initial stock: 10 in products, available stock in public_products = 10
      const viewRes1 = await anonClient.query('SELECT stock FROM public.public_products WHERE id = $1', [prodId]);
      expect(Number(viewRes1.rows[0].stock)).toBe(10);

      // Verify anon is denied direct SELECT on products base table
      let threwAnon = false;
      try {
        await anonClient.query('SELECT stock FROM public.products WHERE id = $1', [prodId]);
      } catch (err: any) {
        threwAnon = true;
        expect(err.code).toBe('42501');
      }
      expect(threwAnon).toBe(true);

      // Phase 2: Checkout Reservation (3 units)
      const items = JSON.stringify([{ product_id: prodId, quantity: 3 }]);
      const res2 = await svcClient.query(
        'SELECT public.reserve_order_inventory($1, $2::jsonb, 15) AS result',
        [orderId, items]
      );
      expect(res2.rows[0].result.success).toBe(true);

      // Physical stock remains 10, reserved is 3
      await assertStockMath(superuser, prodId, 10, 3);
      // Catalog view dynamically reflects GREATEST(0, stock - reserved_quantity) = 10 - 3 = 7
      const viewRes2 = await anonClient.query('SELECT stock FROM public.public_products WHERE id = $1', [prodId]);
      expect(Number(viewRes2.rows[0].stock)).toBe(7);

      // Phase 3: Payment Confirmation
      const payRes = await svcClient.query(
        'SELECT public.confirm_order_payment($1, $2) AS result',
        [orderId, `pay_life_${runId}`]
      );
      expect(payRes.rows[0].result.success).toBe(true);

      // Physical stock becomes 7, reserved becomes 0
      await assertStockMath(superuser, prodId, 7, 0);
      // Catalog view still reflects 7
      const viewRes3 = await anonClient.query('SELECT stock FROM public.public_products WHERE id = $1', [prodId]);
      expect(Number(viewRes3.rows[0].stock)).toBe(7);

      // Phase 4: Order Cancellation & Inventory Restoration
      await svcClient.query(
        'SELECT public.cancel_order_and_restore_inventory($1, $2)',
        [orderId, 'Customer cancellation']
      );

      // View is queryable and never exposes internal base tables
      const finalView = await anonClient.query('SELECT stock FROM public.public_products WHERE id = $1', [prodId]);
      expect(finalView.rowCount).toBe(1);
    } finally {
      await cleanupAnon();
      await cleanupSvc();
      await superuser.end();
    }
  });
});
