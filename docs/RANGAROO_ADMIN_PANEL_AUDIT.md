# RANGAROO — ENTERPRISE ADMIN PANEL AUDIT REPORT

**Project:** Rangaroo Store (`rangaroo.store`)  
**Workspace Target:** `C:\Users\Appu\.gemini\antigravity\scratch\rangaroo-store`  
**Auditor:** Admin Panel Auditor (`@auditor`)  
**Target Audience:** `@apibuilder`, `@uibuilder`, `@coordinator`  
**Date:** November 19, 2026  
**Document Location:** `docs/RANGAROO_ADMIN_PANEL_AUDIT.md`  

---

## 1. Executive Summary

This comprehensive audit inspects the current state of the Rangaroo Enterprise Admin Panel (`/admin`) against the enterprise architectural requirements defined in `docs/RANGAROO_CORRECTED_MASTER_PLAN.md` and `docs/RANGAROO_IMPLEMENTATION_ROADMAP.md` (Wave 4).

Rangaroo requires 15 distinct operational business management modules supporting 6 authoritative administrative roles (`SUPER_ADMIN`, `STORE_ADMIN`, `ORDER_MANAGER`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`, `SUPPORT_AGENT`).

### Key Findings:
1. **Module Completion Rate:** 
   - **0 / 15** modules are *Complete and tested*.
   - **0 / 15** modules are *Implemented but needs testing*.
   - **8 / 15** modules are *Partially implemented* (`/admin`, `/admin/products`, `/admin/orders`, `/admin/customers`, `/admin/coupons`, `/admin/reviews`, `/admin/cms`, `/admin/settings`).
   - **7 / 15** modules are *Completely missing* (`/admin/collections`, `/admin/inventory`, `/admin/campaigns`, `/admin/analytics`, `/admin/shipping`, `/admin/staff`, `/admin/audit-logs`).
2. **API Layer Discrepancy:**
   - Only a single admin API route exists (`app/api/admin/orders/route.ts`).
   - 14 required admin API endpoints are missing. Existing admin pages improperly rely on public storefront endpoints (`/api/products`, `/api/coupons`, `/api/reviews`, `/api/settings`) or in-memory Zustand stores (`useAdminStore.ts`) without authoritative session bearer headers, leading to HTTP 403 errors in production.
3. **Database Foundation:**
   - Core tables (`admin_users`, `admin_audit_logs`, `products`, `inventory_reservations`, `inventory_movements`, `coupons`, `coupon_reservations`, `razorpay_webhook_events`, `reconciliation_leases`, `rate_limits`) and ACID stored procedures are already implemented in `supabase/migrations/20261115000001` through `20261115000005`.
   - Missing tables: `campaigns`, `categories`, `collections`, `shipping_rules`/`pincodes`, and `reviews.is_approved` column migration.
4. **Security & RBAC Enforcement:**
   - Authoritative database RBAC logic exists in `lib/admin/adminAuth.ts` and PostgreSQL RPC `public.has_admin_permission(TEXT)`, but the frontend shell (`app/admin/layout.tsx` and `components/admin/AdminSidebar.tsx`) uses client-side `user.role === 'admin'` checks instead of authoritative role permissions.
   - Support agent PII masking is not applied in `/admin/orders` or `/admin/customers`.
   - Settings and staff pages lack `SUPER_ADMIN` isolation.

---

## 2. Codebase & Infrastructure Inspection

### 2.1 File Tree Analysis

```
rangaroo-store/
├── app/
│   ├── admin/
│   │   ├── layout.tsx             [INCOMPLETE] Client-side role check; lacks 6 RBAC roles
│   │   ├── page.tsx               [INCOMPLETE] Dashboard: mock state, lacks AOV & API
│   │   ├── cms/page.tsx           [INCOMPLETE] Basic settings form; missing FAQs & collections
│   │   ├── coupons/page.tsx       [INCOMPLETE] Basic form; missing date picker, limits & API
│   │   ├── customers/page.tsx     [INCOMPLETE] In-memory order reduce; missing CRM API
│   │   ├── orders/page.tsx        [INCOMPLETE] Order list; missing decoupled statuses, slips
│   │   ├── products/page.tsx      [INCOMPLETE] Raw table; missing TanStack, variant pricing
│   │   ├── reviews/page.tsx       [INCOMPLETE] Read-only; delete is local state only
│   │   ├── settings/page.tsx      [INCOMPLETE] Basic form; lacks GSTIN & integration checks
│   │   ├── collections/page.tsx   [MISSING]
│   │   ├── inventory/page.tsx     [MISSING]
│   │   ├── campaigns/page.tsx     [MISSING]
│   │   ├── analytics/page.tsx     [MISSING]
│   │   ├── shipping/page.tsx      [MISSING]
│   │   ├── staff/page.tsx         [MISSING]
│   │   └── audit-logs/page.tsx    [MISSING]
│   └── api/
│       ├── admin/
│       │   └── orders/route.ts    [INCOMPLETE] Single admin API; lacks granular permissions
│       ├── products/route.ts      [STOREFRONT] Public API with basic admin POST/DELETE
│       ├── coupons/route.ts       [STOREFRONT] Public API with coupon validation
│       ├── reviews/route.ts       [STOREFRONT] Public API; missing moderation updates
│       ├── settings/route.ts      [STOREFRONT] Public site settings API
│       └── upload/route.ts        [STORAGE] Supabase Storage upload route
├── components/
│   └── admin/
│       ├── AdminSidebar.tsx       [INCOMPLETE] 8 items only; lacks 7 modules & role badges
│       ├── AdminHeader.tsx        [MISSING] Breadcrumbs, search, notification, profile
│       └── AdminCommandMenu.tsx   [MISSING] Quick Cmd+K palette
├── lib/
│   └── admin/
│       └── adminAuth.ts           [COMPLETE] 6 roles, 22 permissions, PII masking, DB lookup
└── supabase/
    └── migrations/                [COMPLETE MIGRATIONS 1–5] DB schema, RLS, functions
```

### 2.2 Shell & Navigation Inspection

#### `app/admin/layout.tsx`
- **Current State:** Inspects `user.role === 'admin'` from client Zustand `useAuthStore`.
- **Vulnerabilities:**
  1. Client metadata can be spoofed; does not validate `is_active` in `public.admin_users`.
  2. Binary check (`admin` vs non-admin) prevents granular access for `ORDER_MANAGER`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`, and `SUPPORT_AGENT`.
  3. Deactivated administrators remain logged in until local token expiration.

#### `components/admin/AdminSidebar.tsx`
- **Current State:** Hardcodes 8 navigation links: Dashboard, Site CMS, Products Catalog, Coupons, Orders, Customers, Reviews, Settings.
- **Defects:**
  1. 7 modules are completely missing from navigation: Collections, Inventory, Campaigns, Analytics, Shipping, Staff, Audit Logs.
  2. Zero role-based link filtering. A `SUPPORT_AGENT` sees links to Settings and Coupons.
  3. No indicator of the current administrator's role or assigned permissions.

---

## 3. Detailed Audit of All 15 Admin Modules

---

### Module 1: Dashboard Overview (`/admin`)
- **Route:** `app/admin/page.tsx`
- **Classification:** **Partially implemented**
- **Existing Implementation:**
  - 4 static KPI cards: Total Products, Total Revenue, Total Orders, Active Coupons.
  - Recharts 7-day revenue LineChart.
  - Low stock alerts (items with `stockQuantity < 5`).
  - Recent 5 orders table.
- **Deficiencies:**
  - All data is calculated in client-side memory from `useAdminStore` (orders and products).
  - No dedicated `/api/admin/dashboard` endpoint.
  - Missing Average Order Value (AOV) metric.
  - Missing Gross vs Net sales breakdown (Gross revenue minus refunds and discounts).
  - Missing date-range selector (Today, 7D, 30D, Custom).
  - Missing quick action shortcuts (Add Product, Create Coupon, Bulk Restock, Export Orders).
- **Required RBAC Permissions:** `dashboard.read` (or role-scoped overview).
- **Target APIs:** `GET /api/admin/dashboard`

---

### Module 2: Products Management (`/admin/products`)
- **Route:** `app/admin/products/page.tsx`
- **Classification:** **Partially implemented**
- **Existing Implementation:**
  - Table of products with category filter and search bar.
  - Create/Edit product modal.
  - Image file upload via `/api/upload`.
  - Delete product action.
- **Deficiencies:**
  - Built with raw HTML table, not TanStack Table (missing multi-column sorting, column visibility, pagination).
  - Syncs via `fetch('/api/products', { method: 'POST', body: ... })` **without Authorization Bearer header**, causing HTTP 403 in production.
  - Does not manage confidential columns: `cost_price`, `supplier_sku`, `internal_notes` (defined in `public.products` migration `20261115000002`).
  - Missing variant pricing, figure count editor, paint types selector, and structured kit contents builder.
  - Missing physical stock vs reserved quantity visibility.
- **Required RBAC Permissions:** `products.read`, `products.manage`
- **Target APIs:**
  - `GET /api/admin/products` (paginated, includes confidential columns)
  - `POST /api/admin/products`
  - `PATCH /api/admin/products/[id]`
  - `DELETE /api/admin/products/[id]`

---

### Module 3: Collections & Categories (`/admin/collections`)
- **Route:** `app/admin/collections/page.tsx`
- **Classification:** **Missing**
- **Existing Implementation:** None. (Categories and collections are hardcoded in `data/products.ts`).
- **Required Implementation:**
  - Category and collection hierarchy management (Animal Kits, Festival Editions, Magnet Packs).
  - Merchandising priority sort order (drag-and-drop or rank input).
  - Banner image upload, SEO slug, description, and storefront visibility toggle.
  - Product-to-collection mapping interface.
- **Required RBAC Permissions:** `collections.manage`
- **Target APIs:**
  - `GET /api/admin/collections`
  - `POST /api/admin/collections`
  - `PATCH /api/admin/collections/[id]`
  - `DELETE /api/admin/collections/[id]`
- **Database Tables:** `public.collections`, `public.categories`

---

### Module 4: Inventory Ledger (`/admin/inventory`)
- **Route:** `app/admin/inventory/page.tsx`
- **Classification:** **Missing**
- **Existing Implementation:**
  - Backend schema exists: `public.inventory_reservations`, `public.inventory_movements`, RPCs `reserve_order_inventory`, `confirm_order_inventory`, `release_expired_reservations`, `cancel_order_reservation`, and `adjust_product_stock` (migration `20261115000003`).
  - Frontend UI and API handlers are completely missing.
- **Required Implementation:**
  - Stock ledger displaying physical stock, active reservations, and net available stock.
  - Stock adjustment modal enforcing reason codes (`MANUAL_ADJUSTMENT`, `RESTOCK`, `DAMAGED_WRITE_OFF`, `RETURN_RESTOCK`) and respecting `new_stock >= reserved_quantity`.
  - Active reservation viewer with live expiration countdown timers.
  - Manual expiration sweep button (invoking `release_expired_reservations` RPC).
  - Paginated audit ledger of all historical inventory movements.
- **Required RBAC Permissions:** `inventory.read`, `inventory.adjust`
- **Target APIs:**
  - `GET /api/admin/inventory`
  - `POST /api/admin/inventory/adjust`
  - `GET /api/admin/inventory/movements`
  - `POST /api/admin/inventory/sweep`

---

### Module 5: Orders & Fulfillment (`/admin/orders`)
- **Route:** `app/admin/orders/page.tsx`
- **Classification:** **Partially implemented**
- **Existing Implementation:**
  - Order list with search and status dropdown.
  - Courier name and AWB tracking input.
  - Order cancellation approval calling `cancel_order_and_restore_inventory` RPC.
  - Backend API: `app/api/admin/orders/route.ts` (GET, POST, PATCH).
- **Deficiencies:**
  - Single combined status dropdown conflates payment status (`PENDING`, `PAID`, `FAILED`) with fulfillment status (`PROCESSING`, `DISPATCHED`, `DELIVERED`, `CANCELLED`).
  - No refund trigger action (partitioned permission `orders.refund`).
  - No printable packing slip / shipping label view.
  - Does not support customer PII masking for `SUPPORT_AGENT` (`orders.read_masked`).
  - Missing pagination and TanStack Table.
  - Missing direct courier integration links (Delhivery, BlueDart, Shiprocket).
- **Required RBAC Permissions:** `orders.read`, `orders.read_masked`, `orders.fulfill`, `orders.cancel`, `orders.refund`
- **Target APIs:**
  - `GET /api/admin/orders` (enhanced with PII masking and pagination)
  - `PATCH /api/admin/orders/[id]/status`
  - `POST /api/admin/orders/[id]/refund`
  - `GET /api/admin/orders/[id]/packing-slip`

---

### Module 6: Customer CRM (`/admin/customers`)
- **Route:** `app/admin/customers/page.tsx`
- **Classification:** **Partially implemented**
- **Existing Implementation:**
  - Aggregates customer profiles in-memory by reducing over `orders` in client state.
  - Calculates total orders, total spent, and last order date.
- **Deficiencies:**
  - No server-side API or database queries; fails on cold start or when orders list is paginated.
  - No distinction between registered Supabase users vs guest checkout orders.
  - Missing customer profile drawer displaying past order history.
  - Missing CSV customer export (`customers.export` permission).
  - Missing PII masking for `SUPPORT_AGENT` (`customers.read_masked`).
- **Required RBAC Permissions:** `customers.read`, `customers.read_masked`, `customers.export`
- **Target APIs:**
  - `GET /api/admin/customers`
  - `GET /api/admin/customers/[id]`
  - `GET /api/admin/customers/export`

---

### Module 7: Coupons & Discounts (`/admin/coupons`)
- **Route:** `app/admin/coupons/page.tsx`
- **Classification:** **Partially implemented**
- **Existing Implementation:**
  - Form to create promo codes (code, discount type, value, min spend, max discount).
  - List of active coupons from `useAdminStore`.
- **Deficiencies:**
  - Lacks date range picker for `valid_from` and `valid_until`.
  - Lacks usage limits (`max_uses` global, `max_uses_per_user` per customer).
  - Lacks visibility into active reservations and redemption counts from `public.coupon_reservations`.
  - Lacks active/inactive toggle switch.
  - Interacts with public `/api/coupons` instead of an authenticated admin endpoint.
- **Required RBAC Permissions:** `coupons.manage`
- **Target APIs:**
  - `GET /api/admin/coupons`
  - `POST /api/admin/coupons`
  - `PATCH /api/admin/coupons/[id]`
  - `DELETE /api/admin/coupons/[id]`

---

### Module 8: Campaigns & Marketing (`/admin/campaigns`)
- **Route:** `app/admin/campaigns/page.tsx`
- **Classification:** **Missing**
- **Existing Implementation:** None.
- **Required Implementation:**
  - Scheduled marketing campaigns (e.g., Diwali, Summer Workshops, Holiday Gift Sets).
  - Campaign start and end timestamps with automated activation.
  - Homepage hero banner override scheduling and announcement bar message scheduling.
  - Association with specific coupon codes or collections.
- **Required RBAC Permissions:** `campaigns.manage`
- **Target APIs:**
  - `GET /api/admin/campaigns`
  - `POST /api/admin/campaigns`
  - `PATCH /api/admin/campaigns/[id]`
  - `DELETE /api/admin/campaigns/[id]`
- **Database Tables:** `public.campaigns`

---

### Module 9: Reviews Moderation (`/admin/reviews`)
- **Route:** `app/admin/reviews/page.tsx`
- **Classification:** **Partially implemented**
- **Existing Implementation:**
  - Fetches reviews from public `/api/reviews`.
  - Displays ratings, verified buyer badges, and comments.
  - Delete button removes review from local component state only (`setReviews`).
- **Deficiencies:**
  - Delete action does not persist to database (no DELETE API call).
  - No approval workflow: reviews lack moderation status (`is_approved: boolean`).
  - No filter by pending moderation vs approved.
  - Missing dedicated admin API with audit logging.
- **Required RBAC Permissions:** `reviews.read`, `reviews.moderate`
- **Target APIs:**
  - `GET /api/admin/reviews` (returns pending and approved reviews)
  - `PATCH /api/admin/reviews/[id]` (approve / reject)
  - `DELETE /api/admin/reviews/[id]`

---

### Module 10: Analytics & Financial Reports (`/admin/analytics`)
- **Route:** `app/admin/analytics/page.tsx`
- **Classification:** **Missing**
- **Existing Implementation:** None.
- **Required Implementation:**
  - Product sales velocity analysis (best sellers, slowest moving).
  - Geographic sales breakdown across Indian states and cities.
  - Payment method distribution (Razorpay UPI, Card, Netbanking, COD).
  - Refund rate and cancellation percentage tracking.
  - CSV report generator for monthly financial reconciliation.
- **Required RBAC Permissions:** `SUPER_ADMIN`, `STORE_ADMIN`
- **Target APIs:**
  - `GET /api/admin/analytics/overview`
  - `GET /api/admin/analytics/products`
  - `GET /api/admin/analytics/geography`
  - `GET /api/admin/analytics/export`

---

### Module 11: CMS & Merchandising (`/admin/cms`)
- **Route:** `app/admin/cms/page.tsx`
- **Classification:** **Partially implemented**
- **Existing Implementation:**
  - Form editing announcement text, hero headline/subtitle, footer taglines, social links.
  - Persists to `public.site_settings` via `/api/settings`.
- **Deficiencies:**
  - Missing FAQs editor (adding, editing, reordering questions and answers).
  - Missing featured collections merchandising order.
  - Missing hero CTA button text and destination URL controls.
  - Missing banner image upload for seasonal themes.
- **Required RBAC Permissions:** `cms.manage`
- **Target APIs:**
  - `GET /api/admin/cms`
  - `PATCH /api/admin/cms`

---

### Module 12: Shipping & Pincodes (`/admin/shipping`)
- **Route:** `app/admin/shipping/page.tsx`
- **Classification:** **Missing**
- **Existing Implementation:**
  - Flat shipping rate (₹50) and free shipping threshold (₹499) stored in `site_settings`.
  - Dedicated shipping management page does not exist.
- **Required Implementation:**
  - Free shipping threshold and standard delivery rate rules.
  - Pincode serviceability matrix (serviceable delivery zones vs blacklisted pincodes).
  - Cash on Delivery (COD) availability rules and extra COD surcharge configuration.
  - Courier partner routing rules (Delhivery, BlueDart, Shiprocket).
- **Required RBAC Permissions:** `shipping.manage`
- **Target APIs:**
  - `GET /api/admin/shipping`
  - `PATCH /api/admin/shipping/rates`
  - `POST /api/admin/shipping/pincodes/check`
  - `POST /api/admin/shipping/pincodes/bulk-upload`
- **Database Tables:** `public.shipping_rules`, `public.pincodes`

---

### Module 13: Staff & Permissions (`/admin/staff`)
- **Route:** `app/admin/staff/page.tsx`
- **Classification:** **Missing**
- **Existing Implementation:**
  - Database table `public.admin_users` and functions `get_current_admin_user()`, `has_admin_permission()` exist in migration `20261115000001`.
  - Route, UI components, and API route handlers are completely missing.
- **Required Implementation:**
  - Staff directory listing all administrative accounts.
  - Role assignment modal supporting all 6 roles (`SUPER_ADMIN`, `STORE_ADMIN`, `ORDER_MANAGER`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`, `SUPPORT_AGENT`).
  - Immediate active/deactivated toggle (`is_active = false`) for instant access revocation.
  - Invite / create new admin user dialog.
  - Strict access boundary: restricted exclusively to `SUPER_ADMIN` (`staff.manage` permission).
- **Required RBAC Permissions:** `staff.manage` (`SUPER_ADMIN` only)
- **Target APIs:**
  - `GET /api/admin/staff`
  - `POST /api/admin/staff`
  - `PATCH /api/admin/staff/[id]`
  - `DELETE /api/admin/staff/[id]`

---

### Module 14: Audit Logs (`/admin/audit-logs`)
- **Route:** `app/admin/audit-logs/page.tsx`
- **Classification:** **Missing**
- **Existing Implementation:**
  - Database table `public.admin_audit_logs`, immutable trigger `trg_audit_logs_immutable`, and RLS policy exist in migration `20261115000001`.
  - Route, UI components, and API route handlers are completely missing.
- **Required Implementation:**
  - Append-only operational audit log viewer.
  - Filter by date range, admin user email, action (`CREATE`, `UPDATE`, `DELETE`, `ADJUST_STOCK`, `REFUND`), and resource type (`orders`, `products`, `coupons`, `staff`, `settings`).
  - Formatted JSON change diff viewer highlighting modified fields.
  - Displays timestamp, actor email, IP address, and user-agent.
  - Enforces zero modification/deletion controls (read-only UI).
- **Required RBAC Permissions:** `audit.read` (`SUPER_ADMIN`, `STORE_ADMIN`)
- **Target APIs:**
  - `GET /api/admin/audit-logs`
  - `GET /api/admin/audit-logs/[id]`

---

### Module 15: Store Settings (`/admin/settings`)
- **Route:** `app/admin/settings/page.tsx`
- **Classification:** **Partially implemented**
- **Existing Implementation:**
  - Form for store name, contact email, contact phone, standard shipping rate, free shipping threshold.
- **Deficiencies:**
  - Missing business legal entity details (GSTIN, PAN, registered company address).
  - Missing live integration status monitor (Supabase DB, Razorpay Gateway, WhatsApp API, Brevo Mailer).
  - Accessible to any admin user; must be strictly restricted to `SUPER_ADMIN` (`settings.manage` permission). `STORE_ADMIN` must receive 403 Forbidden.
- **Required RBAC Permissions:** `settings.manage` (`SUPER_ADMIN` only)
- **Target APIs:**
  - `GET /api/admin/settings`
  - `PATCH /api/admin/settings`
  - `GET /api/admin/settings/integrations`

---

## 4. Comprehensive RBAC Role & Permission Matrix

The 6 administrative roles defined in `lib/admin/adminAuth.ts` and `supabase/migrations/20261115000001_core_admin_rbac.sql` map across the 15 modules as follows:

| Module | SUPER_ADMIN | STORE_ADMIN | ORDER_MANAGER | PRODUCT_MANAGER | CONTENT_MANAGER | SUPPORT_AGENT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Dashboard** | Full | Full | Read (Scoped) | Read (Scoped) | Read (Scoped) | Read (Scoped) |
| **2. Products** | Full | Full | Read-Only | Full | Read-Only | Read-Only |
| **3. Collections** | Full | Full | Denied | Full | Read-Only | Read-Only |
| **4. Inventory** | Full | Full | Read-Only | Full | Denied | Denied |
| **5. Orders** | Full | Full | Full (Fulfill/Cancel/Refund) | Denied | Denied | Read-Only (Masked PII) |
| **6. Customers** | Full | Full + Export | Denied | Denied | Denied | Read-Only (Masked PII, No Export) |
| **7. Coupons** | Full | Full | Denied | Denied | Denied | Denied |
| **8. Campaigns** | Full | Full | Denied | Denied | Full | Denied |
| **9. Reviews** | Full | Full | Denied | Denied | Full (Moderate) | Read-Only |
| **10. Analytics** | Full | Full + Export | Denied | Denied | Denied | Denied |
| **11. CMS** | Full | Full | Denied | Denied | Full | Denied |
| **12. Shipping** | Full | Full | Full | Denied | Denied | Denied |
| **13. Staff** | Full | **DENIED** | **DENIED** | **DENIED** | **DENIED** | **DENIED** |
| **14. Audit Logs** | Full | Full (Read-Only) | **DENIED** | **DENIED** | **DENIED** | **DENIED** |
| **15. Settings** | Full | **DENIED** | **DENIED** | **DENIED** | **DENIED** | **DENIED** |

---

## 5. Architectural Deficiencies & Vulnerability Analysis

### DEF-ADMIN-01: Client-Side Authorization Gate in `AdminLayout`
- **Location:** `app/admin/layout.tsx`
- **Severity:** High
- **Description:** Access to `/admin` routes evaluates `user?.role === 'admin'` from Zustand client store. This allows client manipulation to render admin screens (though server APIs return 401/403).
- **Remediation:** Implement server-side check in `proxy.ts` or an SSR layout component querying `getAuthoritativeAdminUser()`. Validate both authentication and active status (`is_active = true`).

### DEF-ADMIN-02: Missing Authorization Headers on Admin Storefront Calls
- **Location:** `app/admin/products/page.tsx` line 176
- **Severity:** Medium
- **Description:** `handleSaveProduct` triggers `fetch('/api/products', { method: 'POST', body: ... })` without an `Authorization: Bearer <token>` header. In production, this causes HTTP 403 Forbidden because `/api/products` validates `isUserAdmin(request)`.
- **Remediation:** Introduce a centralized `adminApiClient` utility that attaches active session tokens automatically.

### DEF-ADMIN-03: Insecure Support Agent PII Exposure
- **Location:** `app/admin/orders/page.tsx`, `app/admin/customers/page.tsx`
- **Severity:** High
- **Description:** `SUPPORT_AGENT` role is meant to view masked customer names, emails, and phone numbers. Existing pages display raw customer emails, addresses, and phone numbers directly.
- **Remediation:** Backend API must pass records through `maskCustomerPII()` from `lib/admin/adminAuth.ts` whenever the requester has `orders.read_masked` instead of `orders.read`.

### DEF-ADMIN-04: Non-Persistent Review Moderation
- **Location:** `app/admin/reviews/page.tsx`
- **Severity:** Medium
- **Description:** Clicking delete removes the review from React state (`setReviews(prev => prev.filter(...))`) but never issues a network request to delete or reject the record in Supabase.
- **Remediation:** Connect to `PATCH /api/admin/reviews/[id]` (`is_approved: false`) and `DELETE /api/admin/reviews/[id]`.

### DEF-ADMIN-05: Single Conflated Status on Orders
- **Location:** `app/admin/orders/page.tsx`
- **Severity:** Medium
- **Description:** Payment status and fulfillment status are managed in a single dropdown. Marking an order `cancelled` should invoke the atomic inventory restoration RPC, while marking an order `refunded` requires payment gateway settlement.
- **Remediation:** Separate status controls into "Payment Status" and "Fulfillment Status". Add an explicit "Issue Refund" modal requiring reason and confirmation.

---

## 6. Action Plan & Work Division for Swarm Agents

### Work Package A: Backend API Builder (`@apibuilder`)
1. Implement the missing 14 admin API route handlers in `app/api/admin/`:
   - `app/api/admin/dashboard/route.ts`
   - `app/api/admin/products/route.ts` & `[id]/route.ts`
   - `app/api/admin/collections/route.ts` & `[id]/route.ts`
   - `app/api/admin/inventory/route.ts`, `adjust/route.ts`, `movements/route.ts`, `sweep/route.ts`
   - Refactor `app/api/admin/orders/route.ts` with PII masking, refund handler `[id]/refund/route.ts`, packing slip `[id]/packing-slip/route.ts`
   - `app/api/admin/customers/route.ts`, `[id]/route.ts`, `export/route.ts`
   - `app/api/admin/coupons/route.ts` & `[id]/route.ts`
   - `app/api/admin/campaigns/route.ts` & `[id]/route.ts`
   - `app/api/admin/reviews/route.ts` & `[id]/route.ts`
   - `app/api/admin/analytics/overview/route.ts`, `products/route.ts`, `export/route.ts`
   - `app/api/admin/cms/route.ts`
   - `app/api/admin/shipping/route.ts`, `rates/route.ts`, `pincodes/route.ts`
   - `app/api/admin/staff/route.ts` & `[id]/route.ts`
   - `app/api/admin/audit-logs/route.ts`
   - `app/api/admin/settings/route.ts` & `integrations/route.ts`
2. Enforce `hasAdminPermission(request, permission)` and append audit logs via `public.admin_audit_logs` on all mutations.

### Work Package B: Frontend UI Builder (`@uibuilder`)
1. Rebuild `components/admin/AdminSidebar.tsx` with all 15 modules, grouped navigation sections, and role-based filtering.
2. Build `components/admin/AdminHeader.tsx` (breadcrumbs, active admin badge, notification bell, profile trigger) and `AdminCommandMenu.tsx` (Cmd+K quick switcher).
3. Create generic reusable `components/admin/AdminDataTable.tsx` powered by `@tanstack/react-table` (sorting, filtering, pagination, selection).
4. Build the 7 missing module pages:
   - `app/admin/collections/page.tsx`
   - `app/admin/inventory/page.tsx`
   - `app/admin/campaigns/page.tsx`
   - `app/admin/analytics/page.tsx`
   - `app/admin/shipping/page.tsx`
   - `app/admin/staff/page.tsx`
   - `app/admin/audit-logs/page.tsx`
5. Upgrade the 8 existing module pages to use TanStack Table, authentic admin APIs, PII masking, and role gates.
