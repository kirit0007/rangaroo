import { Client } from 'pg';
import crypto from 'crypto';

/**
 * Dynamic run-key generator guaranteeing zero collisions across test runs.
 */
export function generateRunId(prefix: string = 'e2e'): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Foreign-key safe reverse teardown hook.
 * Deletes all fixtures created for a given run ID / prefix in strict reverse dependency order.
 */
export async function cleanTestFixtures(client: Client, runPrefix: string = 'e2e_%'): Promise<void> {
  const pattern = runPrefix.includes('%') ? runPrefix : `%${runPrefix}%`;

  // Ensure any aborted transaction in client is safely rolled back before cleanup
  await client.query('ROLLBACK').catch(() => {});
  await client.query('BEGIN');
  try {
    // 1. Inventory movements (references products and order reference_ids)
    await client.query('DELETE FROM public.inventory_movements WHERE reference_id LIKE $1 OR product_id LIKE $1', [pattern]);

    // 2. Inventory reservations (references products and orders)
    await client.query('DELETE FROM public.inventory_reservations WHERE order_id LIKE $1 OR product_id LIKE $1', [pattern]);

    // 3. Coupon reservations (references coupons and orders)
    await client.query(
      `DELETE FROM public.coupon_reservations 
       WHERE order_id LIKE $1 
          OR coupon_id IN (SELECT id FROM public.coupons WHERE code LIKE $1)`,
      [pattern]
    );

    // 4. Razorpay webhook events
    await client.query('DELETE FROM public.razorpay_webhook_events WHERE event_id LIKE $1', [pattern]);

    // 5. Rate limit entries
    await client.query('DELETE FROM public.rate_limits WHERE key LIKE $1', [pattern]);

    // 6. Orders
    await client.query('DELETE FROM public.orders WHERE id LIKE $1 OR order_number LIKE $1', [pattern]);

    // 7. Coupons
    await client.query('DELETE FROM public.coupons WHERE code LIKE $1', [pattern]);

    // 8. Products
    await client.query('DELETE FROM public.products WHERE id LIKE $1', [pattern]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

export interface SeedProductParams {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock: number;
  reserved_quantity?: number;
  cost_price?: number;
  is_active?: boolean;
}

export async function seedProduct(client: Client, params: SeedProductParams): Promise<void> {
  const name = params.name || `Test Product ${params.id}`;
  const slug = params.slug || `test-prod-${params.id}`;
  const description = params.description || 'Test Product Description';
  const price = params.price ?? 999.0;
  const reserved = params.reserved_quantity ?? 0;
  const cost = params.cost_price ?? 500.0;
  const active = params.is_active ?? true;

  await client.query(
    `INSERT INTO public.products (
      id, name, slug, description, price, stock, reserved_quantity, cost_price, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET
      stock = EXCLUDED.stock,
      reserved_quantity = EXCLUDED.reserved_quantity,
      updated_at = clock_timestamp();`,
    [params.id, name, slug, description, price, params.stock, reserved, cost, active]
  );
}

export interface SeedOrderParams {
  id: string;
  order_number?: string;
  customer_name?: string;
  customer_email?: string;
  total_amount?: number;
  subtotal?: number;
  payment_status?: 'PENDING' | 'PAID' | 'FAILED';
  order_status?: 'PENDING' | 'PROCESSING' | 'DISPATCHED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'INVENTORY_CONFLICT';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
}

export async function seedOrder(client: Client, params: SeedOrderParams): Promise<void> {
  const orderNumber = params.order_number || params.id;
  const customerName = params.customer_name || 'Test Customer';
  const customerEmail = params.customer_email || 'test@customer.com';
  const total = params.total_amount ?? 500.0;
  const subtotal = params.subtotal ?? total;
  const paymentStatus = params.payment_status || 'PENDING';
  const orderStatus = params.order_status || 'PENDING';
  const rzpOrderId = params.razorpay_order_id || `order_rzp_${params.id}`;
  const rzpPaymentId = params.razorpay_payment_id || null;

  await client.query(
    `INSERT INTO public.orders (
      id, order_number, customer_name, customer_email, total_amount, subtotal,
      payment_status, order_status, razorpay_order_id, razorpay_payment_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET
      payment_status = EXCLUDED.payment_status,
      order_status = EXCLUDED.order_status,
      razorpay_payment_id = EXCLUDED.razorpay_payment_id,
      updated_at = clock_timestamp();`,
    [
      params.id,
      orderNumber,
      customerName,
      customerEmail,
      total,
      subtotal,
      paymentStatus,
      orderStatus,
      rzpOrderId,
      rzpPaymentId,
    ]
  );
}

export interface SeedCouponParams {
  code: string;
  discount_type?: 'PERCENTAGE' | 'FIXED';
  discount_value?: number;
  min_order_amount?: number;
  max_uses?: number | null;
  max_uses_per_user?: number;
  used_count?: number;
  is_active?: boolean;
}

export async function seedCoupon(client: Client, params: SeedCouponParams): Promise<string> {
  const discountType = params.discount_type || 'FIXED';
  const discountVal = params.discount_value ?? 100.0;
  const minSpend = params.min_order_amount ?? 200.0;
  const maxUses = params.max_uses === undefined ? 1 : params.max_uses;
  const maxPerUser = params.max_uses_per_user ?? 1;
  const usedCount = params.used_count ?? 0;
  const active = params.is_active ?? true;

  const res = await client.query(
    `INSERT INTO public.coupons (
      code, discount_type, discount_value, min_order_amount,
      max_uses, max_uses_per_user, used_count, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id;`,
    [
      params.code,
      discountType,
      discountVal,
      minSpend,
      maxUses,
      maxPerUser,
      usedCount,
      active,
    ]
  );

  return res.rows[0].id;
}

export interface SeedReservationParams {
  order_id: string;
  product_id: string;
  quantity: number;
  status?: 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';
  expires_at?: Date;
}

export async function seedInventoryReservation(
  client: Client,
  params: SeedReservationParams
): Promise<string> {
  const status = params.status || 'PENDING';
  const expiresAt = params.expires_at || new Date(Date.now() + 15 * 60 * 1000);

  const res = await client.query(
    `INSERT INTO public.inventory_reservations (
      order_id, product_id, quantity, status, expires_at
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id;`,
    [params.order_id, params.product_id, params.quantity, status, expiresAt]
  );

  return res.rows[0].id;
}
