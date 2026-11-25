-- ============================================================================
-- MIGRATION: 20261115000005_razorpay_webhooks_and_guest_tracking.sql
-- DESCRIPTION: Razorpay Webhook Event Deduplication, Guest Order Tracking Token Hashes,
--              Persistent Rate Limiting, Customer Data Masking, Row-Level Security
-- SAFETY: Fully non-destructive, protects PII, prevents webhook replays
-- ============================================================================

-- 1. Create public.razorpay_webhook_events table
CREATE TABLE IF NOT EXISTS public.razorpay_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'RETRYABLE_FAILED', 'DEAD_LETTER')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);

DO $$
BEGIN
  ALTER TABLE public.razorpay_webhook_events 
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'RETRYABLE_FAILED', 'DEAD_LETTER'));
  ALTER TABLE public.razorpay_webhook_events 
    ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE public.razorpay_webhook_events 
    ADD COLUMN IF NOT EXISTS last_error TEXT;
  ALTER TABLE public.razorpay_webhook_events 
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;
  ALTER TABLE public.razorpay_webhook_events 
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_rzp_events_event_id 
ON public.razorpay_webhook_events(event_id);

CREATE INDEX IF NOT EXISTS idx_razorpay_webhook_events_retry 
ON public.razorpay_webhook_events (status, next_retry_at);

-- Enable RLS and isolate public.razorpay_webhook_events base table
ALTER TABLE public.razorpay_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.razorpay_webhook_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.razorpay_webhook_events TO service_role;

-- 1b. Durable Distributed Reconciliation Leases Table with Fencing Tokens
CREATE TABLE IF NOT EXISTS public.reconciliation_leases (
  lease_name TEXT PRIMARY KEY,
  lease_owner TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  lease_expires_at TIMESTAMPTZ NOT NULL,
  fence_token BIGINT NOT NULL DEFAULT 1
);

-- Enable RLS and isolate public.reconciliation_leases
ALTER TABLE public.reconciliation_leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.reconciliation_leases FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.reconciliation_leases TO service_role;

-- Atomic Lease Acquisition with Fencing Token & Recovery Support
CREATE OR REPLACE FUNCTION public.acquire_reconciliation_lease(
  p_lease_name TEXT,
  p_owner TEXT,
  p_ttl_seconds INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec RECORD;
  v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
  v_expires TIMESTAMPTZ;
  v_fence BIGINT;
BEGIN
  IF p_lease_name IS NULL OR p_lease_name = '' THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: p_lease_name is required';
  END IF;
  IF p_owner IS NULL OR p_owner = '' THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: p_owner is required';
  END IF;
  IF p_ttl_seconds IS NULL OR p_ttl_seconds <= 0 THEN
    p_ttl_seconds := 60;
  END IF;

  v_expires := v_now + (p_ttl_seconds || ' seconds')::pg_catalog.interval;

  -- Transaction-level advisory lock on lease name hash to serialize concurrent acquire calls
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('reconciliation_lease:' || p_lease_name));

  SELECT * INTO v_rec
  FROM public.reconciliation_leases
  WHERE lease_name = p_lease_name
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Fresh lease acquisition
    INSERT INTO public.reconciliation_leases (
      lease_name,
      lease_owner,
      acquired_at,
      heartbeat_at,
      lease_expires_at,
      fence_token
    ) VALUES (
      p_lease_name,
      p_owner,
      v_now,
      v_now,
      v_expires,
      1
    );

    RETURN pg_catalog.jsonb_build_object(
      'acquired', true,
      'lease_name', p_lease_name,
      'lease_owner', p_owner,
      'fence_token', 1,
      'lease_expires_at', v_expires
    );
  END IF;

  -- Active unexpired lease held by another owner
  IF v_rec.lease_expires_at > v_now AND v_rec.lease_owner <> p_owner THEN
    RETURN pg_catalog.jsonb_build_object(
      'acquired', false,
      'lease_name', p_lease_name,
      'lease_owner', v_rec.lease_owner,
      'fence_token', v_rec.fence_token,
      'lease_expires_at', v_rec.lease_expires_at
    );
  END IF;

  -- Recovery on expiry OR re-acquisition by same owner:
  -- If different owner (takeover after expiration), increment fence_token.
  -- If same owner, maintain existing fence_token.
  IF v_rec.lease_owner <> p_owner THEN
    v_fence := v_rec.fence_token + 1;
  ELSE
    v_fence := v_rec.fence_token;
  END IF;

  UPDATE public.reconciliation_leases
  SET lease_owner = p_owner,
      acquired_at = CASE WHEN v_rec.lease_owner <> p_owner THEN v_now ELSE v_rec.acquired_at END,
      heartbeat_at = v_now,
      lease_expires_at = v_expires,
      fence_token = v_fence
  WHERE lease_name = p_lease_name;

  RETURN pg_catalog.jsonb_build_object(
    'acquired', true,
    'lease_name', p_lease_name,
    'lease_owner', p_owner,
    'fence_token', v_fence,
    'lease_expires_at', v_expires
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.acquire_reconciliation_lease(TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_reconciliation_lease(TEXT, TEXT, INTEGER) TO service_role;

-- Heartbeat function to renew lease TTL while validating fence token
CREATE OR REPLACE FUNCTION public.heartbeat_reconciliation_lease(
  p_lease_name TEXT,
  p_owner TEXT,
  p_fence_token BIGINT,
  p_ttl_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
  v_new_expires TIMESTAMPTZ;
  v_updated INTEGER;
BEGIN
  IF p_ttl_seconds IS NULL OR p_ttl_seconds <= 0 THEN
    p_ttl_seconds := 60;
  END IF;

  v_new_expires := v_now + (p_ttl_seconds || ' seconds')::pg_catalog.interval;

  UPDATE public.reconciliation_leases
  SET heartbeat_at = v_now,
      lease_expires_at = v_new_expires
  WHERE lease_name = p_lease_name
    AND lease_owner = p_owner
    AND fence_token = p_fence_token
    AND lease_expires_at > v_now;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.heartbeat_reconciliation_lease(TEXT, TEXT, BIGINT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.heartbeat_reconciliation_lease(TEXT, TEXT, BIGINT, INTEGER) TO service_role;

-- Release function to immediately expire/relinquish lease ownership
CREATE OR REPLACE FUNCTION public.release_reconciliation_lease(
  p_lease_name TEXT,
  p_owner TEXT,
  p_fence_token BIGINT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.reconciliation_leases
  SET lease_expires_at = pg_catalog.clock_timestamp()
  WHERE lease_name = p_lease_name
    AND lease_owner = p_owner
    AND (p_fence_token IS NULL OR fence_token = p_fence_token);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_reconciliation_lease(TEXT, TEXT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_reconciliation_lease(TEXT, TEXT, BIGINT) TO service_role;

-- Distributed Reconciliation Advisory Lock Helpers (Backward Compatibility)
CREATE OR REPLACE FUNCTION public.try_reconciliation_lock(p_lock_key BIGINT DEFAULT 987654321)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT pg_catalog.pg_try_advisory_lock(p_lock_key);
$$;

CREATE OR REPLACE FUNCTION public.release_reconciliation_lock(p_lock_key BIGINT DEFAULT 987654321)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT pg_catalog.pg_advisory_unlock(p_lock_key);
$$;

REVOKE EXECUTE ON FUNCTION public.try_reconciliation_lock(BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.try_reconciliation_lock(BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.release_reconciliation_lock(BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_reconciliation_lock(BIGINT) TO service_role;

-- 2. Create public.rate_limits table for distributed serverless rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and isolate public.rate_limits base table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;

-- Distributed rate limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec RECORD;
  v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
  v_window INTERVAL := (p_window_seconds || ' seconds')::pg_catalog.interval;
BEGIN
  SELECT count, window_start INTO v_rec
  FROM public.rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (key, count, window_start)
    VALUES (p_key, 1, v_now);
    RETURN TRUE;
  END IF;

  IF (v_now - v_rec.window_start) > v_window THEN
    UPDATE public.rate_limits
    SET count = 1,
        window_start = v_now
    WHERE key = p_key;
    RETURN TRUE;
  ELSE
    IF v_rec.count >= p_limit THEN
      RETURN FALSE; -- Rate limit exceeded
    END IF;

    UPDATE public.rate_limits
    SET count = count + 1
    WHERE key = p_key;
    RETURN TRUE;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- 3. Add Guest Order Token Hash columns to orders table
DO $$
BEGIN
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token_hash TEXT;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token_expires_at TIMESTAMPTZ;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token_revoked_at TIMESTAMPTZ;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_tracking_hash 
ON public.orders(tracking_token_hash) 
WHERE tracking_token_hash IS NOT NULL;

-- 4. Secure Guest Order Tracking Function with Masked PII
CREATE OR REPLACE FUNCTION public.get_guest_order_tracking(
  p_order_number TEXT,
  p_token_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order RECORD;
  v_masked_email TEXT;
  v_masked_phone TEXT;
  v_masked_name TEXT;
  v_items JSONB;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE (order_number = p_order_number OR id::TEXT = p_order_number)
    AND tracking_token_hash = p_token_hash;

  -- Anti-enumeration: Return generic failure if order or token does not match
  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'ORDER_NOT_FOUND',
      'message', 'Order not found or tracking link is invalid'
    );
  END IF;

  -- Expiration check
  IF v_order.tracking_token_expires_at IS NOT NULL AND pg_catalog.clock_timestamp() > v_order.tracking_token_expires_at THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'LINK_EXPIRED',
      'message', 'Tracking link has expired'
    );
  END IF;

  -- Revocation check
  IF v_order.tracking_token_revoked_at IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'LINK_REVOKED',
      'message', 'Tracking link has been revoked'
    );
  END IF;

  -- Customer PII Masking:
  -- Name: "Rahul Sharma" -> "R*** S***"
  v_masked_name := pg_catalog.regexp_replace(v_order.customer_name, '(\w)\w+', '\1***', 'g');

  -- Email: "rahul@gmail.com" -> "r***@g***.com"
  v_masked_email := pg_catalog.regexp_replace(
    v_order.customer_email,
    '^(.)(.*)(@.)(.*)(\..*)$',
    '\1***\3***\5'
  );

  -- Phone: "+919876543210" -> "+91 ***** **210"
  v_masked_phone := pg_catalog.overlay(v_order.customer_phone, '***** **', 4, 7);

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'order_number', v_order.order_number,
    'order_status', v_order.order_status,
    'payment_status', v_order.payment_status,
    'created_at', v_order.created_at,
    'customer_name', v_masked_name,
    'customer_email', v_masked_email,
    'customer_phone', v_masked_phone,
    'shipping_city', v_order.city,
    'shipping_state', v_order.state,
    'shipping_pin_code', v_order.pin_code,
    'subtotal', v_order.subtotal,
    'shipping_fee', v_order.shipping_fee,
    'discount_amount', v_order.discount_amount,
    'total_amount', v_order.total_amount,
    'items', v_order.items
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_guest_order_tracking(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_order_tracking(TEXT, TEXT) TO service_role;
