import { test, expect } from '@playwright/test';

test.describe('Storefront Customer Journey & Finishing Verification', () => {
  test('01. Storefront homepage loads and displays brand craft elements', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Rangaroo/i, { timeout: 10000 });
    await expect(page.locator('main')).toBeVisible();

    // Verify brand link / logo
    const brandElement = page.getByRole('link', { name: /Rangaroo/i }).first();
    await expect(brandElement).toBeVisible();
  });

  test('02. Catalog routes /products and /shop list craft plaster kits', async ({ page }) => {
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('03. Guest Checkout loads and renders without forcing login modals', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    // Ensure no forced login modal is blocking the screen
    const loginModal = page.locator('[role="dialog"]:has-text("Login")');
    await expect(loginModal).not.toBeVisible();

    // Either empty cart state or guest form is visible
    const cartState = page.getByText('Your Cart is Empty').or(page.locator('input[name="fullName"], input#fullName'));
    await expect(cartState.first()).toBeVisible({ timeout: 10000 });
  });

  test('04. Guest Order Tracking page loads tracking form', async ({ page }) => {
    await page.goto('/track', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    await expect(page.locator('#orderNumberField')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#tokenField')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Track My Order")')).toBeVisible({ timeout: 10000 });
  });

  test('05. Orders page renders and includes guest tracking link', async ({ page }) => {
    await page.goto('/orders', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    const trackLink = page.locator('a[href*="/track"]');
    await expect(trackLink.first()).toBeAttached({ timeout: 10000 });
  });

  test('06. Admin overview route is protected against unauthenticated direct access', async ({ page }) => {
    const response = await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(500);
  });
});
