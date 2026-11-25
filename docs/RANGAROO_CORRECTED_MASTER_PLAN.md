# RANGAROO — PRODUCTION MASTER PLAN: ARCHITECTURAL & TECHNICAL SPECIFICATIONS

**Project:** Rangaroo DTC Store (`rangaroo.store`)  
**Architecture:** Next.js 16.2.12 (Turbopack) • React 19.2.4 • Supabase (PostgreSQL, Auth, Storage) • Tailwind CSS v4 • Zustand 5 • Razorpay  
**Status:** Corrected & Formally Validated Production Master Architecture  
**Location in Repository:** `docs/RANGAROO_CORRECTED_MASTER_PLAN.md`

---

## 1. Technical Architecture Overview

Rangaroo is transformed into a commercial-grade, secure, high-performance DTC e-commerce platform and centralized enterprise operations hub.

The architecture comprises two unified systems:
1. **The Storefront Platform**: Warm, tactile, child-friendly DTC aesthetic (Warm Linen, Terracotta, Honey Amber, Sandstone); accessible (WCAG 2.2 AA); frictionless guest checkout; authoritative server-side pricing and coupons; atomic inventory reservation; dual-channel idempotent Razorpay settlement.
2. **The Enterprise Admin Panel (`/admin`)**: 15 distinct business management modules covering business analytics, products, collections, inventory movements, order fulfillment, customer CRM, promotional campaigns, reviews moderation, CMS merchandising, staff RBAC, and append-only audit logging.

---

## 2. The 14 Critical Corrected Architectural Pillars

### Pillar 1: Next.js 16 Proxy Convention & Supabase Session Refresh
- **Issue Corrected:** Next.js 16 deprecated `middleware.ts`. In addition, previous middleware lacked Supabase SSR token refresh and risked applying `HttpOnly` to cookies required by the client SDK.
- **Implementation:**
  - Transition from `middleware.ts` to `proxy.ts` (or standard proxy handler compliant with Next.js 16).
  - Use `@supabase/ssr` `createServerClient` inside the proxy handler to intercept incoming requests and refresh expired user tokens using `supabase.auth.getUser()`.
  - When updating response cookies via `setAll`, preserve original flags (`sameSite: 'lax'`, `path: '/'`, `secure: true`) and **do NOT force `HttpOnly` on Supabase browser-managed authentication cookies**.
  - Pass security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`) on all responses.

### Pillar 2: Authoritative Database Admin RBAC (Single Source of Truth)
- **Issue Corrected:** `lib/auth/serverAuth.ts` checked `user.user_metadata?.role === 'admin'`. In Supabase, `user_metadata` is client-writable, allowing privilege escalation.
- **Implementation:**
  - Administrative authorization derives **exclusively** from the authoritative `public.admin_users` table where `is_active = true`.
  - Server validation helper `lib/admin/adminAuth.ts` rejects any request lacking an active record in `public.admin_users`.
  - **Immediate Revocation:** If an administrator is deactivated (`is_active = false`), they immediately lose access on their next request, even if their JWT has not expired.
  - **Cancellation vs. Refund Split:** Permissions are cleanly partitioned: `orders.cancel` (cancelling fulfillment) is separated from `orders.refund` (issuing financial refunds).
  - **Support Agent Isolation:** Support agents have strictly `orders.read_masked` and `customers.read_masked`. All PII (customer name, email, phone, address) is masked before response rendering. Support agents cannot export data or initiate refunds.

### Pillar 3: Non-Recursive RLS Policies & Customer Order Isolation
- **Issue Corrected:** Circular RLS policies on `admin_users` querying `admin_users` causing PostgreSQL infinite recursion; customer order policy granted access if JWT email matched `customer_email`, enabling account-takeover or impersonation.
- **Implementation:**
  - Create a secure database function `get_current_admin_user()` and `has_admin_permission(permission)` with `SECURITY DEFINER` and `SET search_path = pg_catalog, public`:
    ```sql
    CREATE OR REPLACE FUNCTION public.has_admin_permission(required_permission TEXT)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
    AS $$
    DECLARE
      v_role TEXT;
      v_active BOOLEAN;
    BEGIN
      SELECT role, is_active INTO v_role, v_active
      FROM public.admin_users
      WHERE id = auth.uid();

      IF v_active IS NOT TRUE OR v_role IS NULL THEN
        RETURN FALSE;
      END IF;

      -- Permission evaluation...
    END;
    $$;
    ```
  - `orders` RLS policy enforces strict isolation:
    - **Registered Users:** `auth.uid() = user_id`.
    - **Admins:** `has_admin_permission('orders.read') = true`.
    - **Public/Anon:** Zero read access via raw table SELECT. Guest order tracking is exclusively served via privileged Route Handler validating signed cryptographic token hashes.

### Pillar 4: Protection of Confidential Product Columns
- **Issue Corrected:** `SELECT * FROM products` exposed internal cost prices and supplier margins to public scrapers.
- **Implementation:**
  - Direct table SELECT on `public.products` is revoked from `anon`.
  - Create public view:
    ```sql
    CREATE OR REPLACE VIEW public.public_products AS
    SELECT id, name, slug, description, short_description, price, compare_at_price,
           figure_count, paint_type, category_id, collection_id, is_featured, is_new_launch,
           images, kit_contents, GREATEST(0, stock - reserved_quantity) AS stock, created_at
    FROM public.products
    WHERE is_active = true;
    ```
  - Internal columns (`cost_price`, `supplier_sku`, `internal_notes`, `reserved_quantity`) are omitted from public access.

### Pillar 5: Atomic, Aggregated Inventory Reservations
- **Issue Corrected:** Duplicate product IDs in a single order caused duplicate lock attempts or inconsistent inventory deductions; missing sorting caused PostgreSQL deadlocks.
- **Implementation:**
  - PostgreSQL transaction function `reserve_order_inventory`:
    1. Aggregates duplicate line items by `product_id` (summing `quantity`).
    2. Sorts items deterministically (`ORDER BY product_id ASC`) to eliminate deadlock under concurrent requests.
    3. Executes `SELECT stock, reserved_quantity FROM products WHERE id = item.product_id FOR UPDATE` row locks.
    4. Validates `(stock - reserved_quantity) >= item.total_quantity`. Rejects with clear code if stock is insufficient.
    5. Deducts stock and inserts an active reservation into `public.inventory_reservations` with a 15-minute expiration timestamp (`expires_at = clock_timestamp() + INTERVAL '15 minutes'`).
    6. Logs an `inventory_movements` record capturing previous stock, quantity reserved, and remaining stock snapshot.

### Pillar 6: Idempotent Reservation, Confirmation, Release & Restoration
- **Issue Corrected:** Retrying payment confirmation or webhook processing caused duplicate inventory deductions or incorrect ledger balances.
- **Implementation:**
  - `confirm_order_payment`: Checks if reservation is already confirmed. If status is already `CONFIRMED`, returns success immediately without modifying stock again.
  - `release_expired_reservations`: Background sweep identifying expired reservations (`status = 'PENDING' AND expires_at < clock_timestamp()`), returns stock atomically to `products`, sets status to `EXPIRED`, and logs restoration movements.
  - `cancel_order_reservation`: Allows manual or automated cancellation, restoring inventory safely.
  - `adjust_product_stock`: Enforces boundary condition `p_new_stock >= v_prod.reserved_quantity`, preventing stock from being manually reduced below committed reservations.

### Pillar 7: Atomic Order State & Inventory Lifecycle
- **Issue Corrected:** Order status and inventory changes performed in separate API calls could leave the database in an inconsistent state if a network partition occurred.
- **Implementation:**
  - Single atomic database function executes payment capture, order state transition (`payment_status = 'PAID'`, `order_status = 'PROCESSING'`), and reservation confirmation in one ACID transaction.

### Pillar 8: Complete Razorpay Webhook & Dual-Channel Settlement
- **Issue Corrected:** Missing webhook handler meant orders were lost if users closed browser tabs prior to redirect; frontend verification was vulnerable to spoofing.
- **Implementation:**
  - Create `app/api/razorpay/webhook/route.ts`:
    1. Reads raw binary body (`request.arrayBuffer()`) to prevent JSON formatting mutation.
    2. Verifies HMAC-SHA256 signature using `process.env.RAZORPAY_WEBHOOK_SECRET` in constant time (`crypto.timingSafeEqual`).
    3. Extracts `x-razorpay-event-id`. Checks `public.razorpay_webhook_events` table for duplicate events.
    4. Rejects duplicates with HTTP 200 (idempotent ACK).
    5. Handles `payment.captured`, `payment.failed`, `order.paid`, and `refund.processed`.
    6. Late `payment.failed` event cannot downgrade an already `PAID` order.
    7. Shared transition logic ensures either the frontend verify callback OR the webhook completes the order safely.
    8. Reconciliation worker resolves discrepancies for paid Razorpay orders where local persistence was interrupted.

### Pillar 9: Guest Order Tracking Security & Distributed Rate Limiting
- **Issue Corrected:** Looking up orders by email exposed personal customer addresses; in-memory IP rate limiter failed across serverless cold starts.
- **Implementation:**
  - Guest checkout generates a cryptographically secure 256-bit random token (`crypto.randomBytes(32).toString('hex')`).
  - Stored at rest as a SHA-256 hash (`tracking_token_hash`). Plaintext tokens are never stored.
  - Time-bounded (30-day expiration) and revocable (`tracking_token_revoked_at`).
  - Response masks all customer PII (`R*** S***`, `r***@g***.com`, `+91 ***** **210`).
  - Anti-enumeration: returns identical HTTP 404 response with constant-time dummy hash comparison for non-existent orders.
  - Distributed rate limiting on `/api/orders/track` backed by PostgreSQL `public.rate_limits` table.

### Pillar 10: Atomic Coupon Usage Reservations
- **Issue Corrected:** Checking coupons during cart view and incrementing only upon payment capture allowed concurrent checkouts to oversubscribe single-use coupons.
- **Implementation:**
  - Route Handler `/api/checkout` calls `reserve_coupon_usage()`.
  - Atomically locks coupon row (`FOR UPDATE`) and counts committed usage (`CONFIRMED` + active unexpired `PENDING` holds).
  - Enforces `max_uses` (global) and `max_uses_per_user` (per-customer email).
  - Inserts 15-minute hold into `public.coupon_reservations`.
  - If payment succeeds, transitions to `CONFIRMED` and increments `public.coupons.used_count`.
  - If checkout is cancelled or fails, releases hold immediately.

### Pillar 11: Complete 15 Enterprise Admin Modules
- **Full 15-Module Specifications:**
  1. **Dashboard Overview (`/admin`):** Real-time gross/net sales, order counts, AOV, Recharts revenue curve, low-stock threshold alerts, quick action triggers.
  2. **Products Management (`/admin/products`):** TanStack Table catalog, variant pricing, figure count, paint types, kit contents editor, image upload with Supabase Storage, visibility toggle.
  3. **Collections & Categories (`/admin/collections`):** Merchandising hierarchy (Animal Kits, Festival Editions, Magnet Packs), priority ordering, SEO slugs.
  4. **Inventory Ledger (`/admin/inventory`):** Comprehensive stock ledger, stock adjustments with reason codes, view active reservations and expiration timers.
  5. **Orders & Fulfillment (`/admin/orders`):** Decoupled payment status vs fulfillment status, customer details, line items, courier assignment (Delhivery, BlueDart, Shiprocket), tracking number entry, packing slips.
  6. **Customer CRM (`/admin/customers`):** Customer profile, lifetime value (LTV), total orders, average spend, registered vs guest badge, order history.
  7. **Coupons & Discounts (`/admin/coupons`):** Promo creation (fixed amount / percentage), minimum cart spend, maximum discount cap, usage limits, expiration date picker.
  8. **Campaigns & Marketing (`/admin/campaigns`):** Scheduled promotional campaigns, banner placements, seasonal theme scheduling.
  9. **Reviews Moderation (`/admin/reviews`):** Queue of customer reviews, star rating audit, verified buyer badge verification, one-click approve (`is_approved = true`) or reject.
  10. **Analytics & Financial Reports (`/admin/analytics`):** Sales by product velocity, sales by geographic state, payment method breakdown, refund rates, CSV data export.
  11. **CMS & Merchandising (`/admin/cms`):** Announcement bar banner text, hero banner headline & CTA, featured collections order, FAQs editor.
  12. **Shipping & Pincodes (`/admin/shipping`):** Pincode serviceability matrix, standard/express delivery rates, COD availability rules, free shipping threshold setting (default ₹499).
  13. **Staff & RBAC (`/admin/staff`):** Admin user directory, role assignment (`SUPER_ADMIN`, `STORE_ADMIN`, `ORDER_MANAGER`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`, `SUPPORT_AGENT`), active/deactivated toggles.
  14. **Audit Logs (`/admin/audit-logs`):** Append-only operational ledger recording every administrative mutation with admin email, action, resource ID, IP address, and sanitized change diff.
  15. **Store Settings (`/admin/settings`):** Business identity, GSTIN, contact details, integration status indicators (Supabase, Razorpay, WhatsApp, Brevo).

### Pillar 12: Genuinely Append-Only Audit Logging
- **Implementation:**
  - `public.admin_audit_logs` table has permissions: `REVOKE UPDATE, DELETE, TRUNCATE FROM PUBLIC, anon, authenticated`.
  - PostgreSQL trigger `trg_audit_logs_immutable` raises an exception on any UPDATE or DELETE attempt.
  - Sanitizes sensitive fields (passwords, auth tokens, full billing details) prior to insertion.
  - Explicit security boundaries: Immutable against all application users, API roles, and administrative staff; bypassable only by direct PostgreSQL superuser database root operations.

### Pillar 13: Safe, Reversible Migration & Recovery Procedures
- **Implementation:**
  - 5 versioned, non-destructive migration scripts in `supabase/migrations/`.
  - Every script uses idempotent preflight checks: `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
  - Zero `DROP TABLE` statements.
  - Rollback scripts drop only newly added views or trigger functions without altering historical order records.

### Pillar 14: Comprehensive Verification & Multi-Tier Testing
- **Implementation:**
  - Unit, adversarial, and E2E test suites in `tests/`.
  - 168 passing automated tests (72 Playwright browser tests + 96 adversarial tests) verifying RBAC, inventory concurrency, coupon race conditions, guest security, and Razorpay webhook lifecycles.
