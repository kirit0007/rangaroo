import { defineSuite, expect } from '../helpers/test-runner';
import { createRoleClient, createSuperuserClient } from '../helpers/db-client';
import { generateRunId, seedProduct, cleanTestFixtures } from '../helpers/fixtures';

export const suite = defineSuite('R1 Database Permissions & Views - Tier 2 Boundaries & Corners', (s) => {
  const runId = generateRunId('r1_t2');
  const activeProductId = `prod_act_${runId}`;
  const inactiveProductId = `prod_inact_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, {
        id: activeProductId,
        name: 'Active Product',
        stock: 10,
        cost_price: 100,
        is_active: true,
      });
      await seedProduct(superuser, {
        id: inactiveProductId,
        name: 'Inactive Product',
        stock: 10,
        cost_price: 100,
        is_active: false,
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

  // R1-T2-01: Confidential column projection prevention on public_products
  s.test('R1-T2-01', 'Confidential base table columns (cost_price) are not exposed in public_products schema', async () => {
    const { client, cleanup } = await createRoleClient('anon');
    try {
      let threw = false;
      try {
        await client.query('SELECT cost_price FROM public.public_products LIMIT 1');
      } catch (err: any) {
        threw = true;
        expect(err.code).toBe('42703'); // undefined_column
        expect(err.message).toMatch(/column "cost_price" does not exist/i);
      }
      expect(threw).toBe(true);
    } finally {
      await cleanup();
    }
  });

  // R1-T2-02: Inactive product filtering boundary
  s.test('R1-T2-02', 'Inactive products (is_active = false) are strictly excluded from public_products view', async () => {
    const { client, cleanup } = await createRoleClient('anon');
    try {
      const res = await client.query('SELECT id FROM public.public_products WHERE id = $1', [inactiveProductId]);
      expect(res.rowCount).toBe(0);

      // Verify active product is visible
      const activeRes = await client.query('SELECT id FROM public.public_products WHERE id = $1', [activeProductId]);
      expect(activeRes.rowCount).toBe(1);
    } finally {
      await cleanup();
    }
  });

  // R1-T2-03: View owner privilege escalation attempt
  s.test('R1-T2-03', 'Role products_view_owner cannot SELECT confidential columns from base products table', async () => {
    const { client, cleanup } = await createRoleClient('products_view_owner');
    try {
      let threw = false;
      try {
        await client.query('SELECT cost_price FROM public.products LIMIT 1');
      } catch (err: any) {
        threw = true;
        expect(err.code).toBe('42501'); // permission denied for column cost_price
        expect(err.message).toMatch(/permission denied for (column|table|relation)/i);
      }
      expect(threw).toBe(true);
    } finally {
      await cleanup();
    }
  });

  // R1-T2-04: Future function default execute privilege revocation
  s.test('R1-T2-04', 'Default PUBLIC execute privileges on newly created functions in public are revoked', async () => {
    const superuser = await createSuperuserClient();
    const funcName = `test_priv_leak_${runId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    try {
      // Create a test function as superuser without explicit GRANT
      await superuser.query(
        `CREATE OR REPLACE FUNCTION public.${funcName}() RETURNS integer LANGUAGE sql AS $$ SELECT 42; $$;`
      );

      // Check execute privilege for anon
      const { client, cleanup } = await createRoleClient('anon');
      try {
        let threw = false;
        try {
          await client.query(`SELECT public.${funcName}()`);
        } catch (err: any) {
          threw = true;
          expect(err.code).toBe('42501'); // permission denied
        }
        expect(threw).toBe(true);
      } finally {
        await cleanup();
      }
    } finally {
      try {
        await superuser.query(`DROP FUNCTION IF EXISTS public.${funcName}()`);
      } catch {}
      await superuser.end();
    }
  });

  // R1-T2-05: Search path injection immunity on SECURITY DEFINER functions
  s.test('R1-T2-05', 'SECURITY DEFINER functions configure a safe, empty or explicit search_path', async () => {
    const superuser = await createSuperuserClient();
    try {
      const res = await superuser.query(
        `SELECT proname, proconfig 
         FROM pg_proc 
         JOIN pg_namespace n ON pg_proc.pronamespace = n.oid 
         WHERE n.nspname = 'public' 
           AND proname IN ('reserve_order_inventory', 'confirm_order_payment', 'reserve_coupon_usage', 'adjust_product_stock')`
      );

      expect(res.rowCount).toBeGreaterThan(0);
      for (const row of res.rows) {
        const proconfig: string[] = row.proconfig || [];
        const hasSafeSearchPath = proconfig.some((cfg) =>
          cfg.includes('search_path=') || cfg.includes('search_path=""')
        );
        expect(hasSafeSearchPath).toBe(true);
      }
    } finally {
      await superuser.end();
    }
  });

  // R1-T2-06: Coupon base table direct SELECT denied to anon and authenticated
  s.test('R1-T2-06', 'Direct SELECT on public.coupons and coupon_reservations is denied to anon and authenticated', async () => {
    const roles: ('anon' | 'authenticated')[] = ['anon', 'authenticated'];
    for (const role of roles) {
      const { client, cleanup } = await createRoleClient(role);
      try {
        let threwCoupons = false;
        try {
          await client.query('SELECT * FROM public.coupons LIMIT 5');
        } catch (err: any) {
          threwCoupons = true;
          expect(err.code).toBe('42501');
        }
        expect(threwCoupons).toBe(true);

        let threwReservations = false;
        try {
          await client.query('SELECT * FROM public.coupon_reservations LIMIT 5');
        } catch (err: any) {
          threwReservations = true;
          expect(err.code).toBe('42501');
        }
        expect(threwReservations).toBe(true);
      } finally {
        await cleanup();
      }
    }
  });
});
