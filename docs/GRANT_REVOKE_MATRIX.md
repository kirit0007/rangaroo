# RANGAROO Store — Database Security, Permissions & Grant/Revoke Matrix

**Version:** 2.1 (Milestone 1 Hardened & Reconciliation Leases Secured)  
**Authoritative Location:** `docs/GRANT_REVOKE_MATRIX.md`  
**Classification:** Database Architecture & Access Control Contract  
**Target Milestone:** Milestone 1 — Database Permissions, View Security & Safe Search Path (R1)  
**Associated Migrations:**
- `supabase/migrations/20261115000001_core_admin_rbac.sql`
- `supabase/migrations/20261115000002_public_products_view.sql`
- `supabase/migrations/20261115000003_inventory_reservations.sql`
- `supabase/migrations/20261115000004_coupon_reservations.sql`
- `supabase/migrations/20261115000005_razorpay_webhooks_and_guest_tracking.sql`

---

## 1. Executive Summary & Architecture Overview

This document specifies the authoritative access control matrix and database privilege topology for Rangaroo's Supabase PostgreSQL instance.

Prior to this remediation, database tables containing proprietary business data (raw supplier SKUs, cost prices, internal notes), confidential reservation holds, customer coupon claims, and webhook payloads were vulnerable to direct REST enumeration (`/rest/v1/...`) by anonymous and authenticated clients. High-privilege transactional `SECURITY DEFINER` functions defaulted to public execution and vulnerable `search_path` configurations.

### Architectural Principles Implemented:
1. **Dedicated View Owner Role (`products_view_owner`):**
   - Eliminates postgres-superuser view ownership and RLS bypass hazards.
   - Configured with `NOLOGIN`, `NOBYPASSRLS`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`.
   - Role membership explicitly revoked from untrusted API roles: `REVOKE products_view_owner FROM anon, authenticated;` (conforming to PostgreSQL role syntax where `PUBLIC` is an object grant pseudo-role, not a role membership target).
   - Granted schema `USAGE` and minimal column-level `SELECT` on only approved catalog fields.
   - Governed by a restrictive Row Level Security (RLS) policy (`is_active = true`).
   - Owns `public.public_products` with `WITH (security_barrier = true)` to prevent query optimizer leakage.

2. **Base Table Isolation:**
   - Base tables (`products`, `inventory_reservations`, `inventory_movements`, `coupons`, `coupon_reservations`, `rate_limits`, `razorpay_webhook_events`, `reconciliation_leases`) have all direct table privileges revoked from `PUBLIC`, `anon`, and `authenticated`.
   - Direct `SELECT`, `INSERT`, `UPDATE`, `DELETE` calls from untrusted clients return `permission denied` at the PostgreSQL engine level before policy evaluation.

3. **RPC Execution Hardening:**
   - Every `SECURITY DEFINER` function has default execution revoked from `PUBLIC`, `anon`, and `authenticated`.
   - Execution is restricted exclusively to `service_role` (with administrative stock adjustments permitted only to authorized `authenticated` and `service_role` callers).

4. **Empty `search_path` & Full Schema Qualification:**
   - All `SECURITY DEFINER` functions enforce `SET search_path = ''`.
   - All system functions (`pg_catalog.clock_timestamp()`, `pg_catalog.sum()`, etc.), database tables (`public.products`, etc.), and auth functions (`auth.uid()`) are fully schema-qualified, eliminating search path spoofing/shadowing attacks.

5. **Forward Privilege Hardening:**
   - `ALTER DEFAULT PRIVILEGES` executes in migration 1, ensuring future functions in schema `public` do not default to public execution.

---

## 2. PostgreSQL Role Topology

| Role Name | Type | Supabase Purpose | Grants Held | RLS Bypass? |
|---|---|---|---|---|
| `anon` | API Login Role | Unauthenticated storefront visitors | `USAGE ON SCHEMA public`, `SELECT ON public.public_products` | **NO** (`NOBYPASSRLS`) |
| `authenticated` | API Login Role | Registered logged-in customers & admins | `USAGE ON SCHEMA public`, `SELECT ON public.public_products`, `EXECUTE ON public.adjust_product_stock`, `EXECUTE ON public.get_current_admin_user`, `EXECUTE ON public.has_admin_permission` | **NO** (`NOBYPASSRLS`) |
| `products_view_owner` | Internal Service Role | View Owner for `public.public_products` | `USAGE ON SCHEMA public`, column-level `SELECT` on catalog fields of `public.products` | **NO** (`NOBYPASSRLS`) |
| `service_role` | Trusted Backend Role | Next.js Server Components, Route Handlers, Edge Workers | `ALL PRIVILEGES` on public tables & views, `EXECUTE` on all business RPCs | **YES** (Authorized backend only) |
| `postgres` / `supabase_admin` | Database Superuser | Supabase platform & migration executor | Database maintenance & migration runner | **YES** (`SUPERUSER`) |

---

## 3. Base Table Privilege Matrix

| Table Name | RLS Enabled | `anon` Access | `authenticated` Access | `products_view_owner` Access | `service_role` Access | Confidential Columns Protected |
|---|---|---|---|---|---|---|
| `public.admin_users` | **YES** | `NONE` (Revoked) | RLS Policy (`staff.manage` or self) | `NONE` (Revoked) | `ALL` | Admin emails, roles |
| `public.admin_audit_logs` | **YES** (Append-Only) | `NONE` (Revoked) | `INSERT`, `SELECT` (via `audit.read` RLS) | `NONE` (Revoked) | `ALL` | Admin actions, IPs, audit logs |
| `public.products` | **YES** | `NONE` (Revoked) | `NONE` (Direct table revoked) | Column-level `SELECT` (Approved catalog columns only) | `ALL` | `cost_price`, `supplier_sku`, `internal_notes` |
| `public.inventory_reservations` | **YES** | `NONE` (Revoked) | `NONE` (Revoked) | `NONE` (Revoked) | `ALL` | Order IDs, hold quantities, expiry |
| `public.inventory_movements` | **YES** | `NONE` (Revoked) | `NONE` (Revoked) | `NONE` (Revoked) | `ALL` | Stock movements, admin references |
| `public.coupons` | **YES** | `NONE` (Revoked) | `NONE` (Revoked) | `NONE` (Revoked) | `ALL` | Codes, max uses, discount rules |
| `public.coupon_reservations` | **YES** | `NONE` (Revoked) | `NONE` (Revoked) | `NONE` (Revoked) | `ALL` | Customer emails, order IDs, discount amounts |
| `public.rate_limits` | **YES** | `NONE` (Revoked) | `NONE` (Revoked) | `NONE` (Revoked) | `ALL` | Rate limit counters, IP hashes |
| `public.razorpay_webhook_events` | **YES** | `NONE` (Revoked) | `NONE` (Revoked) | `NONE` (Revoked) | `ALL` | Webhook event payloads, payment IDs |
| `public.reconciliation_leases` | **YES** | `NONE` (Revoked) | `NONE` (Revoked) | `NONE` (Revoked) | `ALL` | Worker lease owners, expiration timestamps, fencing tokens |
| `public.orders` | **YES** | `NONE` (Revoked) | RLS Policy (Customer orders) | `NONE` (Revoked) | `ALL` | Tracking tokens, customer PII |

---

## 4. Column-Level Grant & View Architecture on `public.products`

### Column-Level Breakdown on `public.products`

| Column | Data Type | Sensitivity | Granted to `products_view_owner` | Exposed in `public_products` |
|---|---|---|---|---|
| `id` | `TEXT` | Public | **YES** | **YES** |
| `name` | `TEXT` | Public | **YES** | **YES** |
| `slug` | `TEXT` | Public | **YES** | **YES** |
| `description` | `TEXT` | Public | **YES** | **YES** |
| `short_description` | `TEXT` | Public | **YES** | **YES** |
| `price` | `NUMERIC(10,2)` | Public | **YES** | **YES** |
| `compare_at_price` | `NUMERIC(10,2)` | Public | **YES** | **YES** |
| `figure_count` | `INTEGER` | Public | **YES** | **YES** |
| `paint_type` | `TEXT` | Public | **YES** | **YES** |
| `category_id` | `TEXT` | Public | **YES** | **YES** |
| `collection_id` | `TEXT` | Public | **YES** | **YES** |
| `is_featured` | `BOOLEAN` | Public | **YES** | **YES** |
| `is_new_launch` | `BOOLEAN` | Public | **YES** | **YES** |
| `images` | `TEXT[]` | Public | **YES** | **YES** |
| `kit_contents` | `TEXT[]` | Public | **YES** | **YES** |
| `stock` | `INTEGER` | Internal | **YES** (Used in computation) | Computed as `GREATEST(0, stock - reserved_quantity)` |
| `reserved_quantity` | `INTEGER` | Internal | **YES** (Used in computation) | **NO** (Not exposed raw) |
| `is_active` | `BOOLEAN` | Filter | **YES** (Used in filter) | **NO** (Filtered in `WHERE is_active = true`) |
| `created_at` | `TIMESTAMPTZ` | Public | **YES** | **YES** |
| `cost_price` | `NUMERIC(10,2)` | **CONFIDENTIAL** | **NO** (Revoked) | **NO** (Strictly excluded) |
| `supplier_sku` | `TEXT` | **CONFIDENTIAL** | **NO** (Revoked) | **NO** (Strictly excluded) |
| `internal_notes` | `TEXT` | **CONFIDENTIAL** | **NO** (Revoked) | **NO** (Strictly excluded) |

### Sanitized View Definition (`public.public_products`)
```sql
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
  GREATEST(0, stock - reserved_quantity) AS stock,
  created_at
FROM public.products
WHERE is_active = true;

ALTER VIEW public.public_products OWNER TO products_view_owner;
GRANT SELECT ON public.public_products TO anon, authenticated, service_role;
```

---

## 5. Stored Procedures & RPC Execution Privilege Matrix

| Function Signature | Type | `search_path` | `anon` | `authenticated` | `service_role` | Intended Invocation Route |
|---|---|---|---|---|---|---|
| `public.get_current_admin_user()` | `SECURITY DEFINER` | `''` | `REVOKED` | `GRANTED` | `GRANTED` | Admin dashboard auth |
| `public.has_admin_permission(TEXT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `GRANTED` | `GRANTED` | RLS evaluation / Admin middleware |
| `public.prevent_audit_log_modification()` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Trigger-only immutable enforcement |
| `public.reserve_order_inventory(TEXT, JSONB, INTEGER)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | `POST /api/checkout` (Server-side) |
| `public.confirm_order_payment(TEXT, TEXT, TEXT, NUMERIC, TEXT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | `POST /api/razorpay/verify-payment` |
| `public.cancel_order_reservation(TEXT, TEXT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Admin cancellation / Recovery worker |
| `public.cancel_order_and_restore_inventory(TEXT, TEXT, TEXT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Admin cancellation / Recovery worker |
| `public.release_expired_reservations()` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Background cron worker |
| `public.adjust_product_stock(TEXT, INTEGER, TEXT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `GRANTED`* | `GRANTED` | Admin stock adjustment (`inventory.adjust`) |
| `public.reserve_coupon_usage(TEXT, TEXT, TEXT, NUMERIC, INTEGER)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | `POST /api/checkout` (Server-side) |
| `public.confirm_coupon_usage(TEXT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Payment webhook confirmation |
| `public.release_coupon_usage(TEXT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Order cancellation / Abandonment |
| `public.check_rate_limit(TEXT, INTEGER, INTEGER)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Server-side distributed rate limiting |
| `public.get_guest_order_tracking(TEXT, TEXT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | `GET /api/orders/track` (Server-side) |
| `public.acquire_reconciliation_lease(TEXT, TEXT, INTEGER)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Cron / Reconciliation worker lease acquisition |
| `public.heartbeat_reconciliation_lease(TEXT, TEXT, BIGINT, INTEGER)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Reconciliation worker lease heartbeat & fencing validation |
| `public.release_reconciliation_lease(TEXT, TEXT, BIGINT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Reconciliation worker lease release |
| `public.try_reconciliation_lock(BIGINT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Legacy advisory lock fallback |
| `public.release_reconciliation_lock(BIGINT)` | `SECURITY DEFINER` | `''` | `REVOKED` | `REVOKED` | `GRANTED` | Legacy advisory unlock fallback |

*\* Note on `adjust_product_stock`: While execution is granted to role `authenticated`, the function internally enforces `public.has_admin_permission('inventory.adjust')` against `auth.uid()`, strictly preventing regular authenticated customers from invoking it.*

---

## 6. Default Privilege Invariants

In `supabase/migrations/20261115000001_core_admin_rbac.sql`:
```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
```
This guarantees that any function created in future migrations or extensions will **never** automatically grant execution to untrusted API roles.

---

## 7. PostgreSQL Verification Scripts

The following statements can be run directly in PostgreSQL or via integration tests to prove that all acceptance criteria are met:

```sql
-- 1. Verify products base table direct access fails for anon and authenticated:
SET ROLE anon;
SELECT * FROM public.products;
-- Expected Result: ERROR: permission denied for table products

SET ROLE authenticated;
SELECT * FROM public.products;
-- Expected Result: ERROR: permission denied for table products

-- 2. Verify inventory_reservations base table access fails:
SET ROLE authenticated;
SELECT * FROM public.inventory_reservations;
-- Expected Result: ERROR: permission denied for table inventory_reservations

-- 3. Verify public_products view succeeds for anon:
SET ROLE anon;
SELECT id, name, price, stock FROM public.public_products LIMIT 5;
-- Expected Result: Successful row projection with computed stock

-- 4. Verify confidential columns cannot be queried through the view:
SET ROLE anon;
SELECT cost_price FROM public.public_products;
-- Expected Result: ERROR: column "cost_price" does not exist

-- 5. Verify direct RPC execution fails for anon:
SET ROLE anon;
SELECT public.reserve_order_inventory('ORD-TEST', '[]'::jsonb);
-- Expected Result: ERROR: permission denied for function reserve_order_inventory

SET ROLE anon;
SELECT public.reserve_coupon_usage('DISCOUNT10', 'ORD-TEST', 'test@example.com', 1000);
-- Expected Result: ERROR: permission denied for function reserve_coupon_usage

-- 6. Verify reconciliation_leases base table direct access fails for anon & authenticated:
SET ROLE anon;
SELECT * FROM public.reconciliation_leases;
-- Expected Result: ERROR: permission denied for table reconciliation_leases

SET ROLE authenticated;
SELECT * FROM public.reconciliation_leases;
-- Expected Result: ERROR: permission denied for table reconciliation_leases

-- 7. Verify reconciliation lease RPC execution fails for anon:
SET ROLE anon;
SELECT public.acquire_reconciliation_lease('reconciliation_worker', 'untrusted_worker', 60);
-- Expected Result: ERROR: permission denied for function acquire_reconciliation_lease
```
