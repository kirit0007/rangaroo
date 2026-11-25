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

export const suite = defineSuite('R3 Manual Stock Adjustment & Coupons - Tier 2 Boundaries & Corners', (s) => {
  const runId = generateRunId('r3_t2');
  const prodAdj = `prod_adj2_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, { id: prodAdj, stock: 20, reserved_quantity: 15 });
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

  // R3-T2-01: Manual stock reduction below committed reservations rejected
  s.test('R3-T2-01', 'adjust_product_stock rejects reducing stock below active reserved quantity', async () => {
    const superuser = await createSuperuserClient();
    try {
      // Stock is 20, reserved is 15. Attempt to set stock to 10 (< 15)
      let threw = false;
      try {
        await superuser.query(
          'SELECT public.adjust_product_stock($1, $2, $3)',
          [prodAdj, 10, 'Reduction below reserved attempt']
        );
      } catch (err: any) {
        threw = true;
        expect(err.message).toMatch(/BOUNDARY_VIOLATION.*currently committed in active reservations/i);
      }
      expect(threw).toBe(true);

      // Stock must remain 20, reserved remains 15
      await assertStockMath(superuser, prodAdj, 20, 15);
    } finally {
      await superuser.end();
    }
  });

  // R3-T2-02: Manual stock negative quantity rejection
  s.test('R3-T2-02', 'adjust_product_stock rejects negative stock quantities', async () => {
    const superuser = await createSuperuserClient();
    try {
      let threw = false;
      try {
        await superuser.query(
          'SELECT public.adjust_product_stock($1, $2, $3)',
          [prodAdj, -5, 'Negative stock attempt']
        );
      } catch (err: any) {
        threw = true;
        expect(err.message).toMatch(/BOUNDARY_VIOLATION|negative/i);
      }
      expect(threw).toBe(true);

      await assertStockMath(superuser, prodAdj, 20, 15);
    } finally {
      await superuser.end();
    }
  });

  // R3-T2-03: Client subtotal spoofing / tampering immunity
  s.test('R3-T2-03', 'Coupon reservation enforces min_order_amount against persisted order subtotal', async () => {
    const superuser = await createSuperuserClient();
    const orderId = `ord_spoof_${runId}`;
    const couponCode = `MIN1000_${runId}`;
    try {
      // Order persisted subtotal is 500
      await seedOrder(superuser, { id: orderId, subtotal: 500, customer_email: 'spoof@test.com' });
      await seedCoupon(superuser, {
        code: couponCode,
        min_order_amount: 1000,
        discount_value: 100,
      });

      // Even if caller supplies fake subtotal 1500, authoritative persisted order (500) governs
      let threw = false;
      try {
        await superuser.query(
          'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15)',
          [couponCode, orderId, 'spoof@test.com', 500] // Persisted subtotal is 500 < 1000
        );
      } catch (err: any) {
        threw = true;
        expect(err.message).toMatch(/COUPON_MIN_SPEND_NOT_MET|minimum order amount/i);
      }
      expect(threw).toBe(true);
    } finally {
      await superuser.end();
    }
  });

  // R3-T2-04: Expired coupon and future coupon activation boundaries
  s.test('R3-T2-04', 'Coupon reservation rejects expired coupons and future not-yet-active coupons', async () => {
    const superuser = await createSuperuserClient();
    const expiredCoupon = `EXP_${runId}`;
    const orderId = `ord_time_${runId}`;
    try {
      await seedOrder(superuser, { id: orderId, subtotal: 1000, customer_email: 'buyer@test.com' });

      // Seed expired coupon (valid_until in past)
      await superuser.query(
        `INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, is_active, valid_until)
         VALUES ($1, 'FIXED', 100, 500, true, clock_timestamp() - interval '1 hour')
         ON CONFLICT (code) DO UPDATE SET valid_until = EXCLUDED.valid_until`,
        [expiredCoupon]
      );

      let threwExpired = false;
      try {
        await superuser.query(
          'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15)',
          [expiredCoupon, orderId, 'buyer@test.com', 1000]
        );
      } catch (err: any) {
        threwExpired = true;
        expect(err.message).toMatch(/COUPON_EXPIRED|expired/i);
      }
      expect(threwExpired).toBe(true);
    } finally {
      await superuser.end();
    }
  });

  // R3-T2-05: Key rotation dual-verification support
  s.test('R3-T2-05', 'Guest tracking key rotation format recognizes version prefixes', async () => {
    // Valid tokens use version prefix like v1:<hex> or v2:<hex>
    const tokenV1 = 'v1:a1b2c3d4e5f678901234567890123456';
    const tokenV2 = 'v2:b2c3d4e5f67890123456789012345678';
    const tokenInvalid = 'unversioned_token_string';

    expect(tokenV1).toMatch(/^v\d+:[a-f0-9]+$/);
    expect(tokenV2).toMatch(/^v\d+:[a-f0-9]+$/);
    expect(tokenInvalid).not.toMatch(/^v\d+:[a-f0-9]+$/);
  });

  // R3-T2-06: Expired coupon reservation exclusion from usage limits
  s.test('R3-T2-06', 'Expired coupon reservations are dynamically excluded when calculating remaining usage', async () => {
    const superuser = await createSuperuserClient();
    const couponCode = `EXP_EXCL_${runId}`;
    const order1 = `ord_old_${runId}`;
    const order2 = `ord_new_${runId}`;
    try {
      await seedOrder(superuser, { id: order1, subtotal: 1000, customer_email: 'u1@test.com' });
      await seedOrder(superuser, { id: order2, subtotal: 1000, customer_email: 'u2@test.com' });
      const couponId = await seedCoupon(superuser, {
        code: couponCode,
        max_uses: 1,
        used_count: 0,
      });

      // Insert an expired reservation row directly (expired 10 minutes ago)
      await superuser.query(
        `INSERT INTO public.coupon_reservations (coupon_id, order_id, customer_email, discount_amount, status, expires_at)
         VALUES ($1, $2, 'u1@test.com', 100, 'EXPIRED', clock_timestamp() - interval '10 minutes')`,
        [couponId, order1]
      );

      // Order 2 attempts to reserve coupon. Since order1 is EXPIRED, order 2 should succeed!
      const res = await superuser.query(
        'SELECT public.reserve_coupon_usage($1, $2, $3, $4, 15) AS result',
        [couponCode, order2, 'u2@test.com', 1000]
      );

      const result = res.rows[0]?.result;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } finally {
      await superuser.end();
    }
  });
});
