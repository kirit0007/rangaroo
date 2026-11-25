import { defineSuite, expect } from '../helpers/test-runner';
import { createRoleClient, createSuperuserClient } from '../helpers/db-client';
import { generateRunId, seedProduct, cleanTestFixtures } from '../helpers/fixtures';

export const suite = defineSuite('R1 Database Permissions & Views - Tier 1 Feature Coverage', (s) => {
  const runId = generateRunId('r1_t1');
  const testProductId = `prod_${runId}`;

  s.beforeAll(async () => {
    const superuser = await createSuperuserClient();
    try {
      await seedProduct(superuser, {
        id: testProductId,
        name: 'R1 Tier 1 Product',
        stock: 25,
        reserved_quantity: 5,
        cost_price: 150,
        is_active: true,
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

  // R1-T1-01: Base table direct SELECT denied to anon role
  s.test('R1-T1-01', 'Direct SELECT on public.products is denied to anon role', async () => {
    const { client, cleanup } = await createRoleClient('anon');
    try {
      let threw = false;
      try {
        await client.query('SELECT id, name, price FROM public.products LIMIT 5');
      } catch (err: any) {
        threw = true;
        expect(err.code).toBe('42501'); // permission denied
        expect(err.message).toMatch(/permission denied for (table|relation) products/i);
      }
      expect(threw).toBe(true);
    } finally {
      await cleanup();
    }
  });

  // R1-T1-02: Base table direct SELECT denied to authenticated role
  s.test('R1-T1-02', 'Direct SELECT on public.inventory_reservations is denied to authenticated role', async () => {
    const { client, cleanup } = await createRoleClient('authenticated');
    try {
      let threw = false;
      try {
        await client.query('SELECT * FROM public.inventory_reservations LIMIT 5');
      } catch (err: any) {
        threw = true;
        expect(err.code).toBe('42501'); // permission denied
        expect(err.message).toMatch(/permission denied for (table|relation) inventory_reservations/i);
      }
      expect(threw).toBe(true);
    } finally {
      await cleanup();
    }
  });

  // R1-T1-03: Public products view query succeeds for anon
  s.test('R1-T1-03', 'SELECT on public.public_products succeeds for anon and returns sanitized stock', async () => {
    const { client, cleanup } = await createRoleClient('anon');
    try {
      const res = await client.query('SELECT id, name, price, stock FROM public.public_products WHERE id = $1', [testProductId]);
      expect(res.rowCount).toBe(1);
      const row = res.rows[0];
      expect(row.id).toBe(testProductId);
      expect(row.name).toBe('R1 Tier 1 Product');
      // Stock should be computed as GREATEST(0, stock - reserved_quantity) = 25 - 5 = 20
      expect(Number(row.stock)).toBe(20);
    } finally {
      await cleanup();
    }
  });

  // R1-T1-04: Dedicated view owner role attributes verification
  s.test('R1-T1-04', 'View owner role products_view_owner has NOLOGIN, NOBYPASSRLS, and owns public_products', async () => {
    const superuser = await createSuperuserClient();
    try {
      const roleRes = await superuser.query(
        `SELECT rolcanlogin, rolsuper, rolbypassrls 
         FROM pg_roles 
         WHERE rolname = 'products_view_owner'`
      );
      expect(roleRes.rowCount).toBe(1);
      const role = roleRes.rows[0];
      expect(role.rolcanlogin).toBe(false);
      expect(role.rolsuper).toBe(false);
      expect(role.rolbypassrls).toBe(false);

      const viewRes = await superuser.query(
        `SELECT viewowner 
         FROM pg_views 
         WHERE schemaname = 'public' AND viewname = 'public_products'`
      );
      expect(viewRes.rowCount).toBe(1);
      expect(viewRes.rows[0].viewowner).toBe('products_view_owner');
    } finally {
      await superuser.end();
    }
  });

  // R1-T1-05: Sensitive SECURITY DEFINER RPC execute denied to anon and authenticated
  s.test('R1-T1-05', 'EXECUTE on reserve_order_inventory is denied to anon and authenticated roles', async () => {
    const roles: ('anon' | 'authenticated')[] = ['anon', 'authenticated'];
    for (const role of roles) {
      const { client, cleanup } = await createRoleClient(role);
      try {
        let threw = false;
        try {
          await client.query(
            `SELECT public.reserve_order_inventory('test-ord', '[]'::jsonb, 15)`
          );
        } catch (err: any) {
          threw = true;
          expect(err.code).toBe('42501'); // permission denied
          expect(err.message).toMatch(/permission denied for function reserve_order_inventory/i);
        }
        expect(threw).toBe(true);
      } finally {
        await cleanup();
      }
    }
  });

  // R1-T1-06: Sensitive SECURITY DEFINER RPC execute permitted to service_role
  s.test('R1-T1-06', 'EXECUTE on reserve_order_inventory is permitted to service_role', async () => {
    const { client, cleanup } = await createRoleClient('service_role');
    try {
      const items = JSON.stringify([{ product_id: testProductId, quantity: 1 }]);
      const res = await client.query(
        `SELECT public.reserve_order_inventory($1, $2::jsonb, 15) AS result`,
        [`ord_svc_${runId}`, items]
      );
      expect(res.rowCount).toBe(1);
      const result = res.rows[0].result;
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } finally {
      await cleanup();
    }
  });
});
