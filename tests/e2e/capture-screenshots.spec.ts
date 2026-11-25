import { test, expect, Page } from '@playwright/test';
import path from 'path';

async function setAdminSession(page: Page, role: string = 'SUPER_ADMIN') {
  await page.addInitScript((roleName) => {
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
          activeRoleOverride: null,
        },
        version: 0,
      })
    );
  }, role);
}

test.describe('Admin Screenshot Capture Suite', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('Capture all 7 key admin module screenshots', async ({ page }) => {
    await setAdminSession(page, 'SUPER_ADMIN');

    const screenshots = [
      { url: '/admin', filename: 'dashboard.png', waitFor: 'h1:has-text("Store Performance Overview")' },
      { url: '/admin/products', filename: 'products.png', waitFor: 'h1:has-text("Products Catalog")' },
      { url: '/admin/inventory', filename: 'inventory.png', waitFor: 'h1:has-text("Inventory & Stock Holds")' },
      { url: '/admin/orders', filename: 'orders.png', waitFor: 'h1:has-text("Orders & Fulfillment")' },
      { url: '/admin/customers', filename: 'customers.png', waitFor: 'h1:has-text("Customers CRM")' },
      { url: '/admin/analytics', filename: 'analytics.png', waitFor: 'h1:has-text("Sales & Analytics")' },
      { url: '/admin/staff', filename: 'staff.png', waitFor: 'h1:has-text("Staff Directory & RBAC")' },
    ];

    for (const item of screenshots) {
      await page.goto(item.url, { waitUntil: 'networkidle' });
      await expect(page.locator(item.waitFor)).toBeVisible();
      // Brief stabilization wait for fonts, charts and icons to settle
      await page.waitForTimeout(500);

      const targetPath = path.join(process.cwd(), 'docs', 'screenshots', item.filename);
      await page.screenshot({ path: targetPath, fullPage: false });
    }
  });
});
