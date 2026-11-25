import { Client } from 'pg';
import { ConcurrencySession } from './connection';

/**
 * Asserts physical stock and reserved holds on a product row.
 * Validates the core stock conservation invariants:
 *   1. stock === expectedStock
 *   2. reserved_quantity === expectedReserved
 *   3. stock >= reserved_quantity (available stock is NEVER negative)
 *   4. reserved_quantity >= 0
 */
export async function assertStockMath(
  client: Client,
  productId: string,
  expectedStock: number,
  expectedReserved: number
): Promise<{ stock: number; reserved_quantity: number; available: number }> {
  const res = await client.query(
    'SELECT id, stock, reserved_quantity FROM public.products WHERE id = $1',
    [productId]
  );

  if (res.rowCount === 0) {
    throw new Error(`INVARIANT VIOLATION: Product ${productId} not found in catalog`);
  }

  const stock = Number(res.rows[0].stock);
  const reserved = Number(res.rows[0].reserved_quantity);
  const available = stock - reserved;

  if (stock !== expectedStock) {
    throw new Error(
      `STOCK INVARIANT VIOLATION on product ${productId}: expected physical stock ${expectedStock}, but found ${stock}`
    );
  }

  if (reserved !== expectedReserved) {
    throw new Error(
      `STOCK INVARIANT VIOLATION on product ${productId}: expected reserved_quantity ${expectedReserved}, but found ${reserved}`
    );
  }

  if (stock < reserved) {
    throw new Error(
      `CRITICAL OVERSELL VIOLATION on product ${productId}: stock (${stock}) < reserved (${reserved})! Available stock is negative (${available})!`
    );
  }

  if (reserved < 0) {
    throw new Error(
      `NEGATIVE RESERVED VIOLATION on product ${productId}: reserved_quantity (${reserved}) is negative!`
    );
  }

  return { stock, reserved_quantity: reserved, available };
}

/**
 * Asserts reservation row count and optional status filter for a given order.
 */
export async function assertReservationCount(
  client: Client,
  orderId: string,
  expectedCount: number,
  expectedStatus?: 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED'
): Promise<any[]> {
  let query = 'SELECT * FROM public.inventory_reservations WHERE order_id = $1';
  const params: any[] = [orderId];

  if (expectedStatus) {
    query += ' AND status = $2';
    params.push(expectedStatus);
  }

  const res = await client.query(query, params);

  if (res.rowCount !== expectedCount) {
    throw new Error(
      `RESERVATION COUNT INVARIANT VIOLATION: expected ${expectedCount} reservations for order ${orderId}${
        expectedStatus ? ` with status ${expectedStatus}` : ''
      }, but found ${res.rowCount}`
    );
  }

  return res.rows;
}

/**
 * Asserts order status and optional payment status.
 */
export async function assertOrderStatus(
  client: Client,
  orderId: string,
  expectedOrderStatus: string,
  expectedPaymentStatus?: string
): Promise<{ order_status: string; payment_status: string }> {
  const res = await client.query(
    'SELECT order_status, payment_status FROM public.orders WHERE id = $1 OR order_number = $1',
    [orderId]
  );

  if (res.rowCount === 0) {
    throw new Error(`ORDER INVARIANT VIOLATION: Order ${orderId} not found`);
  }

  const { order_status, payment_status } = res.rows[0];

  if (order_status !== expectedOrderStatus) {
    throw new Error(
      `ORDER STATUS INVARIANT VIOLATION for order ${orderId}: expected order_status '${expectedOrderStatus}', but found '${order_status}'`
    );
  }

  if (expectedPaymentStatus && payment_status !== expectedPaymentStatus) {
    throw new Error(
      `PAYMENT STATUS INVARIANT VIOLATION for order ${orderId}: expected payment_status '${expectedPaymentStatus}', but found '${payment_status}'`
    );
  }

  return { order_status, payment_status };
}

/**
 * Asserts coupon reservation row count for a given coupon.
 */
export async function assertCouponReservationCount(
  client: Client,
  couponCodeOrId: string,
  expectedCount: number
): Promise<any[]> {
  const res = await client.query(
    `SELECT cr.* FROM public.coupon_reservations cr
     JOIN public.coupons c ON cr.coupon_id = c.id
     WHERE c.code = $1 OR c.id::text = $1`,
    [couponCodeOrId]
  );

  if (res.rowCount !== expectedCount) {
    throw new Error(
      `COUPON RESERVATION INVARIANT VIOLATION: expected ${expectedCount} reservations for coupon ${couponCodeOrId}, but found ${res.rowCount}`
    );
  }

  return res.rows;
}

/**
 * Verifies that two sessions represent independent, distinct PostgreSQL backend server processes.
 */
export function assertDistinctSessions(
  sessionA: ConcurrencySession,
  sessionB: ConcurrencySession
): void {
  if (!sessionA.pid || !sessionB.pid) {
    throw new Error(
      `SESSION INVARIANT VIOLATION: Invalid session PID (Session A: ${sessionA.pid}, Session B: ${sessionB.pid})`
    );
  }

  if (sessionA.pid === sessionB.pid) {
    throw new Error(
      `CONCURRENCY INTEGRITY VIOLATION: Session A (${sessionA.id}) and Session B (${sessionB.id}) share identical pg_backend_pid (${sessionA.pid})! Multi-session testing requires independent connections.`
    );
  }
}

/**
 * Asserts count of webhook events for a given event ID.
 */
export async function assertWebhookEventCount(
  client: Client,
  eventId: string,
  expectedCount: number
): Promise<any[]> {
  const res = await client.query(
    'SELECT * FROM public.razorpay_webhook_events WHERE event_id = $1',
    [eventId]
  );

  if (res.rowCount !== expectedCount) {
    throw new Error(
      `WEBHOOK EVENT INVARIANT VIOLATION: expected ${expectedCount} webhook events for ${eventId}, but found ${res.rowCount}`
    );
  }

  return res.rows;
}
