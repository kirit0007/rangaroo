import { defineSuite, expect } from '../helpers/test-runner';
import { createRoleClient, createSuperuserClient } from '../helpers/db-client';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  seedInventoryReservation,
  cleanTestFixtures,
} from '../helpers/fixtures';
import { assertStockMath, assertReservationCount, assertOrderStatus } from '../../helpers/assertions';

export const suite = defineSuite('R2 Inventory & Order Lifecycle - Tier 1 Feature Coverage', (s) => {
  const runId = generateRunId('r2_t1');
  const prodA = `prod_r2_a_${runId}`;
  const prodB = `prod_r2_b_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, { id: prodA, stock: 4, reserved_quantity: 0 });
      await seedProduct(superuser, { id: prodB, stock: 10, reserved_quantity: 0 });
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

  // R2-T1-01: Cart line item aggregation for duplicate product IDs
  s.test('R2-T1-01', 'Reservation creation aggregates duplicate product lines before stock validation', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    const orderId = `ord_agg_${runId}`;
    try {
      await seedOrder(superuser, { id: orderId });

      // Request duplicate items for prodA: 2 units + 3 units = 5 units. Stock is 4.
      const items = JSON.stringify([
        { product_id: prodA, quantity: 2 },
        { product_id: prodA, quantity: 3 },
      ]);

      let threw = false;
      try {
        await svcClient.query(
          'SELECT public.reserve_order_inventory($1, $2::jsonb, 15) AS result',
          [orderId, items]
        );
      } catch (err: any) {
        threw = true;
        expect(err.message).toMatch(/INSUFFICIENT_STOCK/i);
      }
      expect(threw).toBe(true);

      // Verify no reservation created and reserved_quantity remains 0
      await assertStockMath(superuser, prodA, 4, 0);
      await assertReservationCount(superuser, orderId, 0);
    } finally {
      await cleanup();
      await superuser.end();
    }
  });

  // R2-T1-02: Atomic reservation creation with deterministic locking
  s.test('R2-T1-02', 'Atomic reservation creation succeeds and increments reserved quantity', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    const orderId = `ord_atom_${runId}`;
    try {
      await seedOrder(superuser, { id: orderId });

      // Unordered items: prodB, prodA
      const items = JSON.stringify([
        { product_id: prodB, quantity: 2 },
        { product_id: prodA, quantity: 1 },
      ]);

      const res = await svcClient.query(
        'SELECT public.reserve_order_inventory($1, $2::jsonb, 15) AS result',
        [orderId, items]
      );

      const result = res.rows[0]?.result;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Stock invariant: prodA reserved 1, prodB reserved 2
      await assertStockMath(superuser, prodA, 4, 1);
      await assertStockMath(superuser, prodB, 10, 2);
      await assertReservationCount(superuser, orderId, 2, 'PENDING');
    } finally {
      await cleanup();
      await superuser.end();
    }
  });

  // R2-T1-03: Order reservation idempotency
  s.test('R2-T1-03', 'Subsequent reservation calls for same order are idempotent and do not duplicate holds', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    const orderId = `ord_idem_${runId}`;
    try {
      await seedOrder(superuser, { id: orderId });

      const items = JSON.stringify([{ product_id: prodB, quantity: 2 }]);

      // First call
      const res1 = await svcClient.query(
        'SELECT public.reserve_order_inventory($1, $2::jsonb, 15) AS result',
        [orderId, items]
      );
      expect(res1.rows[0].result.success).toBe(true);

      // Second call (idempotent replay)
      const res2 = await svcClient.query(
        'SELECT public.reserve_order_inventory($1, $2::jsonb, 15) AS result',
        [orderId, items]
      );
      const result2 = res2.rows[0].result;
      expect(result2.success).toBe(true);
      expect(result2.idempotent).toBe(true);

      // Verify reserved quantity was only incremented once (2 units)
      await assertReservationCount(superuser, orderId, 1, 'PENDING');
    } finally {
      await cleanup();
      await superuser.end();
    }
  });

  // R2-T1-04: Valid payment confirmation transition
  s.test('R2-T1-04', 'Payment confirmation transitions order, deducts stock, and confirms reservation', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    const orderId = `ord_pay_${runId}`;
    const prodPay = `prod_pay_${runId}`;
    try {
      await seedProduct(superuser, { id: prodPay, stock: 10, reserved_quantity: 0 });
      await seedOrder(superuser, { id: orderId, total_amount: 1500, razorpay_order_id: `rzp_${orderId}` });
      await seedInventoryReservation(superuser, { order_id: orderId, product_id: prodPay, quantity: 2, status: 'PENDING' });

      // Update product reserved_quantity to 2
      await superuser.query('UPDATE public.products SET reserved_quantity = 2 WHERE id = $1', [prodPay]);

      // Call payment confirmation
      const res = await svcClient.query(
        'SELECT public.confirm_order_payment($1, $2) AS result',
        [orderId, `pay_${runId}`]
      );
      expect(res.rows[0].result.success).toBe(true);

      // Stock math: physical stock was 10 -> now 8; reserved was 2 -> now 0
      await assertStockMath(superuser, prodPay, 8, 0);
      await assertReservationCount(superuser, orderId, 1, 'CONFIRMED');

      // Verify movement logged
      const movements = await superuser.query(
        'SELECT * FROM public.inventory_movements WHERE product_id = $1',
        [prodPay]
      );
      expect(movements.rowCount).toBeGreaterThan(0);
    } finally {
      await cleanup();
      await superuser.end();
    }
  });

  // R2-T1-05: Inventory conflict state on payment capture for missing/expired hold
  s.test('R2-T1-05', 'Captured payment for missing or expired hold transitions order to INVENTORY_CONFLICT', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    const orderId = `ord_conf_${runId}`;
    const prodConf = `prod_conf_${runId}`;
    try {
      await seedProduct(superuser, { id: prodConf, stock: 0, reserved_quantity: 0 });
      await seedOrder(superuser, { id: orderId, order_status: 'PENDING', payment_status: 'PENDING' });
      // No active reservation exists (expired or missing)

      await svcClient.query(
        'SELECT public.confirm_order_payment($1, $2) AS result',
        [orderId, `pay_conf_${runId}`]
      );

      // Implementation Contract (Feature 11): order transitions to INVENTORY_CONFLICT
      const order = await assertOrderStatus(superuser, orderId, 'INVENTORY_CONFLICT');
      expect(order.order_status).toBe('INVENTORY_CONFLICT');
      // Physical stock must never drop below 0
      await assertStockMath(superuser, prodConf, 0, 0);
    } finally {
      await cleanup();
      await superuser.end();
    }
  });

  // R2-T1-06: Atomic order cancellation with inventory restoration
  s.test('R2-T1-06', 'Order cancellation atomically restores confirmed inventory and logs movement', async () => {
    const superuser = await createSuperuserClient();
    const { client: svcClient, cleanup } = await createRoleClient('service_role');
    const orderId = `ord_canc_${runId}`;
    const prodCanc = `prod_canc_${runId}`;
    try {
      // Stock 8 (2 already deducted on payment confirmation)
      await seedProduct(superuser, { id: prodCanc, stock: 8, reserved_quantity: 0 });
      await seedOrder(superuser, { id: orderId, order_status: 'PROCESSING', payment_status: 'PAID' });
      await seedInventoryReservation(superuser, { order_id: orderId, product_id: prodCanc, quantity: 2, status: 'CONFIRMED' });

      const res = await svcClient.query(
        'SELECT public.cancel_order_and_restore_inventory($1, $2) AS result',
        [orderId, 'Customer cancellation request']
      );

      const result = res.rows[0]?.result;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Stock math: restored to 10
      await assertStockMath(superuser, prodCanc, 10, 0);
      await assertOrderStatus(superuser, orderId, 'CANCELLED');
    } finally {
      await cleanup();
      await superuser.end();
    }
  });
});
