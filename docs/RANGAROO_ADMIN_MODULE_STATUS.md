# RANGAROO — ADMIN PANEL MODULE STATUS MATRIX

**Document:** `docs/RANGAROO_ADMIN_MODULE_STATUS.md`  
**Target:** `C:\Users\Appu\.gemini\antigravity\scratch\rangaroo-store`  
**Auditor:** Admin Panel Auditor (`@auditor`)  
**Audience:** `@apibuilder`, `@uibuilder`, `@coordinator`  
**Date:** November 19, 2026  
**Status:** Baseline Status Before Wave 4 Execution  

---

## 1. 15-Module Classification Summary

Every module is classified into one of four strict states:
1. **Complete and tested** (0)
2. **Implemented but needs testing** (0)
3. **Partially implemented** (8)
4. **Missing** (7)

| # | Module Name | Route | Current State | Frontend Component Path | Backend API Route | Required Database Tables |
| :---: | :--- | :--- | :---: | :--- | :--- | :--- |
| **1** | **Dashboard** | `/admin` | **Partially implemented** | `app/admin/page.tsx` | `app/api/admin/dashboard` *(Missing)* | `orders`, `products`, `inventory_reservations` |
| **2** | **Products** | `/admin/products` | **Partially implemented** | `app/admin/products/page.tsx` | `app/api/admin/products` *(Missing)* | `products`, `admin_audit_logs` |
| **3** | **Collections** | `/admin/collections` | **Missing** | `app/admin/collections/page.tsx` *(Missing)* | `app/api/admin/collections` *(Missing)* | `collections`, `categories`, `admin_audit_logs` |
| **4** | **Inventory** | `/admin/inventory` | **Missing** | `app/admin/inventory/page.tsx` *(Missing)* | `app/api/admin/inventory` *(Missing)* | `products`, `inventory_reservations`, `inventory_movements`, `admin_audit_logs` |
| **5** | **Orders** | `/admin/orders` | **Partially implemented** | `app/admin/orders/page.tsx` | `app/api/admin/orders/route.ts` *(Incomplete)* | `orders`, `inventory_reservations`, `admin_audit_logs` |
| **6** | **Customers** | `/admin/customers` | **Partially implemented** | `app/admin/customers/page.tsx` | `app/api/admin/customers` *(Missing)* | `orders`, `auth.users`, `admin_audit_logs` |
| **7** | **Coupons** | `/admin/coupons` | **Partially implemented** | `app/admin/coupons/page.tsx` | `app/api/admin/coupons` *(Missing)* | `coupons`, `coupon_reservations`, `admin_audit_logs` |
| **8** | **Campaigns** | `/admin/campaigns` | **Missing** | `app/admin/campaigns/page.tsx` *(Missing)* | `app/api/admin/campaigns` *(Missing)* | `campaigns`, `admin_audit_logs` |
| **9** | **Reviews** | `/admin/reviews` | **Partially implemented** | `app/admin/reviews/page.tsx` | `app/api/admin/reviews` *(Missing)* | `reviews`, `products`, `admin_audit_logs` |
| **10** | **Analytics** | `/admin/analytics` | **Missing** | `app/admin/analytics/page.tsx` *(Missing)* | `app/api/admin/analytics` *(Missing)* | `orders`, `products` |
| **11** | **CMS** | `/admin/cms` | **Partially implemented** | `app/admin/cms/page.tsx` | `app/api/admin/cms` *(Missing)* | `site_settings`, `admin_audit_logs` |
| **12** | **Shipping** | `/admin/shipping` | **Missing** | `app/admin/shipping/page.tsx` *(Missing)* | `app/api/admin/shipping` *(Missing)* | `shipping_rules`, `pincodes`, `site_settings` |
| **13** | **Staff & RBAC** | `/admin/staff` | **Missing** | `app/admin/staff/page.tsx` *(Missing)* | `app/api/admin/staff` *(Missing)* | `admin_users`, `auth.users`, `admin_audit_logs` |
| **14** | **Audit Logs** | `/admin/audit-logs` | **Missing** | `app/admin/audit-logs/page.tsx` *(Missing)* | `app/api/admin/audit-logs` *(Missing)* | `admin_audit_logs` |
| **15** | **Settings** | `/admin/settings` | **Partially implemented** | `app/admin/settings/page.tsx` | `app/api/admin/settings` *(Missing)* | `site_settings`, `admin_audit_logs` |

---

## 2. Granular Module Breakdown

### Module 1: Dashboard Overview (`/admin`)
- **Status:** **Partially implemented**
- **Existing Files:** `app/admin/page.tsx`
- **Missing Files:** `app/api/admin/dashboard/route.ts`
- **Gaps to Address:**
  - In-memory calculation from `useAdminStore` instead of server-side metrics.
  - Missing Average Order Value (AOV) KPI card.
  - Missing Gross vs Net sales calculation (Gross - Refunds - Discounts).
  - Missing period selector (Today, Last 7 Days, Last 30 Days, Month-to-date, Custom).
  - Missing quick action shortcut triggers.
- **RBAC:**
  - Viewable by all active admin roles.
  - Metrics scoped according to role permissions (e.g. `SUPPORT_AGENT` does not see gross profit).

---

### Module 2: Products Catalog (`/admin/products`)
- **Status:** **Partially implemented**
- **Existing Files:** `app/admin/products/page.tsx`
- **Missing Files:**
  - `app/api/admin/products/route.ts`
  - `app/api/admin/products/[id]/route.ts`
- **Gaps to Address:**
  - Must replace raw table with TanStack Table (`@tanstack/react-table`).
  - Add variant pricing management.
  - Add confidential column editor: `cost_price`, `supplier_sku`, `internal_notes` (from `public.products` view protection).
  - Add figure count, paint types, and kit contents structured editor.
  - Replace unauthenticated `POST /api/products` call with authenticated `adminApiClient`.
- **RBAC:**
  - Full Access: `SUPER_ADMIN`, `STORE_ADMIN`, `PRODUCT_MANAGER` (`products.manage`).
  - Read-Only: `CONTENT_MANAGER`, `SUPPORT_AGENT` (`products.read`).
  - Denied: `ORDER_MANAGER` (cannot edit products).

---

### Module 3: Collections & Categories (`/admin/collections`)
- **Status:** **Missing**
- **Existing Files:** None.
- **Missing Files:**
  - `app/admin/collections/page.tsx`
  - `app/api/admin/collections/route.ts`
  - `app/api/admin/collections/[id]/route.ts`
  - `components/admin/CollectionModal.tsx`
- **Gaps to Address:**
  - Construct category and collection hierarchy view.
  - Drag-and-drop or rank ordering for merchandising priority.
  - SEO slug, banner image, and visibility controls.
  - Map products to collections.
- **RBAC:**
  - Full Access: `SUPER_ADMIN`, `STORE_ADMIN`, `PRODUCT_MANAGER` (`collections.manage`).
  - Read-Only: `CONTENT_MANAGER`, `SUPPORT_AGENT`.
  - Denied: `ORDER_MANAGER`.

---

### Module 4: Inventory Ledger (`/admin/inventory`)
- **Status:** **Missing**
- **Existing Files:**
  - Database schema and RPCs exist in `supabase/migrations/20261115000003_inventory_reservations.sql`.
- **Missing Files:**
  - `app/admin/inventory/page.tsx`
  - `app/api/admin/inventory/route.ts`
  - `app/api/admin/inventory/adjust/route.ts`
  - `app/api/admin/inventory/movements/route.ts`
  - `app/api/admin/inventory/sweep/route.ts`
  - `components/admin/StockAdjustmentModal.tsx`
- **Gaps to Address:**
  - Build stock ledger view showing physical stock, reserved quantity, and available units.
  - Build Stock Adjustment dialog enforcing audit reason codes (`MANUAL_ADJUSTMENT`, `RESTOCK`, `DAMAGED_WRITE_OFF`, `RETURN_RESTOCK`) and validating boundary `p_new_stock >= reserved_quantity`.
  - Display active reservations table with countdown timers.
  - Expiration sweep trigger calling `release_expired_reservations`.
  - Display historical inventory movements ledger from `public.inventory_movements`.
- **RBAC:**
  - Full Access: `SUPER_ADMIN`, `STORE_ADMIN`, `PRODUCT_MANAGER` (`inventory.adjust`).
  - Read-Only: `ORDER_MANAGER` (`inventory.read`).
  - Denied: `CONTENT_MANAGER`, `SUPPORT_AGENT`.

---

### Module 5: Orders & Fulfillment (`/admin/orders`)
- **Status:** **Partially implemented**
- **Existing Files:**
  - `app/admin/orders/page.tsx`
  - `app/api/admin/orders/route.ts`
- **Missing Files:**
  - `app/api/admin/orders/[id]/refund/route.ts`
  - `app/api/admin/orders/[id]/packing-slip/route.ts`
  - `components/admin/PackingSlipModal.tsx`
  - `components/admin/RefundOrderModal.tsx`
- **Gaps to Address:**
  - Decouple payment status (`PENDING`, `PAID`, `FAILED`) from fulfillment status (`PROCESSING`, `DISPATCHED`, `DELIVERED`, `CANCELLED`).
  - Implement customer PII masking for `SUPPORT_AGENT` (`orders.read_masked`).
  - Add refund processing modal and route handler (`orders.refund`).
  - Add printable packing slip layout.
  - Replace custom table with TanStack Table (status filters, search, pagination).
- **RBAC:**
  - Full Access: `SUPER_ADMIN`, `STORE_ADMIN`, `ORDER_MANAGER` (`orders.fulfill`, `orders.cancel`, `orders.refund`).
  - Masked Read-Only: `SUPPORT_AGENT` (`orders.read_masked` - cannot fulfill, cancel, or refund).
  - Denied: `PRODUCT_MANAGER`, `CONTENT_MANAGER`.

---

### Module 6: Customer CRM (`/admin/customers`)
- **Status:** **Partially implemented**
- **Existing Files:** `app/admin/customers/page.tsx`
- **Missing Files:**
  - `app/api/admin/customers/route.ts`
  - `app/api/admin/customers/[id]/route.ts`
  - `app/api/admin/customers/export/route.ts`
  - `components/admin/CustomerDetailDrawer.tsx`
- **Gaps to Address:**
  - Replace client-side `orders.reduce` with server-side aggregated customer queries.
  - Add customer profile drawer with lifetime order history.
  - Display Registered User vs Guest Checkout badge.
  - Add CSV export functionality (`customers.export`).
  - Apply PII masking for `SUPPORT_AGENT` (`customers.read_masked`).
- **RBAC:**
  - Full Access + Export: `SUPER_ADMIN`, `STORE_ADMIN`.
  - Masked Read-Only: `SUPPORT_AGENT` (No export).
  - Denied: `ORDER_MANAGER`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`.

---

### Module 7: Coupons & Discounts (`/admin/coupons`)
- **Status:** **Partially implemented**
- **Existing Files:**
  - `app/admin/coupons/page.tsx`
  - Database schema exists in `supabase/migrations/20261115000004_coupon_reservations.sql`.
- **Missing Files:**
  - `app/api/admin/coupons/route.ts`
  - `app/api/admin/coupons/[id]/route.ts`
- **Gaps to Address:**
  - Add date range picker for `valid_from` and `valid_until`.
  - Add usage limits: `max_uses` (global) and `max_uses_per_user` (per-customer).
  - Display active reservations from `public.coupon_reservations`.
  - Add active/inactive toggle switch.
  - Connect to authenticated admin API endpoint with audit logging.
- **RBAC:**
  - Full Access: `SUPER_ADMIN`, `STORE_ADMIN` (`coupons.manage`).
  - Denied: `ORDER_MANAGER`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`, `SUPPORT_AGENT`.

---

### Module 8: Campaigns & Marketing (`/admin/campaigns`)
- **Status:** **Missing**
- **Existing Files:** None.
- **Missing Files:**
  - `app/admin/campaigns/page.tsx`
  - `app/api/admin/campaigns/route.ts`
  - `app/api/admin/campaigns/[id]/route.ts`
  - `components/admin/CampaignModal.tsx`
- **Gaps to Address:**
  - Create campaigns management interface with banner scheduling.
  - Date range scheduler for seasonal promotions (Diwali, Holiday, Summer).
  - Link campaigns to coupons or collections.
- **RBAC:**
  - Full Access: `SUPER_ADMIN`, `STORE_ADMIN`, `CONTENT_MANAGER` (`campaigns.manage`).
  - Denied: `ORDER_MANAGER`, `PRODUCT_MANAGER`, `SUPPORT_AGENT`.

---

### Module 9: Reviews Moderation (`/admin/reviews`)
- **Status:** **Partially implemented**
- **Existing Files:** `app/admin/reviews/page.tsx`
- **Missing Files:**
  - `app/api/admin/reviews/route.ts`
  - `app/api/admin/reviews/[id]/route.ts`
- **Gaps to Address:**
  - Add moderation queue (Pending, Approved, Rejected).
  - One-click approve (`is_approved = true`) and reject action.
  - Make delete action persist to database.
  - Filter by star rating, approval status, and verified buyer badge.
- **RBAC:**
  - Full Access / Moderate: `SUPER_ADMIN`, `STORE_ADMIN`, `CONTENT_MANAGER` (`reviews.moderate`).
  - Read-Only: `SUPPORT_AGENT` (`reviews.read`).
  - Denied: `ORDER_MANAGER`, `PRODUCT_MANAGER`.

---

### Module 10: Analytics & Financial Reports (`/admin/analytics`)
- **Status:** **Missing**
- **Existing Files:** None.
- **Missing Files:**
  - `app/admin/analytics/page.tsx`
  - `app/api/admin/analytics/overview/route.ts`
  - `app/api/admin/analytics/products/route.ts`
  - `app/api/admin/analytics/geography/route.ts`
  - `app/api/admin/analytics/export/route.ts`
- **Gaps to Address:**
  - Sales by product velocity charts.
  - Geographic sales map / state breakdown.
  - Payment method breakdown (UPI, Card, Netbanking, COD).
  - Refund and return rate analysis.
  - CSV export for accounting and reconciliation.
- **RBAC:**
  - Full Access: `SUPER_ADMIN`, `STORE_ADMIN`.
  - Denied: `ORDER_MANAGER`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`, `SUPPORT_AGENT`.

---

### Module 11: CMS & Merchandising (`/admin/cms`)
- **Status:** **Partially implemented**
- **Existing Files:** `app/admin/cms/page.tsx`
- **Missing Files:**
  - `app/api/admin/cms/route.ts`
  - `components/admin/FaqEditorModal.tsx`
- **Gaps to Address:**
  - Add FAQs manager (create, edit, reorder, delete FAQs).
  - Add hero CTA button configuration (button label, destination URL).
  - Add featured collection order selector.
  - Seasonal banner image uploader.
- **RBAC:**
  - Full Access: `SUPER_ADMIN`, `STORE_ADMIN`, `CONTENT_MANAGER` (`cms.manage`).
  - Denied: `ORDER_MANAGER`, `PRODUCT_MANAGER`, `SUPPORT_AGENT`.

---

### Module 12: Shipping & Pincodes (`/admin/shipping`)
- **Status:** **Missing**
- **Existing Files:** None.
- **Missing Files:**
  - `app/admin/shipping/page.tsx`
  - `app/api/admin/shipping/route.ts`
  - `app/api/admin/shipping/rates/route.ts`
  - `app/api/admin/shipping/pincodes/route.ts`
  - `components/admin/PincodeUploadModal.tsx`
- **Gaps to Address:**
  - Pincode serviceability matrix lookup and bulk upload.
  - Express and standard delivery fees configuration.
  - Free shipping threshold setting (default ₹499).
  - Cash on Delivery (COD) restriction rules and extra surcharge setting.
  - Courier partner assignment preferences.
- **RBAC:**
  - Full Access: `SUPER_ADMIN`, `STORE_ADMIN`, `ORDER_MANAGER` (`shipping.manage`).
  - Denied: `PRODUCT_MANAGER`, `CONTENT_MANAGER`, `SUPPORT_AGENT`.

---

### Module 13: Staff & Permissions (`/admin/staff`)
- **Status:** **Missing**
- **Existing Files:**
  - Database schema and functions exist in `supabase/migrations/20261115000001_core_admin_rbac.sql`.
- **Missing Files:**
  - `app/admin/staff/page.tsx`
  - `app/api/admin/staff/route.ts`
  - `app/api/admin/staff/[id]/route.ts`
  - `components/admin/StaffModal.tsx`
- **Gaps to Address:**
  - Admin staff directory displaying email, full name, role, and active status.
  - Add / invite staff member dialog.
  - Role assignment across all 6 roles.
  - Instant `is_active` toggle switch for immediate access revocation.
  - Strict access boundary: accessible ONLY to `SUPER_ADMIN`.
- **RBAC:**
  - Full Access: `SUPER_ADMIN` only (`staff.manage`).
  - Denied: `STORE_ADMIN`, `ORDER_MANAGER`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`, `SUPPORT_AGENT`.

---

### Module 14: Audit Logs (`/admin/audit-logs`)
- **Status:** **Missing**
- **Existing Files:**
  - Database table `public.admin_audit_logs`, immutable trigger, and RLS exist in migration `20261115000001`.
- **Missing Files:**
  - `app/admin/audit-logs/page.tsx`
  - `app/api/admin/audit-logs/route.ts`
  - `components/admin/AuditDiffModal.tsx`
- **Gaps to Address:**
  - Read-only audit log viewer.
  - Filters: date range, actor email, action type, resource type.
  - JSON before/after sanitized change diff viewer.
  - Display IP address, user agent, and timestamp.
  - Strictly no edit or delete operations.
- **RBAC:**
  - Full Access: `SUPER_ADMIN`, `STORE_ADMIN` (`audit.read`).
  - Denied: `ORDER_MANAGER`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`, `SUPPORT_AGENT`.

---

### Module 15: Store Settings (`/admin/settings`)
- **Status:** **Partially implemented**
- **Existing Files:** `app/admin/settings/page.tsx`
- **Missing Files:**
  - `app/api/admin/settings/route.ts`
  - `app/api/admin/settings/integrations/route.ts`
  - `components/admin/IntegrationHealthCard.tsx`
- **Gaps to Address:**
  - Add business GSTIN, PAN, and registered legal entity name.
  - Add live integration health indicators:
    - Supabase PostgreSQL latency & status.
    - Razorpay API credentials check.
    - WhatsApp Business API status.
    - Brevo transactional email status.
  - Strict access restriction: ONLY `SUPER_ADMIN` (`settings.manage`).
- **RBAC:**
  - Full Access: `SUPER_ADMIN` only (`settings.manage`).
  - Denied: `STORE_ADMIN`, `ORDER_MANAGER`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`, `SUPPORT_AGENT`.

---

## 3. RBAC Full Matrix (Roles x Permissions x Modules)

```
========================================================================================================================
MODULE                       PERMISSION(S)           SUPER    STORE    ORDER    PRODUCT   CONTENT   SUPPORT
                                                     ADMIN    ADMIN    MGR      MGR       MGR       AGENT
========================================================================================================================
1. Dashboard Overview        dashboard.read          ALLOW    ALLOW    SCOPED   SCOPED    SCOPED    SCOPED
2. Products Catalog          products.read / manage  ALLOW    ALLOW    READ     ALLOW     READ      READ
3. Collections & Categories  collections.manage      ALLOW    ALLOW    DENY     ALLOW     READ      READ
4. Inventory Ledger          inventory.read / adjust ALLOW    ALLOW    READ     ALLOW     DENY      DENY
5. Orders & Fulfillment      orders.fulfill / cancel ALLOW    ALLOW    ALLOW    DENY      DENY      MASKED-READ
                             orders.refund           ALLOW    ALLOW    ALLOW    DENY      DENY      DENY
6. Customer CRM              customers.read / export ALLOW    ALLOW    DENY     DENY      DENY      MASKED-READ
7. Coupons & Discounts       coupons.manage          ALLOW    ALLOW    DENY     DENY      DENY      DENY
8. Campaigns & Marketing     campaigns.manage        ALLOW    ALLOW    DENY     DENY      ALLOW     DENY
9. Reviews Moderation        reviews.moderate        ALLOW    ALLOW    DENY     DENY      ALLOW     READ
10. Analytics & Reports      analytics.read          ALLOW    ALLOW    DENY     DENY      DENY      DENY
11. CMS & Merchandising      cms.manage              ALLOW    ALLOW    DENY     DENY      ALLOW     DENY
12. Shipping & Pincodes      shipping.manage         ALLOW    ALLOW    ALLOW    DENY      DENY      DENY
13. Staff & Permissions      staff.manage            ALLOW    DENY     DENY     DENY      DENY      DENY
14. Audit Logs               audit.read              ALLOW    ALLOW    DENY     DENY      DENY      DENY
15. Store Settings           settings.manage         ALLOW    DENY     DENY     DENY      DENY      DENY
========================================================================================================================
```

---

## 4. Work Routing for Swarm Agents

### For `@apibuilder`:
1. Build all missing route handlers in `app/api/admin/*`.
2. Wrap every admin route handler with `hasAdminPermission(request, requiredPermission)`.
3. Wrap all customer responses in `maskCustomerPII()` when caller role is `SUPPORT_AGENT`.
4. Ensure every admin mutation writes an entry to `public.admin_audit_logs`.
5. Support paginated responses with TanStack Table query parameter conventions (`page`, `pageSize`, `sortBy`, `sortOrder`, `search`).

### For `@uibuilder`:
1. Rebuild `components/admin/AdminSidebar.tsx` with all 15 modules and role-aware visibility.
2. Build `components/admin/AdminHeader.tsx`, `AdminCommandMenu.tsx`, and generic `AdminDataTable.tsx`.
3. Construct the 7 missing module pages (`collections`, `inventory`, `campaigns`, `analytics`, `shipping`, `staff`, `audit-logs`).
4. Upgrade the 8 existing pages with TanStack Table, modal dialogs, and PII masking.
5. Upgrade `app/admin/layout.tsx` to verify authoritative admin status and display active role badge.
