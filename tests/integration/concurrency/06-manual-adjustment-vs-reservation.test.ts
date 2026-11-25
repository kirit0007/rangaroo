import { createSessionPair } from '../../helpers/connection';
import { Barrier } from '../../helpers/barrier';
import {
  generateRunId,
  seedProduct,
  seedOrder,
  cleanTestFixtures,
} from '../../helpers/db-fixtures';
import {
  assertStockMath,
  assertDistinctSessions,
} from '../../helpers/assertions';
import { TestResult } from './01-same-order-reservation.test';

/**
 * Race 6: Manual Adjustment Racing with Reservation (Stock >= Reserved Invariant)
 *
 * Vulnerability Vector:
 * An inventory manager manually reduces physical stock downward (e.g., damaged items removed)
 * while a customer concurrently places a reservation. If the adjustment reduces stock below active
 * commitments, the store overcommits physical inventory, causing stock < reserved (negative available).
 *
 * Guaranteed Invariant:
 * 1. Product row lock (SELECT ... FOR UPDATE) forces strict serialization.
 * 2. If Admin wins lock first: stock reduces to 3; Customer reservation is rejected with INSUFFICIENT_STOCK.
 * 3. If Customer wins lock first: reserved increases to 7; Admin adjustment is rejected with BOUNDARY_VIOLATION.
 * 4. In ALL interleavings: stock >= reserved_quantity invariant is NEVER violated. Available stock is never negative.
 */
export async function runTest(): Promise<TestResult> {
  const startTime = Date.now();
  const runId = generateRunId('race6');
  const pair = await createSessionPair('race6');

  try {
    assertDistinctSessions(pair.sessionA, pair.sessionB);

    const productId = `prod_adj_${runId}`;
    const orderId = `ord_adj_${runId}`;
    const initialStock = 10;
    const initialReserved = 2; // Available = 8
    const adminTargetStock = 3; // Valid for initial reserved 2 (3 >= 2), but invalid if reserved becomes 7
    const customerRequestedQty = 5; // Valid for initial available 8 (8 >= 5), but invalid if stock drops to 3 (3 - 2 = 1 < 5)

    // 1. Seed product with stock = 10, reserved = 2 (available = 8)
    await seedProduct(pair.sessionA.client, {
      id: productId,
      stock: initialStock,
      reserved_quantity: initialReserved,
    });
    await seedOrder(pair.sessionB.client, { id: orderId, order_status: 'PENDING' });

    // Seed admin user for Session A so has_admin_permission('inventory.adjust') succeeds
    const adminUidRes = await pair.sessionA.client.query('SELECT auth.uid() AS uid');
    const adminUid = adminUidRes.rows[0].uid;
    await pair.sessionA.client.query(
      'INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [adminUid, `admin_${runId}@example.com`]
    );
    await pair.sessionA.client.query(
      `INSERT INTO public.admin_users (id, email, full_name, role, is_active)
       VALUES ($1, $2, 'Admin Adjuster', 'SUPER_ADMIN', true)
       ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN', is_active = true`,
      [adminUid, `admin_${runId}@example.com`]
    );

    // 2. Setup Barrier for simultaneous dispatch
    const barrier = new Barrier(2);

    // Session A: Admin attempts to adjust stock down to 3
    const adminTask = async () => {
      await barrier.wait(5000);
      return pair.sessionA.client.query(
        'SELECT public.adjust_product_stock($1, $2, $3) AS result',
        [productId, adminTargetStock, 'Inventory reduction for damaged goods']
      );
    };

    // Session B: Customer attempts to reserve 5 units
    const customerTask = async () => {
      await barrier.wait(5000);
      const items = JSON.stringify([{ product_id: productId, quantity: customerRequestedQty }]);
      return pair.sessionB.client.query(
        'SELECT public.reserve_order_inventory($1, $2::jsonb, $3) AS result',
        [orderId, items, 15]
      );
    };

    // 3. Dispatch simultaneous queries across independent PostgreSQL connections
    const [adminRes, custRes] = await Promise.allSettled([adminTask(), customerTask()]);

    const adminSucceeded = adminRes.status === 'fulfilled' && adminRes.value.rows[0]?.result?.success;
    const custSucceeded = custRes.status === 'fulfilled' && custRes.value.rows[0]?.result?.success;

    // Both cannot succeed simultaneously without violating bounds
    if (adminSucceeded && custSucceeded) {
      throw new Error(
        `CONCURRENCY BOUNDARY VIOLATION: Both admin adjustment to 3 and customer reservation of 5 succeeded simultaneously!`
      );
    }

    // Exactly one operation must have succeeded and one must have failed
    if (!adminSucceeded && !custSucceeded) {
      throw new Error(
        `Neither operation succeeded. Admin: ${JSON.stringify(adminRes)}, Customer: ${JSON.stringify(
          custRes
        )}`
      );
    }

    // 4. Assert stock conservation invariant: stock >= reserved_quantity, available >= 0
    const finalState = await pair.sessionA.client.query(
      'SELECT stock, reserved_quantity FROM public.products WHERE id = $1',
      [productId]
    );
    const finalStock = Number(finalState.rows[0].stock);
    const finalReserved = Number(finalState.rows[0].reserved_quantity);

    if (finalStock < finalReserved) {
      throw new Error(
        `CRITICAL STOCK CONSERVATION INVARIANT VIOLATION: Final stock (${finalStock}) < final reserved (${finalReserved})! Negative available stock created.`
      );
    }

    if (adminSucceeded) {
      // Admin won: stock = 3, reserved = 2, available = 1
      await assertStockMath(pair.sessionA.client, productId, adminTargetStock, initialReserved);
    } else {
      // Customer won: stock = 10, reserved = 7, available = 3
      await assertStockMath(
        pair.sessionA.client,
        productId,
        initialStock,
        initialReserved + customerRequestedQty
      );
    }

    const durationMs = Date.now() - startTime;
    return {
      name: '06-manual-adjustment-vs-reservation',
      passed: true,
      durationMs,
      details: `Stock >= reserved invariant strictly conserved. Winner: ${
        adminSucceeded ? 'Admin Adjustment' : 'Customer Reservation'
      }. Available stock never negative. PIDs: [${pair.sessionA.pid}, ${pair.sessionB.pid}]`,
      pids: { sessionA: pair.sessionA.pid, sessionB: pair.sessionB.pid },
    };
  } finally {
    try {
      await cleanTestFixtures(pair.sessionA.client, runId);
    } catch {
      // Ignore cleanup error to preserve test exception
    }
    await pair.cleanup();
  }
}

if (process.argv[1] && process.argv[1].includes('06-manual-adjustment-vs-reservation')) {
  runTest()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}
