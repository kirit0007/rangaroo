# RANGAROO — PRODUCTION IMPLEMENTATION ROADMAP & EXECUTION PLAYBOOK

**Project:** Rangaroo Store (`rangaroo.store`)  
**Workspace Path:** `C:\Users\Appu\.gemini\antigravity\scratch\rangaroo-store`  
**Execution Strategy:** Non-destructive, phased wave deployment with automated verification gates  
**Document Location:** `docs/RANGAROO_IMPLEMENTATION_ROADMAP.md`

---

## Roadmap Overview

The transformation of Rangaroo is structured into 6 sequential, verification-gated implementation waves. Each wave has strict entry criteria, atomic deliverables, and automated test gates. No phase modifies production database records destructively.

```
┌─────────────────────────────────────────────────────────────┐
│ Wave 1: Database Foundation & Non-Destructive Migrations   │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Wave 2: Security & Authentication Hardening                │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Wave 3: Commerce Engine & Razorpay Lifecycle               │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Wave 4: Enterprise Admin Panel (/admin — 15 Modules)        │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Wave 5: Storefront UI/UX, Design Tokens & Guest Checkout    │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Wave 6: Automated E2E Testing, Audits & Launch Sign-Off    │
└─────────────────────────────────────────────────────────────┘
```

---

## Wave 1: Database Foundation & Non-Destructive Migrations

### Objectives
Apply non-destructive database schema expansions, atomic PostgreSQL concurrency functions, and Row Level Security policies.

### Versioned Migration Scripts Prepared in `supabase/migrations/`:
1. `20261115000001_core_admin_rbac.sql`: `admin_users` table, immutable `admin_audit_logs`, non-recursive `get_current_admin_user()` and `has_admin_permission()` functions.
2. `20261115000002_public_products_view.sql`: Column-level confidentiality protection; `public_products` sanitized view.
3. `20261115000003_inventory_reservations.sql`: Aggregated duplicate items, deterministic locking, 15-minute expiration sweep, manual adjustment boundary checks.
4. `20261115000004_coupon_reservations.sql`: Atomic coupon holds, global and per-user limits, release on failure.
5. `20261115000005_razorpay_webhooks_and_guest_tracking.sql`: `razorpay_webhook_events` deduplication table, 256-bit guest tracking token hashes, distributed rate limits.

### Preflight Verification Gate
- Test SQL migration execution in staging environment.
- Verify `is_admin_user()` returns false for unauthorized users.
- Verify trigger blocks `UPDATE` and `DELETE` on `admin_audit_logs`.

---

## Wave 2: Security & Authentication Hardening

### Objectives
Eliminate all privilege escalation vectors and align Next.js routing with secure cookie policies.

### Deliverables:
1. **Admin RBAC Enforcement (`lib/admin/adminAuth.ts` & `lib/auth/serverAuth.ts`):**
   - Eliminate `user_metadata?.role === 'admin'`.
   - Query `public.admin_users WHERE id = auth.uid() AND is_active = true`.
   - Partition `orders.cancel` from `orders.refund`.
   - Mask customer PII for support agent role.
2. **Next.js 16 Proxy Migration (`proxy.ts`):**
   - Implement proxy handler compliant with Next.js 16.
   - Integrate `@supabase/ssr` `createServerClient` to refresh session tokens automatically.
   - Strictly preserve client-accessible cookies; never set `HttpOnly` on Supabase browser-managed session cookies.
   - Apply security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.
3. **Distributed Rate Limiting:**
   - Enforce persistent IP rate limiting on sensitive checkout and guest tracking endpoints.

### Verification Gate
- Execute `npx.cmd playwright test tests/unit/rbac-roles.spec.ts` (16 passed).
- `npm.cmd run typecheck` passes with 0 errors.

---

## Wave 3: Commerce Engine & Razorpay Lifecycle

### Objectives
Build the dual-channel idempotent payment settlement engine and server-side coupon validation.

### Deliverables:
1. **Server-Side Authoritative Checkout (`app/api/checkout/route.ts`):**
   - Zod request schema validation.
   - Authoritative price lookup against catalog.
   - Atomic coupon hold reservation via `reserve_coupon_usage()`.
   - Atomic inventory reservation via `reserve_order_inventory()` before Razorpay order creation.
2. **Dedicated Webhook Handler (`app/api/razorpay/webhook/route.ts`):**
   - Raw binary request body reading (`request.arrayBuffer()`).
   - Constant-time HMAC-SHA256 signature verification.
   - Webhook event deduplication via `razorpay_webhook_events`.
   - Late `payment.failed` guard.
3. **Payment Reconciliation Worker:**
   - Resolves discrepancies for captured Razorpay orders where local persistence was interrupted.
4. **Secure Guest Tracking (`/api/orders/track`):**
   - Generates 256-bit token with SHA-256 hash at rest.
   - Anti-enumeration timing-safe responses.

### Verification Gate
- Execute `npx.cmd playwright test tests/unit/inventory-concurrency.spec.ts` (14 passed).
- Execute `npx.cmd playwright test tests/unit/coupon-concurrency.spec.ts` (10 passed).
- Execute `npx.cmd playwright test tests/unit/razorpay-webhook.spec.ts` (10 passed).
- Execute `npx.cmd playwright test tests/unit/guest-order-security.spec.ts` (14 passed).

---

## Wave 4: Enterprise Admin Panel (`/admin`)

### Objectives
Construct all 15 operational business modules with TanStack Table, TanStack Query, and Recharts.

### Deliverables:
1. **Admin Shell & Navigation (`components/admin/`):**
   - `AdminSidebar.tsx`: Grouped navigation categories, role badges, mobile responsive drawer.
   - `AdminHeader.tsx`: Breadcrumbs, search trigger, notification badge, profile dropdown.
   - `AdminCommandMenu.tsx`: Keyboard accessible (`Cmd+K` / `Ctrl+K`) palette for instant navigation.
2. **15 Distinct Management Modules:**
   - `/admin` (Overview Dashboard): Gross/Net KPIs, Recharts revenue curve, low stock alerts.
   - `/admin/products`: TanStack Table catalog, variant pricing, kit contents editor, image manager.
   - `/admin/collections`: Category hierarchy, merchandising sort order.
   - `/admin/inventory`: Stock movement ledger, manual adjustments with audit reason codes.
   - `/admin/orders`: Decoupled payment/fulfillment status, courier assigning (Delhivery, BlueDart), packing slips.
   - `/admin/customers`: Customer CRM, LTV calculation, registered vs guest tag.
   - `/admin/coupons`: Coupon creator with minimum spend, max discount caps, usage limits.
   - `/admin/campaigns`: Scheduled promotional campaigns and banners.
   - `/admin/reviews`: Moderation queue, verified buyer badge, one-click approve/reject.
   - `/admin/analytics`: Product velocity, geographic breakdown, CSV export.
   - `/admin/cms`: Announcement bar, hero banner CTA, seasonal banners.
   - `/admin/shipping`: Pincode serviceability matrix, delivery rules, free shipping threshold (₹499).
   - `/admin/staff`: Staff directory, RBAC role assignment, active/deactivated toggles.
   - `/admin/audit-logs`: Immutable operational log viewer with sanitized change diffs.
   - `/admin/settings`: Store identity, GSTIN, integration status monitoring.

### Verification Gate
- All 15 routes render and pass `npm.cmd run build`.
- Verify role restrictions: `STORE_ADMIN` cannot access `/admin/staff` or `/admin/settings`.

---

## Wave 5: Storefront UI/UX, Design Tokens & Guest Checkout

### Objectives
Refine customer shopping experience with warm DTC craft aesthetic, full accessibility, and zero checkout friction.

### Deliverables:
1. **Design System & Palette Alignment:**
   - Warm Linen (`#FFFDF9`), Terracotta (`#FF5722`), Honey Amber (`#FFA000`), Tactile Sandstone (`#EFE8DE`).
   - Eliminate generic AI blur blobs and emojis in favor of crisp SVG craft iconography.
2. **Frictionless Guest Checkout:**
   - Remove forced login modals on "Buy Now" and cart checkout.
   - Clean guest checkout flow collecting name, email, phone, and shipping address.
   - Real-time free shipping threshold progress bar (`"Add ₹X more for FREE shipping"`).
3. **Accessibility & Responsive Polish (WCAG 2.2 AA):**
   - High contrast ratios (4.5:1 minimum on text).
   - Minimum 44x44px touch targets on mobile steppers and buttons.
   - Keyboard accessible modals and cart drawer with focus trap and `Escape` key dismissal.

### Verification Gate
- Execute `npx.cmd playwright test tests/e2e/shopping-journey.spec.ts` (6 passed).
- Lighthouse Accessibility score = 100.

---

## Wave 6: Automated E2E Testing, Audits & Launch Sign-Off

### Objectives
Execute end-to-end regression suites and final production verification.

### Deliverables:
1. **Full Playwright Regression Suite:**
   - Full customer shopping flow from PDP to guest checkout.
   - Admin RBAC access denial checks.
   - Concurrency stress tests.
2. **Performance Optimization:**
   - Image optimization and Core Web Vitals (LCP < 2.0s, CLS < 0.05).
3. **Production Launch Checklist:**
   - Confirm all environment variables are populated.
   - Verify zero secrets in client bundles.
   - Deliver final sign-off documentation.

---

## Safe Rollback & Recovery Procedures

1. **Database Rollbacks:**
   - Never use `DROP TABLE` in rollback scripts.
   - Rollback scripts drop only newly added views or trigger functions (`DROP VIEW IF EXISTS public.public_products; DROP FUNCTION IF EXISTS public.reserve_order_inventory;`).
   - All tables preserve existing customer order data without truncation.
2. **Code Rollbacks:**
   - All changes committed atomically with descriptive conventional commit messages.
   - Branch can be reverted via `git revert` without impacting historical commits.
