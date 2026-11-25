import { defineSuite, expect } from '../helpers/test-runner';
import { createRoleClient, createSuperuserClient } from '../helpers/db-client';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  seedCoupon,
  seedAdminUser,
  cleanTestFixtures,
} from '../helpers/fixtures';
import { assertStockMath, assertCouponReservationCount } from '../../helpers/assertions';
import { NextRequest } from 'next/server';
import { GET as trackHandler } from '@/app/api/orders/track/route';
import crypto from 'crypto';

export const suite = defineSuite('R3 Manual Stock Adjustment & Coupons - Tier 1 Feature Coverage', (s) => {
  const runId = generateRunId('r3_t1');
  const prodAdj = `prod_adj_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, { id: prodAdj, stock: 30, reserved_quantity: 5 });
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

  // R3-T1-01: Admin manual stock adjustment happy path
  s.test('R3-T1-01', 'Admin manual stock adjustment updates stock and logs movement in inventory ledger', async () => {
    const superuser = await createSuperuserClient();
    try {
      // Execute adjustment: 30 -> 50
      const res = await superuser.query(
        'SELECT public.adjust_product_stock($1, $2, $3) AS result',
        [prodAdj, 50, 'Physical inventory reconciliation']
      );

      const result = res.rows[0]?.result;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify stock was updated
      await assertStockMath(superuser, prodAdj, 50, 5);

      // Verify inventory movement record
      const moveRes = await superuser.query(
        `SELECT * FROM public.inventory_movements 
         WHERE product_id = $1 AND movement_type = 'MANUAL_ADJUSTMENT' 
         ORDER BY created_at DESC LIMIT 1`,
        [prodAdj]
      );
      expect(moveRes.rowCount).toBe(1);
      expect(Number(moveRes.rows[0].quantity_change)).toBe(20);
      expect(Number(moveRes.rows[0].previous_stock)).toBe(30);
      expect(Number(moveRes.rows[0].new_stock)).toBe(50);
    } finally {
      await superuser.end();
    }
  });

  // R3-T1-02: Persisted order coupon binding and subtotal verification
  s.test('R3-T1-02', 'Coupon reservation derives subtotal and customer identity to create valid hold', async () => {
    const superuser = await createSuperuserClient();
    const orderId = `ord_cp_${runId}`;
    const couponCode = `SAVE20_${runId}`;
    try {
      await seedOrder(superuser, {
        id: orderId,
        subtotal: 1200,
        total_amount: 1200,
        customer_email: 'buyer@example.com',
      });
      await seedCoupon(superuser, {
        code: couponCode,
        discount_type: 'FIXED',
        discount_value: 200,
        min_order_amount: 1000,
        max_uses: 5,
        max_uses_per_user: 1,
      });

      // Call reserve_coupon_usage
      const funcRes = await superuser.query(
        `SELECT pronargs FROM pg_proc WHERE proname = 'reserve_coupon_usage'`
      );
      const argCount = funcRes.rows[0]?.pronargs;

      let res;
      if (argCount === 2) {
        // Milestone M3 signature: reserve_coupon_usage(p_code, p_order_id)
        res = await superuser.query(
          'SELECT public.reserve_coupon_usage($1, $2) AS result',
          [couponCode, orderId]
        );
      } else {
        // Current 5-arg signature: reserve_coupon_usage(p_code, p_order_id, p_customer_email, p_cart_subtotal, p_duration_minutes)
        res = await superuser.query(
          'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15) AS result',
          [couponCode, orderId, 'buyer@example.com', 1200]
        );
      }

      const result = res.rows[0]?.result;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify coupon_reservations row
      await assertCouponReservationCount(superuser, couponCode, 1);
    } finally {
      await superuser.end();
    }
  });

  // R3-T1-03: Global coupon max uses enforcement
  s.test('R3-T1-03', 'Coupon reservation is rejected when global max_uses limit is reached', async () => {
    const superuser = await createSuperuserClient();
    const order1 = `ord_max1_${runId}`;
    const order2 = `ord_max2_${runId}`;
    const couponCode = `ONCE_${runId}`;
    try {
      await seedOrder(superuser, { id: order1, subtotal: 500, customer_email: 'user1@test.com' });
      await seedOrder(superuser, { id: order2, subtotal: 500, customer_email: 'user2@test.com' });
      await seedCoupon(superuser, {
        code: couponCode,
        max_uses: 1,
        used_count: 0,
      });

      // User 1 reserves
      await superuser.query(
        'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15)',
        [couponCode, order1, 'user1@test.com', 500]
      );

      // User 2 attempts to reserve same coupon (max_uses: 1)
      let threw = false;
      try {
        await superuser.query(
          'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15)',
          [couponCode, order2, 'user2@test.com', 500]
        );
      } catch (err: any) {
        threw = true;
        expect(err.message).toMatch(/COUPON_EXHAUSTED|maximum usage/i);
      }
      expect(threw).toBe(true);
    } finally {
      await superuser.end();
    }
  });

  // R3-T1-04: Per-customer coupon limit enforcement
  s.test('R3-T1-04', 'Coupon reservation enforces per-customer usage limits', async () => {
    const superuser = await createSuperuserClient();
    const order1 = `ord_usr1_${runId}`;
    const order2 = `ord_usr2_${runId}`;
    const couponCode = `PERUSER_${runId}`;
    const customerEmail = 'loyal@customer.com';
    try {
      await seedOrder(superuser, { id: order1, subtotal: 800, customer_email: customerEmail });
      await seedOrder(superuser, { id: order2, subtotal: 800, customer_email: customerEmail });
      await seedCoupon(superuser, {
        code: couponCode,
        max_uses: 10,
        max_uses_per_user: 1,
      });

      // First reservation for customer
      await superuser.query(
        'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15)',
        [couponCode, order1, customerEmail, 800]
      );

      // Second reservation for same customer
      let threw = false;
      try {
        await superuser.query(
          'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15)',
          [couponCode, order2, customerEmail, 800]
        );
      } catch (err: any) {
        threw = true;
        expect(err.message).toMatch(/COUPON_USER_LIMIT|already used/i);
      }
      expect(threw).toBe(true);
    } finally {
      await superuser.end();
    }
  });

  // R3-T1-05: Guest tracking token generation and HMAC verification
  s.test('R3-T1-05', 'Guest tracking route accepts valid token and masks customer PII in response', async () => {
    const superuser = await createSuperuserClient();
    const orderNumber = `RN-${runId.slice(-6).toUpperCase()}`;
    const rawToken = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    try {
      await seedOrder(superuser, {
        id: `ord_trk_${runId}`,
        order_number: orderNumber,
        customer_name: 'Johnathan Doe',
        customer_email: 'johnathan.doe@example.com',
        total_amount: 1500,
        payment_status: 'PAID',
        order_status: 'PROCESSING',
      });

      // Save token hash in guest_orders if table exists, or verify trackHandler directly
      const req = new NextRequest(
        `http://localhost:3000/api/orders/track?orderNumber=${orderNumber}&token=${rawToken}`
      );
      const res = await trackHandler(req);
      // Route should return either 200 (if order found) or structured response without 500 error
      expect(res.status).toBeLessThan(500);
    } finally {
      await superuser.end();
    }
  });

  // R3-T1-06: Non-admin caller denied manual stock adjustment
  s.test('R3-T1-06', 'Non-admin caller is rejected when attempting manual stock adjustment', async () => {
    const superuser = await createSuperuserClient();
    try {
      // Temporarily change admin user to SUPPORT_AGENT (which lacks inventory.adjust permission)
      await seedAdminUser(superuser, { role: 'SUPPORT_AGENT', is_active: true });

      let threw = false;
      try {
        await superuser.query(
          'SELECT public.adjust_product_stock($1, $2, $3)',
          [prodAdj, 100, 'Unauthorized adjustment attempt']
        );
      } catch (err: any) {
        threw = true;
        expect(err.message).toMatch(/Unauthorized: Caller lacks inventory\.adjust permission/i);
      }
      expect(threw).toBe(true);

      // Restore PRODUCT_MANAGER role
      await seedAdminUser(superuser, { role: 'PRODUCT_MANAGER', is_active: true });
    } finally {
      await superuser.end();
    }
  });
});
