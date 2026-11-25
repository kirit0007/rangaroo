import { test, expect } from '@playwright/test';
import { checkRolePermission, maskCustomerPII, AdminPermission } from '@/lib/admin/adminAuth';

test.describe('RBAC Roles & Permission Evaluation Matrix', () => {
  test('SUPER_ADMIN has all administrative permissions', () => {
    const allPermissions: AdminPermission[] = [
      'products.read',
      'products.manage',
      'inventory.read',
      'inventory.adjust',
      'collections.manage',
      'orders.read',
      'orders.read_masked',
      'orders.fulfill',
      'orders.cancel',
      'orders.refund',
      'customers.read',
      'customers.read_masked',
      'customers.export',
      'coupons.manage',
      'campaigns.manage',
      'reviews.read',
      'reviews.moderate',
      'cms.manage',
      'shipping.manage',
      'staff.manage',
      'audit.read',
      'settings.manage',
    ];

    for (const perm of allPermissions) {
      expect(checkRolePermission('SUPER_ADMIN', perm)).toBe(true);
    }
  });

  test('STORE_ADMIN has operational permissions but cannot manage staff, settings or delete audit', () => {
    expect(checkRolePermission('STORE_ADMIN', 'products.manage')).toBe(true);
    expect(checkRolePermission('STORE_ADMIN', 'orders.fulfill')).toBe(true);
    expect(checkRolePermission('STORE_ADMIN', 'orders.refund')).toBe(true);
    expect(checkRolePermission('STORE_ADMIN', 'coupons.manage')).toBe(true);

    // Forbidden for STORE_ADMIN
    expect(checkRolePermission('STORE_ADMIN', 'staff.manage')).toBe(false);
    expect(checkRolePermission('STORE_ADMIN', 'settings.manage')).toBe(false);
  });

  test('ORDER_MANAGER has order fulfillment, cancellation and refund permissions but cannot edit products', () => {
    expect(checkRolePermission('ORDER_MANAGER', 'orders.read')).toBe(true);
    expect(checkRolePermission('ORDER_MANAGER', 'orders.fulfill')).toBe(true);
    expect(checkRolePermission('ORDER_MANAGER', 'orders.cancel')).toBe(true);
    expect(checkRolePermission('ORDER_MANAGER', 'orders.refund')).toBe(true);
    expect(checkRolePermission('ORDER_MANAGER', 'shipping.manage')).toBe(true);

    // Forbidden for ORDER_MANAGER
    expect(checkRolePermission('ORDER_MANAGER', 'products.manage')).toBe(false);
    expect(checkRolePermission('ORDER_MANAGER', 'coupons.manage')).toBe(false);
    expect(checkRolePermission('ORDER_MANAGER', 'staff.manage')).toBe(false);
  });

  test('Cancellation and refund permissions are independently enforceable', () => {
    // Both ORDER_MANAGER and STORE_ADMIN have cancel and refund
    expect(checkRolePermission('ORDER_MANAGER', 'orders.cancel')).toBe(true);
    expect(checkRolePermission('ORDER_MANAGER', 'orders.refund')).toBe(true);

    // PRODUCT_MANAGER has neither
    expect(checkRolePermission('PRODUCT_MANAGER', 'orders.cancel')).toBe(false);
    expect(checkRolePermission('PRODUCT_MANAGER', 'orders.refund')).toBe(false);

    // SUPPORT_AGENT has neither
    expect(checkRolePermission('SUPPORT_AGENT', 'orders.cancel')).toBe(false);
    expect(checkRolePermission('SUPPORT_AGENT', 'orders.refund')).toBe(false);
  });

  test('PRODUCT_MANAGER can manage products and adjust stock but cannot access orders or finances', () => {
    expect(checkRolePermission('PRODUCT_MANAGER', 'products.read')).toBe(true);
    expect(checkRolePermission('PRODUCT_MANAGER', 'products.manage')).toBe(true);
    expect(checkRolePermission('PRODUCT_MANAGER', 'inventory.adjust')).toBe(true);
    expect(checkRolePermission('PRODUCT_MANAGER', 'collections.manage')).toBe(true);

    expect(checkRolePermission('PRODUCT_MANAGER', 'orders.read')).toBe(false);
    expect(checkRolePermission('PRODUCT_MANAGER', 'orders.fulfill')).toBe(false);
    expect(checkRolePermission('PRODUCT_MANAGER', 'customers.export')).toBe(false);
  });

  test('CONTENT_MANAGER can manage CMS and moderate reviews only', () => {
    expect(checkRolePermission('CONTENT_MANAGER', 'cms.manage')).toBe(true);
    expect(checkRolePermission('CONTENT_MANAGER', 'reviews.moderate')).toBe(true);
    expect(checkRolePermission('CONTENT_MANAGER', 'campaigns.manage')).toBe(true);

    expect(checkRolePermission('CONTENT_MANAGER', 'orders.read')).toBe(false);
    expect(checkRolePermission('CONTENT_MANAGER', 'inventory.adjust')).toBe(false);
    expect(checkRolePermission('CONTENT_MANAGER', 'staff.manage')).toBe(false);
  });

  test('SUPPORT_AGENT is strictly read-only with masked customer information', () => {
    expect(checkRolePermission('SUPPORT_AGENT', 'orders.read_masked')).toBe(true);
    expect(checkRolePermission('SUPPORT_AGENT', 'customers.read_masked')).toBe(true);

    // Full read / mutate forbidden
    expect(checkRolePermission('SUPPORT_AGENT', 'orders.read')).toBe(false);
    expect(checkRolePermission('SUPPORT_AGENT', 'customers.read')).toBe(false);
    expect(checkRolePermission('SUPPORT_AGENT', 'customers.export')).toBe(false);
    expect(checkRolePermission('SUPPORT_AGENT', 'orders.cancel')).toBe(false);
    expect(checkRolePermission('SUPPORT_AGENT', 'orders.refund')).toBe(false);
    expect(checkRolePermission('SUPPORT_AGENT', 'products.manage')).toBe(false);
  });

  test('maskCustomerPII masks sensitive name, email, and phone correctly', () => {
    const rawCustomer = {
      customer_name: 'Ananya Sharma',
      customer_email: 'ananya.sharma@gmail.com',
      customer_phone: '+919876543210',
    };

    const masked = maskCustomerPII(rawCustomer);

    // Name masked
    expect(masked.customer_name).toBe('A*** S***');

    // Email masked
    expect(masked.customer_email).toMatch(/^a\*\*\*@g\*\*\*\.com$/);

    // Phone masked (only country code prefix and last 3 digits exposed)
    expect(masked.customer_phone).toContain('***** **');
    expect(masked.customer_phone.endsWith('210')).toBe(true);
  });
});
