import { test, expect, Page } from '@playwright/test';

/**
 * Helper to initialize active admin session in localStorage prior to navigation.
 */
async function setAdminSession(page: Page, role: string = 'SUPER_ADMIN') {
  await page.context().addCookies([
    {
      name: 'rangaroo_admin_role',
      value: role,
      domain: 'localhost',
      path: '/',
    },
  ]);
  await page.evaluate((roleName) => {
    document.cookie = `rangaroo_admin_role=${roleName}; path=/; SameSite=Lax`;
    window.localStorage.setItem(
      'rangaroo-admin-session',
      JSON.stringify({
        state: {
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'admin@rangaroo.store',
            fullName: 'Rangaroo Lead Admin',
            role: roleName,
            isActive: true,
          },
          activeRoleOverride: roleName === 'SUPER_ADMIN' ? null : roleName,
        },
        version: 0,
      })
    );
  }, role).catch(() => {});
  await page.addInitScript((roleName) => {
    document.cookie = `rangaroo_admin_role=${roleName}; path=/; SameSite=Lax`;
    window.localStorage.setItem(
      'rangaroo-admin-session',
      JSON.stringify({
        state: {
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'admin@rangaroo.store',
            fullName: 'Rangaroo Lead Admin',
            role: roleName,
            isActive: true,
          },
          activeRoleOverride: roleName === 'SUPER_ADMIN' ? null : roleName,
        },
        version: 0,
      })
    );
  }, role);
}

test.describe('Rangaroo Enterprise Admin Modules E2E Test Suite', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ isMobile }, testInfo) => {
    if (isMobile && !testInfo.title.includes('15. Mobile admin navigation')) {
      test.skip(true, 'Full desktop enterprise admin suite runs on desktop viewport; mobile navigation is tested in test 15.');
    }
  });

  // 1. Admin Login & Logout Session Lifecycle
  test('01. Admin login and logout session lifecycle', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin');

    // Verify initial authenticated dashboard layout
    await expect(page.locator('h1:has-text("Store Performance Overview")')).toBeVisible();
    await expect(page.locator('text=SUPER_ADMIN').first()).toBeVisible();

    // Test session logout via sidebar lock button
    const logoutBtn = page.locator('aside button[title="Lock & Sign Out"]').first();
    await logoutBtn.click();

    // Verify return to unauthenticated access wall
    await expect(page.locator('text=Rangaroo Admin Portal')).toBeVisible();
    await expect(page.locator('text=Access to this portal requires an authenticated administrative account')).toBeVisible();

    const devLoginBtn = page.locator('button:has-text("Enter Dev/Test Session (Super Admin)")');
    await expect(devLoginBtn).toBeVisible();

    // Re-authenticate using the UI button
    await devLoginBtn.click();
    await expect(page.locator('h1:has-text("Store Performance Overview")')).toBeVisible();
    await expect(page.locator('text=SUPER_ADMIN').first()).toBeVisible();
  });

  // 2. Dashboard Loads Real Metrics
  test('02. Dashboard loads real metrics (revenue, orders, charts, low stock)', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin');

    // Verify KPI metric cards
    await expect(page.locator('h1:has-text("Store Performance Overview")')).toBeVisible();
    await expect(page.locator('text=Gross Revenue')).toBeVisible();
    await expect(page.locator('text=Net Revenue')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Avg Order Value').or(page.locator('text=Average Order Value'))).toBeVisible();

    // Verify Sales Trends chart container
    await expect(page.locator('h2:has-text("Revenue & Sales Trajectory")')).toBeVisible();
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible();

    // Verify Low Stock Alerts & Best Sellers tables
    await expect(page.locator('h2:has-text("Low Stock Watchlist")')).toBeVisible();
    await expect(page.locator('h2:has-text("Top Sellers")')).toBeVisible();

    // Verify date range toggle interaction
    const btn30d = page.locator('button:has-text("Last 30 Days")');
    await btn30d.click();
    await expect(btn30d).toHaveClass(/bg-\[#C85A32\]/);
  });

  // 3. Product Creation and Editing
  test('03. Product creation and editing', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/products');

    await expect(page.locator('h1:has-text("Products Catalog")')).toBeVisible();
    await expect(page.locator('text=Mini Dinosaur Duo Paint Kit').first()).toBeVisible();

    // Test product search
    const searchInput = page.locator('input[placeholder*="Search products"]');
    await searchInput.fill('Dinosaur');
    await expect(page.locator('text=Mini Dinosaur Duo Paint Kit').first()).toBeVisible();
    await searchInput.clear();

    // Test Add New Product
    await page.locator('button:has-text("Add New Product")').click();
    const modal = page.locator('div.fixed.inset-0.z-50');
    await expect(modal.locator('text=Paint Kit Product')).toBeVisible();

    // Fill general product details
    const uniqueTitle = `Galaxy Star Cruiser Kit ${Date.now().toString().slice(-4)}`;
    await modal.locator('input[placeholder*="T-Rex Dinosaur DIY Paint Kit"]').fill(uniqueTitle);
    await modal.locator('input[type="number"]').first().fill('299');

    // Switch to Inventory tab
    await modal.locator('button:has-text("Inventory & Details")').click();
    await modal.locator('input[type="number"]').first().fill('45');

    // Save product
    await modal.locator('button:has-text("Create Product")').click();

    // Verify product is listed in catalog table
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();

    // Test Edit Product
    const createdRow = page.locator(`tr:has-text("${uniqueTitle}")`);
    await createdRow.locator('button[title="Edit Product"]').click();

    const editModal = page.locator('div.fixed.inset-0.z-50');
    await expect(editModal.locator('h3:has-text("Edit")')).toBeVisible();
    await editModal.locator('input[type="number"]').first().fill('349');
    await editModal.locator('button:has-text("Save Changes")').click();

    // Verify updated price in row
    await expect(createdRow.locator('text=₹349')).toBeVisible();
  });

  // 4. Collection Creation and Editing
  test('04. Collection creation and editing', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/collections');

    await expect(page.locator('h1:has-text("Collections & Themes")')).toBeVisible();
    await expect(page.locator('text=Dinosaur Collection').first()).toBeVisible();

    // Test Add Collection
    await page.locator('button:has-text("New Collection")').click();
    const modal = page.locator('div.fixed.inset-0.z-50');
    await expect(modal.locator('text=Create New Collection')).toBeVisible();

    const collectionName = `Ocean Deep Safari ${Date.now().toString().slice(-4)}`;
    await modal.locator('input[placeholder*="Dinosaur Explorer Collection"]').fill(collectionName);
    await modal.locator('textarea').first().fill('Vibrant aquatic sea creatures plaster paint kits for young kids.');

    await modal.locator('button:has-text("Save Collection")').click();

    // Verify new collection listed
    await expect(page.locator(`text=${collectionName}`)).toBeVisible();

    // Test Edit Collection
    const colRow = page.locator(`tr:has-text("${collectionName}")`);
    await colRow.locator('button[title="Edit Collection"]').click();
    const editModal = page.locator('div.fixed.inset-0.z-50');
    await editModal.locator('textarea').first().fill('Updated premium handcrafted ocean paint kits.');
    await editModal.locator('button:has-text("Save Collection")').click();

    await expect(page.locator('text=Updated premium handcrafted ocean paint kits.')).toBeVisible();
  });

  // 5. Inventory Stock Adjustment with Reason and Attribution
  test('05. Inventory stock adjustment with reason and attribution', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/inventory');

    await expect(page.locator('h1:has-text("Inventory & Stock Holds")')).toBeVisible();
    await expect(page.locator('th:has-text("Physical Stock")')).toBeVisible();
    await expect(page.locator('th:has-text("Available to Sell")')).toBeVisible();

    // Click Adjust Stock on first product
    const adjustBtn = page.locator('button:has-text("Adjust Stock")').first();
    await adjustBtn.click();

    const adjustModal = page.locator('div.fixed.inset-0.z-50');
    await expect(adjustModal.locator('text=Manual Stock Adjustment')).toBeVisible();

    // Fill adjustment form scoped to modal
    const stockInput = adjustModal.locator('input[type="number"]').first();
    await stockInput.fill('68');

    const reasonSelect = adjustModal.locator('select').first();
    await reasonSelect.selectOption('Physical Count Audit');

    const noteTextarea = adjustModal.locator('textarea').first();
    await noteTextarea.fill('Comprehensive warehouse count verified by Admin Lead');

    // Confirm attribution is visible in modal
    await expect(adjustModal.locator('text=admin@rangaroo.store')).toBeVisible();

    // Commit stock
    await adjustModal.locator('button:has-text("Confirm & Commit Stock")').click();

    // Switch to Movement History tab to verify ledger record
    await page.locator('button:has-text("Movement History")').click();
    await expect(page.locator('text=MANUAL_ADJUSTMENT').first()).toBeVisible();
    await expect(page.locator('text=Physical Count Audit').first()).toBeVisible();
    await expect(page.locator('text=admin@rangaroo.store').first()).toBeVisible();
  });

  // 6. Order Detail, Courier Assignment, and Fulfillment
  test('06. Order detail, courier assignment, and fulfillment', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/orders');

    await expect(page.locator('h1:has-text("Orders & Fulfillment")')).toBeVisible();
    await expect(page.locator('text=ORD-2026-9021').first()).toBeVisible();

    // Open order details modal
    const orderRow = page.locator('tr:has-text("ORD-2026-9021")');
    await orderRow.locator('button:has-text("Details")').click();

    // Verify order details drawer content
    const detailsModal = page.locator('div.fixed.inset-0.z-50');
    await expect(detailsModal.locator('h3:has-text("Order ORD-2026-9021")')).toBeVisible();
    await expect(detailsModal.locator('text=Powai')).toBeVisible();
    await expect(detailsModal.locator('text=Payment Breakdown')).toBeVisible();

    // Close details modal
    await detailsModal.locator('button:has(svg.lucide-x)').first().click();

    // Open Courier Assignment from row
    await orderRow.locator('button[title="Assign Courier & AWB"]').click();

    const courierModal = page.locator('div.fixed.inset-0.z-50');
    await expect(courierModal.locator('text=Fulfillment & Courier Assignment')).toBeVisible();

    const awbInput = courierModal.locator('input[placeholder*="DLH-99281729"]');
    await awbInput.fill('AWB-DELHIVERY-778899');
    await courierModal.locator('button:has-text("Confirm Shipment")').click();

    // Verify status updated to shipped
    await expect(orderRow.locator('span:has-text("shipped")')).toBeVisible();
  });

  // 7. Refund Permission Enforcement (SUPER_ADMIN vs ORDER_MANAGER vs SUPPORT_AGENT)
  test('07. Refund permission enforcement (SUPER_ADMIN vs ORDER_MANAGER vs SUPPORT_AGENT)', async ({ page }) => {
    // 7A: SUPER_ADMIN has refund permission
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/orders');
    await page.locator('tr:has-text("ORD-2026-9021")').locator('button:has-text("Details")').click();
    await expect(page.locator('button:has-text("Issue Refund")')).toBeVisible();
    await page.locator('div.fixed.inset-0.z-50 button:has(svg.lucide-x)').first().click();

    // 7B: ORDER_MANAGER has refund permission
    await setAdminSession(page, 'ORDER_MANAGER');
    await page.goto('/admin/orders');
    await page.locator('tr:has-text("ORD-2026-9021")').locator('button:has-text("Details")').click();
    await expect(page.locator('button:has-text("Issue Refund")')).toBeVisible();
    await page.locator('div.fixed.inset-0.z-50 button:has(svg.lucide-x)').first().click();

    // 7C: SUPPORT_AGENT is strictly forbidden from refunds
    await setAdminSession(page, 'SUPPORT_AGENT');
    await page.goto('/admin/orders');
    await page.locator('tr:has-text("ORD-2026-9021")').locator('button:has-text("Details")').click();
    await expect(page.locator('button:has-text("Issue Refund")')).not.toBeVisible();
  });

  // 8. Customer Listing & PII Masking
  test('08. Customer listing & PII masking (verifying masked vs unmasked fields based on role)', async ({ page }) => {
    // 8A: SUPER_ADMIN sees full unmasked PII
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/customers');

    await expect(page.locator('h1:has-text("Customers CRM")')).toBeVisible();
    await expect(page.locator('text=Priya Sharma').first()).toBeVisible();
    await expect(page.locator('text=priya.sharma@example.com').first()).toBeVisible();
    await expect(page.locator('span:has-text("PII Masked")').first()).not.toBeVisible();

    // 8B: SUPPORT_AGENT sees strictly redacted/masked PII
    await setAdminSession(page, 'SUPPORT_AGENT');
    await page.goto('/admin/customers');

    await expect(page.locator('h1:has-text("Customers CRM")')).toBeVisible();
    // Indicator badge must be visible
    await expect(page.locator('span:has-text("PII Masked")').first()).toBeVisible();
    // Unmasked full email must NOT be present
    await expect(page.locator('text=priya.sharma@example.com')).not.toBeVisible();
    // Masked patterns must be present
    await expect(page.locator('text=P*** S***').or(page.locator('text=p***@e***.com')).first()).toBeVisible();
  });

  // 9. Coupon Creation and Editing
  test('09. Coupon creation and editing', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/coupons');

    await expect(page.locator('h1:has-text("Coupons & Discounts")')).toBeVisible();
    await expect(page.locator('text=FIRST10').first()).toBeVisible();

    // Add new coupon
    await page.locator('button:has-text("Create Promo Code")').click();
    const modal = page.locator('div.fixed.inset-0.z-50');
    await expect(modal.locator('text=Discount Coupon')).toBeVisible();

    const couponCode = `PLAY${Date.now().toString().slice(-4)}`;
    await modal.locator('input[placeholder*="ROOFUN15"]').fill(couponCode);
    await modal.locator('input[type="number"]').first().fill('25');

    await modal.locator('button:has-text("Save Coupon")').click();

    // Verify coupon in table
    await expect(page.locator(`text=${couponCode}`)).toBeVisible();

    // Edit coupon
    const couponRow = page.locator(`tr:has-text("${couponCode}")`);
    await couponRow.locator('button[title="Edit Coupon"]').click();
    const editModal = page.locator('div.fixed.inset-0.z-50');
    await editModal.locator('input[type="number"]').first().fill('30');
    await editModal.locator('button:has-text("Save Coupon")').click();

    await expect(couponRow.locator('text=30%')).toBeVisible();
  });

  // 10. Review Moderation (Approve/Reject)
  test('10. Review moderation (approve/reject)', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/reviews');

    await expect(page.locator('h1:has-text("Customer Reviews")')).toBeVisible();

    // Verify tab options
    await expect(page.locator('button:has-text("Needs Moderation")')).toBeVisible();
    await expect(page.locator('button:has-text("Approved")')).toBeVisible();
    await expect(page.locator('button:has-text("Rejected")')).toBeVisible();

    // Moderation queue has pending reviews
    await page.locator('button:has-text("Needs Moderation")').click();
    const pendingCard = page.locator('div:has-text("PENDING")').first();
    await expect(pendingCard).toBeVisible();

    // Approve the pending review
    await pendingCard.getByRole('button', { name: 'Approve', exact: true }).click();

    // Check Approved tab to confirm promotion
    await page.locator('button:has-text("Approved")').click();
    await expect(page.locator('span:has-text("APPROVED")').first()).toBeVisible();
  });

  // 11. CMS Section Update and Preview
  test('11. CMS section update and preview', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/cms');

    await expect(page.locator('h1:has-text("Site CMS & Branding")')).toBeVisible();

    // Edit announcement ticker
    const announcementInput = page.locator('input[placeholder*="Free Express Shipping"]').first();
    const testAnnouncement = `🎨 Special Craft Festival Live Today! Free Shipping over ₹499! 🦘`;
    await announcementInput.fill(testAnnouncement);

    // Open live preview drawer
    await page.locator('button:has-text("Preview Storefront")').click();
    const previewDrawer = page.locator('div.fixed.inset-0.z-50');
    await expect(previewDrawer.locator('text=Live Storefront Preview')).toBeVisible();
    await expect(previewDrawer.locator(`text=${testAnnouncement}`).last()).toBeVisible();

    // Toggle Mobile view
    await previewDrawer.locator('button[title="Mobile View"]').click();
    await expect(previewDrawer.locator('div.w-80')).toBeVisible();

    // Close preview drawer
    await previewDrawer.locator('button:has(svg.lucide-x)').click();

    // Save CMS updates
    await page.locator('button:has-text("Publish Site CMS Updates")').click();
  });

  // 12. Staff Role Assignment and Status Toggle
  test('12. Staff role assignment and status toggle', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/staff');

    await expect(page.locator('h1:has-text("Staff Directory & RBAC")')).toBeVisible();

    // Invite new staff
    await page.locator('button:has-text("Invite Staff")').click();
    const inviteModal = page.locator('div.fixed.inset-0.z-50');
    await expect(inviteModal.locator('text=Invite Administrator')).toBeVisible();

    const staffName = 'Neha Kulkarni';
    const staffEmail = `neha.${Date.now().toString().slice(-4)}@rangaroo.store`;
    await inviteModal.locator('input[placeholder*="Aditi Sharma"]').fill(staffName);
    await inviteModal.locator('input[placeholder*="aditi@rangaroo.store"]').fill(staffEmail);
    await inviteModal.locator('button:has-text("Send Admin Invitation")').click();

    // Verify staff added to directory
    await expect(page.locator(`text=${staffName}`)).toBeVisible();
    const staffRow = page.locator(`tr:has-text("${staffName}")`);

    // Edit staff role
    await staffRow.locator('button[title="Change Role"]').click();
    const editRoleModal = page.locator('div.fixed.inset-0.z-50');
    await expect(editRoleModal.locator('text=Modify Staff Role')).toBeVisible();
    await editRoleModal.locator('select').first().selectOption('ORDER_MANAGER');
    await editRoleModal.locator('button:has-text("Save New Role")').click();

    await expect(staffRow.locator('text=ORDER_MANAGER')).toBeVisible();

    // Toggle active status (deactivate)
    const toggleBtn = staffRow.locator('button:has-text("Active")');
    await toggleBtn.click();
    await expect(staffRow.locator('text=Access Revoked')).toBeVisible();

    // Switch to Permission Matrix tab
    await page.locator('button:has-text("Permission Matrix")').click();
    await expect(page.locator('text=SUPER_ADMIN').first()).toBeVisible();
    await expect(page.locator('text=SUPPORT_AGENT').first()).toBeVisible();
  });

  // 13. Audit Log Viewing and Filtering
  test('13. Audit log viewing and filtering', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    await page.goto('/admin/audit-logs');

    await expect(page.locator('h1:has-text("Security Audit Trail")')).toBeVisible();
    await expect(page.locator('text=inventory.adjust').first()).toBeVisible();

    // Filter by resource
    const resourceSelect = page.locator('select').first();
    await resourceSelect.selectOption('product');
    await expect(page.locator('tr:has-text("product")').first()).toBeVisible();

    // Inspect Before/After Diff
    await page.locator('button:has-text("View Diff")').first().click();
    const diffModal = page.locator('div.fixed.inset-0.z-50');
    await expect(diffModal.locator('text=Audit Diff Inspection')).toBeVisible();
    await expect(diffModal.locator('text=Previous State (Before)')).toBeVisible();
    await expect(diffModal.locator('text=Updated State (After)')).toBeVisible();
  });

  // 14. Unauthorized Access Checks (Verifying Role Restrictions Per Module)
  test('14. Unauthorized access checks (verifying role restrictions per module)', async ({ page }) => {
    // Under SUPPORT_AGENT, sensitive operational modules are restricted
    await setAdminSession(page, 'SUPPORT_AGENT');
    await page.goto('/admin');

    // Sidebar navigation check: Staff, CMS, Shipping, Settings must show lock icons
    const sidebar = page.locator('aside');
    await expect(sidebar.locator('a[href="/admin/staff"] svg.lucide-lock')).toBeVisible();
    await expect(sidebar.locator('a[href="/admin/settings"] svg.lucide-lock')).toBeVisible();
    await expect(sidebar.locator('a[href="/admin/cms"] svg.lucide-lock')).toBeVisible();

    // Direct access to Staff page as SUPPORT_AGENT should disable invite button
    await page.goto('/admin/staff');
    const inviteBtn = page.locator('button:has-text("Invite Staff")');
    await expect(inviteBtn).toBeDisabled();
  });

  // 15. Mobile Admin Navigation (Drawer Open/Close and Page Switching)
  test('15. Mobile admin navigation (drawer open/close and page switching)', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');
    // Set viewport to mobile phone dimensions
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin');

    // On mobile, persistent sidebar is hidden
    const mobileMenuBtn = page.locator('button[aria-label="Toggle Navigation"]');
    await expect(mobileMenuBtn).toBeVisible();

    // Open mobile navigation drawer
    await mobileMenuBtn.click();
    const mobileDrawer = page.locator('div.fixed.inset-0.z-50');
    await expect(mobileDrawer).toBeVisible();
    await expect(mobileDrawer.locator('text=Enterprise Management')).toBeVisible();

    // Click a module link (e.g. Coupons)
    await mobileDrawer.locator('a[href="/admin/coupons"]').click();

    // Verify drawer closed and URL updated
    await expect(page).toHaveURL(/\/admin\/coupons/);
    await expect(page.locator('h1:has-text("Coupons & Discounts")')).toBeVisible();
  });
});
