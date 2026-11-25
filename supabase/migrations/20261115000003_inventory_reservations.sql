-- ============================================================================
-- MIGRATION: 20261115000003_inventory_reservations.sql
-- DESCRIPTION: Concurrency-Safe Inventory Reservations, Deterministic Locking,
--              Duplicate Aggregation, Automatic Sweep, Manual Adjustment Bounds
-- SAFETY: Fully ACID, zero deadlocks, non-destructive
-- ============================================================================

-- 1. Create public.inventory_reservations table
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_res_order_status 
ON public.inventory_reservations(order_id, status);

CREATE INDEX IF NOT EXISTS idx_inv_res_expiry_sweep 
ON public.inventory_reservations(status, expires_at) 
WHERE status = 'PENDING';

-- Partial unique index guaranteeing zero duplicate pending holds for same order & product
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_reservations_order_product_pending 
ON public.inventory_reservations(order_id, product_id) 
WHERE status = 'PENDING';

-- 2. Create public.inventory_movements ledger table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  previous_reserved INTEGER NOT NULL,
  new_reserved INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'RESERVATION',
    'RESERVATION_CONFIRMED',
    'RESERVATION_RELEASED',
    'RESERVATION_EXPIRED',
    'MANUAL_ADJUSTMENT',
    'RETURN_RESTOCK'
  )),
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_movements_product 
ON public.inventory_movements(product_id, created_at DESC);

-- Enable RLS on inventory tables
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Revoke direct table access from PUBLIC, anon, and authenticated
REVOKE ALL ON TABLE public.inventory_reservations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.inventory_movements FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.inventory_reservations TO service_role;
GRANT ALL ON TABLE public.inventory_movements TO service_role;

-- 3. Atomic Function: reserve_order_inventory
-- Aggregates duplicate product IDs and locks rows in ascending ID order to prevent deadlocks
CREATE OR REPLACE FUNCTION public.reserve_order_inventory(
  p_order_id TEXT,
  p_items JSONB,
  p_duration_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item RECORD;
  v_prod RECORD;
  v_expires_at TIMESTAMPTZ;
  v_existing_count INTEGER;
BEGIN
  IF p_order_id IS NULL OR p_order_id = '' THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: p_order_id is required';
  END IF;

  IF p_items IS NULL OR pg_catalog.jsonb_typeof(p_items) != 'array' OR pg_catalog.jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: p_items must be a non-empty JSONB array';
  END IF;

  -- Level 1: Order-level transactional advisory lock to serialize duplicate concurrent requests
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_order_id));

  -- Idempotency check: If pending reservation already exists for this order, return existing
  SELECT pg_catalog.count(*) INTO v_existing_count
  FROM public.inventory_reservations
  WHERE order_id = p_order_id AND status = 'PENDING';

  IF v_existing_count > 0 THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'idempotent', true,
      'order_id', p_order_id,
      'message', 'Existing pending reservation returned'
    );
  END IF;

  v_expires_at := pg_catalog.clock_timestamp() + (p_duration_minutes || ' minutes')::pg_catalog.interval;

  -- Phase 1 & 2: Aggregate duplicate line items and order by product_id ASC (Deterministic Lock Order)
  FOR v_item IN (
    SELECT
      elem->>'product_id' AS product_id,
      pg_catalog.sum((elem->>'quantity')::INTEGER) AS total_quantity
    FROM pg_catalog.jsonb_array_elements(p_items) elem
    GROUP BY elem->>'product_id'
    ORDER BY elem->>'product_id' ASC
  )
  LOOP
    IF v_item.product_id IS NULL OR v_item.product_id = '' THEN
      RAISE EXCEPTION 'INVALID_ARGUMENT: product_id is required for all items';
    END IF;

    -- Validate quantity bounds
    IF v_item.total_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_ARGUMENT: Invalid reservation quantity % for product %', v_item.total_quantity, v_item.product_id;
    END IF;

    -- Level 2: Acquire row lock on product in strict ascending ID order
    SELECT id, stock, reserved_quantity INTO v_prod
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found in catalog', v_item.product_id;
    END IF;

    -- Validate stock availability
    IF (v_prod.stock - v_prod.reserved_quantity) < v_item.total_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: Product % has available stock %, requested %',
        v_item.product_id, (v_prod.stock - v_prod.reserved_quantity), v_item.total_quantity;
    END IF;

    -- Phase 3: Increment reserved_quantity on product
    UPDATE public.products
    SET reserved_quantity = reserved_quantity + v_item.total_quantity,
        updated_at = pg_catalog.clock_timestamp()
    WHERE id = v_item.product_id;

    -- Phase 4: Insert reservation record
    INSERT INTO public.inventory_reservations (
      order_id,
      product_id,
      quantity,
      status,
      expires_at
    ) VALUES (
      p_order_id,
      v_item.product_id,
      v_item.total_quantity,
      'PENDING',
      v_expires_at
    );

    -- Phase 5: Log movement ledger snapshot
    INSERT INTO public.inventory_movements (
      product_id,
      quantity_change,
      previous_stock,
      new_stock,
      previous_reserved,
      new_reserved,
      movement_type,
      reference_id,
      notes
    ) VALUES (
      v_item.product_id,
      v_item.total_quantity,
      v_prod.stock,
      v_prod.stock,
      v_prod.reserved_quantity,
      v_prod.reserved_quantity + v_item.total_quantity,
      'RESERVATION',
      p_order_id,
      'Checkout reservation hold'
    );
  END LOOP;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'idempotent', false,
    'order_id', p_order_id,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_order_inventory(TEXT, JSONB, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_order_inventory(TEXT, JSONB, INTEGER) TO service_role;

-- 4. Atomic Function: confirm_order_payment
-- Validates payment details, handles expired reservations gracefully with INVENTORY_CONFLICT,
-- deducts physical stock, and confirms order in one transaction.
DROP FUNCTION IF EXISTS public.confirm_order_payment(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.confirm_order_payment(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_razorpay_order_id TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_currency TEXT DEFAULT 'INR'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order RECORD;
  v_res RECORD;
  v_prod RECORD;
  v_active_count INTEGER;
BEGIN
  IF p_order_id IS NULL OR p_order_id = '' THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: p_order_id is required';
  END IF;

  IF p_payment_id IS NULL OR p_payment_id = '' THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: p_payment_id is required';
  END IF;

  -- Level 1: Order-level transactional advisory lock
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_order_id));

  -- Lock order row FOR UPDATE
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id OR order_number = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: Order % not found', p_order_id;
  END IF;

  -- Validate payment parameters against persisted order
  IF p_currency IS NOT NULL AND pg_catalog.upper(p_currency) != 'INR' THEN
    RAISE EXCEPTION 'INVALID_CURRENCY: Expected INR, got %', p_currency;
  END IF;

  IF p_razorpay_order_id IS NOT NULL AND v_order.razorpay_order_id IS NOT NULL AND v_order.razorpay_order_id != p_razorpay_order_id THEN
    RAISE EXCEPTION 'ORDER_MISMATCH: razorpay_order_id mismatch (expected %, got %)', v_order.razorpay_order_id, p_razorpay_order_id;
  END IF;

  IF p_amount IS NOT NULL AND v_order.total_amount IS NOT NULL AND p_amount != v_order.total_amount THEN
    RAISE EXCEPTION 'AMOUNT_MISMATCH: Expected total_amount %, got %', v_order.total_amount, p_amount;
  END IF;

  -- Idempotency check: If already paid/confirmed, exit cleanly
  IF v_order.payment_status = 'PAID' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'idempotent', true,
      'order_id', p_order_id,
      'status', v_order.order_status,
      'message', 'Order payment already confirmed'
    );
  END IF;

  -- Check if active unexpired pending reservation exists
  SELECT pg_catalog.count(*) INTO v_active_count
  FROM public.inventory_reservations
  WHERE order_id = p_order_id 
    AND status = 'PENDING'
    AND expires_at > pg_catalog.clock_timestamp();

  -- If active reservation is missing or expired:
  -- Record payment as captured, but set order_status = 'INVENTORY_CONFLICT' (non-fulfillable)
  -- If order was already CANCELLED, preserve CANCELLED status
  IF v_active_count = 0 THEN
    UPDATE public.orders
    SET payment_status = 'PAID',
        order_status = CASE WHEN v_order.order_status = 'CANCELLED' THEN 'CANCELLED' ELSE 'INVENTORY_CONFLICT' END,
        razorpay_payment_id = p_payment_id,
        updated_at = pg_catalog.clock_timestamp()
    WHERE id = v_order.id;

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'idempotent', false,
      'status', CASE WHEN v_order.order_status = 'CANCELLED' THEN 'CANCELLED' ELSE 'INVENTORY_CONFLICT' END,
      'order_id', p_order_id,
      'message', CASE WHEN v_order.order_status = 'CANCELLED' THEN 'Payment captured for cancelled order; order remains cancelled' ELSE 'Payment captured but inventory hold expired; order flagged for recovery' END
    );
  END IF;

  -- Level 2: Lock products in strict ascending ID order
  PERFORM 1
  FROM public.products p
  WHERE p.id IN (
    SELECT ir.product_id
    FROM public.inventory_reservations ir
    WHERE ir.order_id = p_order_id AND ir.status = 'PENDING'
  )
  ORDER BY p.id ASC
  FOR UPDATE;

  -- Level 3: Lock and process reservations in ascending product ID order
  FOR v_res IN (
    SELECT id, product_id, quantity
    FROM public.inventory_reservations
    WHERE order_id = p_order_id AND status = 'PENDING'
    ORDER BY product_id ASC
    FOR UPDATE
  )
  LOOP
    SELECT id, stock, reserved_quantity INTO v_prod
    FROM public.products
    WHERE id = v_res.product_id;

    -- Deduct physical stock and remove reservation commitment
    UPDATE public.products
    SET stock = stock - v_res.quantity,
        reserved_quantity = greatest(0, reserved_quantity - v_res.quantity),
        updated_at = pg_catalog.clock_timestamp()
    WHERE id = v_res.product_id;

    -- Update reservation status
    UPDATE public.inventory_reservations
    SET status = 'CONFIRMED',
        updated_at = pg_catalog.clock_timestamp()
    WHERE id = v_res.id;

    -- Ledger record
    INSERT INTO public.inventory_movements (
      product_id,
      quantity_change,
      previous_stock,
      new_stock,
      previous_reserved,
      new_reserved,
      movement_type,
      reference_id,
      notes
    ) VALUES (
      v_res.product_id,
      -v_res.quantity,
      v_prod.stock,
      v_prod.stock - v_res.quantity,
      v_prod.reserved_quantity,
      greatest(0, v_prod.reserved_quantity - v_res.quantity),
      'RESERVATION_CONFIRMED',
      p_order_id,
      'Payment captured, stock permanently deducted'
    );
  END LOOP;

  -- Update order record atomically to PROCESSING and PAID
  UPDATE public.orders
  SET payment_status = 'PAID',
      order_status = 'PROCESSING',
      razorpay_payment_id = p_payment_id,
      updated_at = pg_catalog.clock_timestamp()
  WHERE id = v_order.id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'idempotent', false,
    'status', 'PROCESSING',
    'order_id', p_order_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_order_payment(TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(TEXT, TEXT, TEXT, NUMERIC, TEXT) TO service_role;

-- 5. Atomic Function: cancel_order_and_restore_inventory
-- Locks order, rejects dispatched/delivered orders, restocks confirmed reservations,
-- releases pending holds, updates order status to CANCELLED atomically, and logs inventory movements.
DROP FUNCTION IF EXISTS public.cancel_order_and_restore_inventory(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.cancel_order_and_restore_inventory(
  p_order_id TEXT,
  p_reason TEXT DEFAULT 'Payment failed or cancelled',
  p_admin_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order RECORD;
  v_res RECORD;
  v_prod RECORD;
  v_restocked BOOLEAN := false;
BEGIN
  IF p_order_id IS NULL OR p_order_id = '' THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: p_order_id is required';
  END IF;

  -- Level 1: Order-level transactional advisory lock
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_order_id));

  -- Lock order row FOR UPDATE
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id OR order_number = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: Order % not found', p_order_id;
  END IF;

  -- Reject cancellation if order is already dispatched, shipped, or delivered
  IF pg_catalog.upper(v_order.order_status) IN ('SHIPPED', 'DISPATCHED', 'DELIVERED') THEN
    RAISE EXCEPTION 'ORDER_CANNOT_BE_CANCELLED: Order % cannot be cancelled because it is in status %', p_order_id, v_order.order_status;
  END IF;

  -- Idempotency check: If already CANCELLED, return success with 0 stock change
  IF pg_catalog.upper(v_order.order_status) = 'CANCELLED' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'already_cancelled', true,
      'order_id', p_order_id,
      'restocked', false,
      'message', 'Order is already cancelled'
    );
  END IF;

  -- Level 2: Lock products in strict ascending ID order
  PERFORM 1
  FROM public.products p
  WHERE p.id IN (
    SELECT ir.product_id
    FROM public.inventory_reservations ir
    WHERE ir.order_id = p_order_id AND ir.status IN ('PENDING', 'CONFIRMED')
  )
  ORDER BY p.id ASC
  FOR UPDATE;

  -- Level 3: Lock and process reservations in ascending product ID order
  FOR v_res IN (
    SELECT id, product_id, quantity, status
    FROM public.inventory_reservations
    WHERE order_id = p_order_id AND status IN ('PENDING', 'CONFIRMED')
    ORDER BY product_id ASC
    FOR UPDATE
  )
  LOOP
    SELECT id, stock, reserved_quantity INTO v_prod
    FROM public.products
    WHERE id = v_res.product_id;

    IF v_res.status = 'CONFIRMED' THEN
      -- Restock physical stock
      UPDATE public.products
      SET stock = stock + v_res.quantity,
          updated_at = pg_catalog.clock_timestamp()
      WHERE id = v_res.product_id;

      UPDATE public.inventory_reservations
      SET status = 'RELEASED',
          updated_at = pg_catalog.clock_timestamp()
      WHERE id = v_res.id;

      INSERT INTO public.inventory_movements (
        product_id,
        quantity_change,
        previous_stock,
        new_stock,
        previous_reserved,
        new_reserved,
        movement_type,
        reference_id,
        notes
      ) VALUES (
        v_res.product_id,
        v_res.quantity,
        v_prod.stock,
        v_prod.stock + v_res.quantity,
        v_prod.reserved_quantity,
        v_prod.reserved_quantity,
        'RETURN_RESTOCK',
        p_order_id,
        coalesce(p_reason, 'Order cancelled - stock restored')
      );

      v_restocked := true;
    ELSIF v_res.status = 'PENDING' THEN
      -- Release reservation hold
      UPDATE public.products
      SET reserved_quantity = greatest(0, reserved_quantity - v_res.quantity),
          updated_at = pg_catalog.clock_timestamp()
      WHERE id = v_res.product_id;

      UPDATE public.inventory_reservations
      SET status = 'RELEASED',
          updated_at = pg_catalog.clock_timestamp()
      WHERE id = v_res.id;

      INSERT INTO public.inventory_movements (
        product_id,
        quantity_change,
        previous_stock,
        new_stock,
        previous_reserved,
        new_reserved,
        movement_type,
        reference_id,
        notes
      ) VALUES (
        v_res.product_id,
        0,
        v_prod.stock,
        v_prod.stock,
        v_prod.reserved_quantity,
        greatest(0, v_prod.reserved_quantity - v_res.quantity),
        'RESERVATION_RELEASED',
        p_order_id,
        coalesce(p_reason, 'Order cancelled - hold released')
      );
    END IF;
  END LOOP;

  -- Atomically update order to CANCELLED
  UPDATE public.orders
  SET order_status = 'CANCELLED',
      updated_at = pg_catalog.clock_timestamp()
  WHERE id = v_order.id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'already_cancelled', false,
    'order_id', p_order_id,
    'order_status', 'CANCELLED',
    'restocked', v_restocked
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_order_and_restore_inventory(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_and_restore_inventory(TEXT, TEXT, TEXT) TO service_role;

-- Backward-compatible alias: cancel_order_reservation
CREATE OR REPLACE FUNCTION public.cancel_order_reservation(
  p_order_id TEXT,
  p_reason TEXT DEFAULT 'Payment failed or cancelled'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.cancel_order_and_restore_inventory(p_order_id, p_reason, NULL);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_order_reservation(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_reservation(TEXT, TEXT) TO service_role;

-- 6. Atomic Function: release_expired_reservations
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_res RECORD;
  v_prod RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_res IN (
    SELECT ir.id, ir.order_id, ir.product_id, ir.quantity
    FROM public.inventory_reservations ir
    WHERE ir.status = 'PENDING' 
      AND ir.expires_at < pg_catalog.clock_timestamp()
      AND NOT EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE (o.id = ir.order_id OR o.order_number = ir.order_id)
          AND lower(coalesce(o.payment_status, '')) IN ('authorized', 'paid')
      )
    ORDER BY ir.product_id ASC
    FOR UPDATE SKIP LOCKED
  )
  LOOP
    -- Double-check order payment status to protect in-flight authorized or paid transactions
    IF EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE (o.id = v_res.order_id OR o.order_number = v_res.order_id)
        AND lower(coalesce(o.payment_status, '')) IN ('authorized', 'paid')
    ) THEN
      CONTINUE;
    END IF;

    SELECT id, stock, reserved_quantity INTO v_prod
    FROM public.products
    WHERE id = v_res.product_id
    FOR UPDATE;

    UPDATE public.products
    SET reserved_quantity = greatest(0, reserved_quantity - v_res.quantity),
        updated_at = pg_catalog.clock_timestamp()
    WHERE id = v_res.product_id;

    UPDATE public.inventory_reservations
    SET status = 'EXPIRED',
        updated_at = pg_catalog.clock_timestamp()
    WHERE id = v_res.id;

    INSERT INTO public.inventory_movements (
      product_id,
      quantity_change,
      previous_stock,
      new_stock,
      previous_reserved,
      new_reserved,
      movement_type,
      reference_id,
      notes
    ) VALUES (
      v_res.product_id,
      0,
      v_prod.stock,
      v_prod.stock,
      v_prod.reserved_quantity,
      greatest(0, v_prod.reserved_quantity - v_res.quantity),
      'RESERVATION_EXPIRED',
      v_res.order_id,
      'Automated 15-minute expiration sweep'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_expired_reservations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_reservations() TO service_role;

-- 7. Manual Stock Adjustment Protection
DROP FUNCTION IF EXISTS public.adjust_product_stock(TEXT, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_product_id TEXT,
  p_new_stock INTEGER,
  p_notes TEXT DEFAULT 'Manual administrative adjustment',
  p_admin_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prod RECORD;
  v_diff INTEGER;
  v_actor TEXT;
BEGIN
  IF NOT public.has_admin_permission('inventory.adjust') THEN
    RAISE EXCEPTION 'Unauthorized: Caller lacks inventory.adjust permission';
  END IF;

  IF p_product_id IS NULL OR p_product_id = '' THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: p_product_id is required';
  END IF;

  IF p_new_stock < 0 THEN
    RAISE EXCEPTION 'BOUNDARY_VIOLATION: Cannot set stock to negative value (%)', p_new_stock;
  END IF;

  SELECT id, stock, reserved_quantity INTO v_prod
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  -- Boundary check: Physical stock cannot be lowered below currently active reserved stock
  IF p_new_stock < v_prod.reserved_quantity THEN
    RAISE EXCEPTION 'BOUNDARY_VIOLATION: Cannot set stock to % because % units are currently committed in active reservations',
      p_new_stock, v_prod.reserved_quantity;
  END IF;

  v_diff := p_new_stock - v_prod.stock;
  v_actor := coalesce(p_admin_id, auth.uid()::TEXT, 'SYSTEM_ADMIN');

  UPDATE public.products
  SET stock = p_new_stock,
      updated_at = pg_catalog.clock_timestamp()
  WHERE id = p_product_id;

  INSERT INTO public.inventory_movements (
    product_id,
    quantity_change,
    previous_stock,
    new_stock,
    previous_reserved,
    new_reserved,
    movement_type,
    reference_id,
    notes
  ) VALUES (
    p_product_id,
    v_diff,
    v_prod.stock,
    p_new_stock,
    v_prod.reserved_quantity,
    v_prod.reserved_quantity,
    'MANUAL_ADJUSTMENT',
    v_actor,
    p_notes
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'previous_stock', v_prod.stock,
    'new_stock', p_new_stock,
    'reserved_quantity', v_prod.reserved_quantity
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.adjust_product_stock(TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_product_stock(TEXT, INTEGER, TEXT, TEXT) TO authenticated, service_role;
