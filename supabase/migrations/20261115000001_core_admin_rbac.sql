-- ============================================================================
-- MIGRATION: 20261115000001_core_admin_rbac.sql
-- DESCRIPTION: Authoritative Admin RBAC, Admin Users Table, Immutable Audit Logs
-- SAFETY: Non-destructive, idempotent preflight checks, rollback safe
-- ============================================================================

DO $$
BEGIN
  -- Preflight check: Ensure pgcrypto or gen_random_uuid() is available
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pgcrypto') THEN
    RAISE NOTICE 'Extension pgcrypto already available or native gen_random_uuid supported.';
  END IF;
END $$;

-- 1. Create public.admin_users table if not exists
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'SUPER_ADMIN',
    'STORE_ADMIN',
    'ORDER_MANAGER',
    'PRODUCT_MANAGER',
    'CONTENT_MANAGER',
    'SUPPORT_AGENT'
  )),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for instant role & active status lookup on incoming requests
CREATE INDEX IF NOT EXISTS idx_admin_users_active_lookup 
ON public.admin_users(id, is_active);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Non-recursive Admin Authorization Helper Functions
-- SECURITY DEFINER with fixed search_path to prevent search_path injection attacks
-- and avoid recursive policy evaluation
CREATE OR REPLACE FUNCTION public.get_current_admin_user()
RETURNS TABLE (
  admin_id UUID,
  admin_email TEXT,
  admin_role TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.role, u.is_active
  FROM public.admin_users u
  WHERE u.id = auth.uid() AND u.is_active = true;
END;
$$;

-- Revoke public execution of admin lookup helper
REVOKE EXECUTE ON FUNCTION public.get_current_admin_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_admin_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_admin_user() TO service_role;

-- Permission evaluator function
CREATE OR REPLACE FUNCTION public.has_admin_permission(required_permission TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role TEXT;
  v_active BOOLEAN;
BEGIN
  SELECT role, is_active INTO v_role, v_active
  FROM public.admin_users
  WHERE id = auth.uid();

  -- Immediate revocation: If admin is not found or is_active is false, reject immediately
  IF v_active IS NOT TRUE OR v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  CASE v_role
    WHEN 'SUPER_ADMIN' THEN 
      RETURN TRUE;

    WHEN 'STORE_ADMIN' THEN 
      RETURN required_permission NOT IN ('staff.manage', 'settings.manage', 'audit.delete');

    WHEN 'ORDER_MANAGER' THEN
      RETURN required_permission IN (
        'orders.read',
        'orders.fulfill',
        'orders.cancel',
        'orders.refund',
        'shipping.manage',
        'inventory.read'
      );

    WHEN 'PRODUCT_MANAGER' THEN
      RETURN required_permission IN (
        'products.read',
        'products.manage',
        'inventory.read',
        'inventory.adjust',
        'collections.manage'
      );

    WHEN 'CONTENT_MANAGER' THEN
      RETURN required_permission IN (
        'cms.manage',
        'reviews.moderate',
        'campaigns.manage',
        'products.read'
      );

    WHEN 'SUPPORT_AGENT' THEN
      -- Support agents have strictly read-only access with customer PII masking
      RETURN required_permission IN (
        'orders.read_masked',
        'customers.read_masked',
        'reviews.read',
        'products.read'
      );

    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_admin_permission(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(TEXT) TO service_role;

-- 3. Non-Recursive RLS Policies on admin_users
DROP POLICY IF EXISTS "Admins can view admin_users list" ON public.admin_users;
CREATE POLICY "Admins can view admin_users list"
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.has_admin_permission('staff.manage') OR id = auth.uid());

DROP POLICY IF EXISTS "Super Admins can mutate admin_users" ON public.admin_users;
CREATE POLICY "Super Admins can mutate admin_users"
ON public.admin_users
FOR ALL
TO authenticated
USING (public.has_admin_permission('staff.manage'))
WITH CHECK (public.has_admin_permission('staff.manage'));

-- 4. Create public.admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
ON public.admin_audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON public.admin_audit_logs(created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins with audit.read permission can view logs
DROP POLICY IF EXISTS "Admins with audit permission can view logs" ON public.admin_audit_logs;
CREATE POLICY "Admins with audit permission can view logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (public.has_admin_permission('audit.read'));

-- Revoke all table-level UPDATE and DELETE privileges
REVOKE UPDATE, DELETE, TRUNCATE ON public.admin_audit_logs FROM PUBLIC, anon, authenticated;
GRANT INSERT, SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

-- Append-only trigger: Even if RLS is bypassed, PostgreSQL rejects any UPDATE or DELETE
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Security Violation: Audit log entries are strictly append-only and cannot be modified or deleted.';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_audit_log_modification() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_audit_log_modification() TO service_role;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.admin_audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.admin_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- 5. Revoke default public execution privileges on all future functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
