-- ============================================================================
-- MIGRATION: 20261115000004_coupon_reservations.sql
-- DESCRIPTION: Atomic Coupon Reservation, Global & Per-User Usage Limit Locks,
--              Automatic Hold Expiration and Release, Row-Level Security
-- SAFETY: Fully ACID, prevents coupon oversubscription, non-destructive
-- ============================================================================

-- 1. Ensure public.coupons has required columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
    CREATE TABLE public.coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
      discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
      min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      max_discount NUMERIC(10,2),
      max_uses INTEGER,
      max_uses_per_user INTEGER DEFAULT 1,
      used_count INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
      valid_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  ELSE
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_discount NUMERIC(10,2);
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses INTEGER;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER DEFAULT 1;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ NOT NULL DEFAULT now();
    ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
  END IF;
END $$;

-- Enable RLS and isolate public.coupons base table
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coupons FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.coupons TO service_role;

-- 2. Create public.coupon_reservations table
CREATE TABLE IF NOT EXISTS public.coupon_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  discount_amount NUMERIC(10,2) NOT NULL CHECK (discount_amount >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_res_order 
ON public.coupon_reservations(order_id, status);

CREATE INDEX IF NOT EXISTS idx_coupon_res_email 
ON public.coupon_reservations(coupon_id, customer_email, status);

CREATE INDEX IF NOT EXISTS idx_coupon_res_coupon_id_status 
ON public.coupon_reservations(coupon_id, status);

-- Enable RLS and isolate public.coupon_reservations base table
ALTER TABLE public.coupon_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coupon_reservations FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.coupon_reservations TO service_role;

-- 3. Function: reserve_coupon_usage (Primary 3-arg signature)
-- Derives customer email and subtotal exclusively from persisted public.orders table.
-- Locks coupon row FOR UPDATE, enforces global & per-user limits, and inserts pending reservation.
CREATE OR REPLACE FUNCTION public.reserve_coupon_usage(
  p_code TEXT,
  p_order_id TEXT,
  p_duration_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order RECORD;
  v_coupon RECORD;
  v_committed_total INTEGER;
  v_committed_user INTEGER;
  v_discount NUMERIC(10,2);
  v_expires_at TIMESTAMPTZ;
  v_existing RECORD;
  v_customer_email TEXT;
  v_subtotal NUMERIC(10,2);
BEGIN
  -- Phase 1: Authoritative derivation from persisted orders table
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id OR order_number = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: Order % does not exist in persisted orders', p_order_id;
  END IF;

  v_customer_email := pg_catalog.btrim(coalesce(v_order.customer_email, ''));
  v_subtotal := coalesce(v_order.subtotal, 0);

  IF v_subtotal <= 0 THEN
    RAISE EXCEPTION 'COUPON_INVALID_SUBTOTAL: Order % subtotal must be greater than zero', p_order_id;
  END IF;

  -- Phase 2: Lock the coupon row for atomic evaluation (FOR UPDATE serializes concurrent claimants)
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE pg_catalog.upper(code) = pg_catalog.upper(p_code) AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'COUPON_INVALID: Coupon code % is invalid or inactive', p_code;
  END IF;

  -- Phase 3: Idempotency check: If this order already has an active hold on this coupon, return it
  SELECT id, discount_amount, expires_at INTO v_existing
  FROM public.coupon_reservations
  WHERE order_id = p_order_id 
    AND coupon_id = v_coupon.id 
    AND status = 'PENDING' 
    AND expires_at > pg_catalog.clock_timestamp();

  IF FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'idempotent', true,
      'code', v_coupon.code,
      'discount_amount', v_existing.discount_amount,
      'expires_at', v_existing.expires_at
    );
  END IF;

  -- Phase 4: Check date window
  IF pg_catalog.clock_timestamp() < v_coupon.valid_from THEN
    RAISE EXCEPTION 'COUPON_NOT_YET_ACTIVE: Coupon valid starting %', v_coupon.valid_from;
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND pg_catalog.clock_timestamp() > v_coupon.valid_until THEN
    RAISE EXCEPTION 'COUPON_EXPIRED: Coupon expired on %', v_coupon.valid_until;
  END IF;

  -- Phase 5: Check spend threshold against persisted subtotal
  IF v_subtotal < v_coupon.min_order_amount THEN
    RAISE EXCEPTION 'COUPON_MIN_SPEND_NOT_MET: Minimum order of ₹% required for coupon %',
      v_coupon.min_order_amount, p_code;
  END IF;

  -- Phase 6: Atomic global usage calculation (Confirmed + Unexpired Pending Holds)
  IF v_coupon.max_uses IS NOT NULL THEN
    SELECT pg_catalog.count(*) INTO v_committed_total
    FROM public.coupon_reservations
    WHERE coupon_id = v_coupon.id
      AND (status = 'CONFIRMED' OR (status = 'PENDING' AND expires_at > pg_catalog.clock_timestamp()));

    IF v_committed_total >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'COUPON_EXHAUSTED: Coupon % has reached its maximum usage limit', p_code;
    END IF;
  END IF;

  -- Phase 7: Per-customer usage limit check (enforcing verified customer email)
  IF v_coupon.max_uses_per_user IS NOT NULL THEN
    IF v_customer_email = '' THEN
      RAISE EXCEPTION 'COUPON_VERIFIED_EMAIL_REQUIRED: Verified customer email is required to enforce per-user coupon limits on order %', p_order_id;
    END IF;

    SELECT pg_catalog.count(*) INTO v_committed_user
    FROM public.coupon_reservations
    WHERE coupon_id = v_coupon.id
      AND pg_catalog.lower(customer_email) = pg_catalog.lower(v_customer_email)
      AND (status = 'CONFIRMED' OR (status = 'PENDING' AND expires_at > pg_catalog.clock_timestamp()));

    IF v_committed_user >= v_coupon.max_uses_per_user THEN
      RAISE EXCEPTION 'COUPON_USER_LIMIT_REACHED: You have already used coupon % the maximum allowed times', p_code;
    END IF;
  END IF;

  -- Phase 8: Authoritative discount calculation
  IF v_coupon.discount_type = 'PERCENTAGE' THEN
    v_discount := pg_catalog.round((v_subtotal * (v_coupon.discount_value / 100.0)), 2);
    IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
      v_discount := v_coupon.max_discount;
    END IF;
  ELSE
    v_discount := least(v_subtotal, v_coupon.discount_value);
  END IF;

  v_expires_at := pg_catalog.clock_timestamp() + (p_duration_minutes || ' minutes')::pg_catalog.interval;

  -- Phase 9: Insert reservation
  INSERT INTO public.coupon_reservations (
    coupon_id,
    order_id,
    customer_email,
    discount_amount,
    status,
    expires_at
  ) VALUES (
    v_coupon.id,
    p_order_id,
    pg_catalog.lower(v_customer_email),
    v_discount,
    'PENDING',
    v_expires_at
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'idempotent', false,
    'code', v_coupon.code,
    'discount_amount', v_discount,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_coupon_usage(TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_coupon_usage(TEXT, TEXT, INTEGER) TO service_role;

-- Overload: reserve_coupon_usage (5-argument signature for client and integration test compatibility)
-- Any client-supplied email or subtotal is deliberately ignored in favor of the authoritative persisted order.
CREATE OR REPLACE FUNCTION public.reserve_coupon_usage(
  p_code TEXT,
  p_order_id TEXT,
  p_customer_email TEXT,
  p_cart_subtotal NUMERIC,
  p_duration_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Forward call ignoring caller-tampered p_customer_email and p_cart_subtotal
  RETURN public.reserve_coupon_usage(p_code, p_order_id, p_duration_minutes);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_coupon_usage(TEXT, TEXT, TEXT, NUMERIC, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_coupon_usage(TEXT, TEXT, TEXT, NUMERIC, INTEGER) TO service_role;

-- 4. Function: confirm_coupon_usage
-- Locks pending reservation, transitions status to CONFIRMED, and increments coupon used_count exactly once.
CREATE OR REPLACE FUNCTION public.confirm_coupon_usage(p_order_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_res RECORD;
BEGIN
  SELECT * INTO v_res
  FROM public.coupon_reservations
  WHERE order_id = p_order_id AND status = 'PENDING'
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.coupon_reservations
    SET status = 'CONFIRMED',
        updated_at = pg_catalog.clock_timestamp()
    WHERE id = v_res.id;

    UPDATE public.coupons
    SET used_count = used_count + 1,
        updated_at = pg_catalog.clock_timestamp()
    WHERE id = v_res.coupon_id;

    RETURN pg_catalog.jsonb_build_object('success', true, 'confirmed', true);
  END IF;

  RETURN pg_catalog.jsonb_build_object('success', true, 'confirmed', false, 'message', 'No pending coupon reservation found');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_coupon_usage(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_coupon_usage(TEXT) TO service_role;

-- 5. Function: release_coupon_usage
CREATE OR REPLACE FUNCTION public.release_coupon_usage(p_order_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.coupon_reservations
  SET status = 'RELEASED',
      updated_at = pg_catalog.clock_timestamp()
  WHERE order_id = p_order_id AND status = 'PENDING';

  RETURN pg_catalog.jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_coupon_usage(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_coupon_usage(TEXT) TO service_role;
