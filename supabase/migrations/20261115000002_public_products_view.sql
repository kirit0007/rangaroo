-- ============================================================================
-- MIGRATION: 20261115000002_public_products_view.sql
-- DESCRIPTION: Public Products View, Column-Level Confidentiality Protection,
--              Dedicated products_view_owner Role with Restrictive RLS
-- SAFETY: Non-destructive, preserves existing data, hides cost_price & private metadata
-- ============================================================================

-- 1. Ensure public.products exists and has appropriate columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    CREATE TABLE public.products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      short_description TEXT,
      price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
      compare_at_price NUMERIC(10,2) CHECK (compare_at_price >= price),
      cost_price NUMERIC(10,2) CHECK (cost_price >= 0), -- CONFIDENTIAL
      supplier_sku TEXT, -- CONFIDENTIAL
      internal_notes TEXT, -- CONFIDENTIAL
      figure_count INTEGER NOT NULL DEFAULT 1,
      paint_type TEXT NOT NULL DEFAULT 'Acrylic Washable',
      category_id TEXT,
      collection_id TEXT,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      is_new_launch BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      images TEXT[] NOT NULL DEFAULT '{}',
      kit_contents TEXT[] NOT NULL DEFAULT '{}',
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0 AND reserved_quantity <= stock),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  ELSE
    -- Add columns if missing in existing table without altering existing data
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2);
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_sku TEXT;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS internal_notes TEXT;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Dedicated Unprivileged View Owner Role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'products_view_owner') THEN
    CREATE ROLE products_view_owner WITH NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

-- Revoke role membership from anon and authenticated
REVOKE products_view_owner FROM anon, authenticated;

-- Grant schema usage to view owner
GRANT USAGE ON SCHEMA public TO products_view_owner;

-- 3. Base Table Privilege Revocation
-- Revoke all table-level privileges on public.products from PUBLIC, anon, authenticated, and view owner
REVOKE ALL ON TABLE public.products FROM PUBLIC, anon, authenticated, products_view_owner;

-- Grant minimal column-level SELECT on public.products to products_view_owner
-- Strictly omits confidential fields: cost_price, supplier_sku, internal_notes
GRANT SELECT (
  id,
  name,
  slug,
  description,
  short_description,
  price,
  compare_at_price,
  figure_count,
  paint_type,
  category_id,
  collection_id,
  is_featured,
  is_new_launch,
  images,
  kit_contents,
  stock,
  reserved_quantity,
  is_active,
  created_at
) ON TABLE public.products TO products_view_owner;

-- Grant all permissions on public.products to service_role
GRANT ALL ON TABLE public.products TO service_role;

-- 4. Restrictive RLS Policy for products_view_owner
DROP POLICY IF EXISTS "products_view_owner_select_active" ON public.products;
CREATE POLICY "products_view_owner_select_active"
ON public.products
FOR SELECT
TO products_view_owner
USING (is_active = true);

-- Authenticated admins can view and manage the underlying products table
DROP POLICY IF EXISTS "Admins can view raw products table" ON public.products;
CREATE POLICY "Admins can view raw products table"
ON public.products
FOR SELECT
TO authenticated
USING (public.has_admin_permission('products.read'));

DROP POLICY IF EXISTS "Admins can mutate products table" ON public.products;
CREATE POLICY "Admins can mutate products table"
ON public.products
FOR ALL
TO authenticated
USING (public.has_admin_permission('products.manage'))
WITH CHECK (public.has_admin_permission('products.manage'));

-- 5. Create Public Products View with Explicit Column Projection and Security Barrier
-- Owned by products_view_owner (NOLOGIN, NOBYPASSRLS, non-superuser)
-- Excludes cost_price, supplier_sku, internal_notes, and reserved_quantity
CREATE OR REPLACE VIEW public.public_products
WITH (security_barrier = true)
AS
SELECT
  id,
  name,
  slug,
  description,
  short_description,
  price,
  compare_at_price,
  figure_count,
  paint_type,
  category_id,
  collection_id,
  is_featured,
  is_new_launch,
  images,
  kit_contents,
  -- Available stock visible to customer is physical stock minus active reservations
  GREATEST(0, stock - reserved_quantity) AS stock,
  created_at
FROM public.products
WHERE is_active = true;

-- Assign ownership of the sanitized view to dedicated view owner role (NOT superuser)
ALTER VIEW public.public_products OWNER TO products_view_owner;

-- Grant storefront access to the sanitized view
REVOKE ALL ON public.public_products FROM PUBLIC;
GRANT SELECT ON public.public_products TO anon, authenticated, service_role;
