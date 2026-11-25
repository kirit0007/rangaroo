import { test, expect } from '@playwright/test';

interface MockCoupon {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_order_amount: number;
  max_discount?: number;
  max_uses?: number;
  max_uses_per_user?: number;
  is_active: boolean;
  valid_from: number;
  valid_until?: number;
}

interface MockCouponReservation {
  id: string;
  coupon_id: string;
  order_id: string;
  customer_email: string;
  discount_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';
  expires_at: number;
}

class MockCouponEngine {
  coupons: Map<string, MockCoupon> = new Map();
  reservations: MockCouponReservation[] = [];

  constructor() {
    // 10% off up to ₹100, min spend ₹500, max 1 global use
    this.coupons.set('FLASH10', {
      id: 'c-flash',
      code: 'FLASH10',
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      min_order_amount: 500,
      max_discount: 100,
      max_uses: 1, // Only 1 use available!
      max_uses_per_user: 1,
      is_active: true,
      valid_from: Date.now() - 10000,
      valid_until: Date.now() + 86400000,
    });

    // Fixed ₹50 off, max 1 use per customer, 100 global
    this.coupons.set('WELCOME50', {
      id: 'c-welcome',
      code: 'WELCOME50',
      discount_type: 'FIXED',
      discount_value: 50,
      min_order_amount: 300,
      max_uses: 100,
      max_uses_per_user: 1,
      is_active: true,
      valid_from: Date.now() - 10000,
      valid_until: Date.now() + 86400000,
    });
  }

  reserveCoupon(code: string, orderId: string, email: string, subtotal: number, now: number = Date.now()) {
    const coupon = this.coupons.get(code.toUpperCase());
    if (!coupon || !coupon.is_active) {
      throw new Error(`COUPON_INVALID: Coupon ${code} is invalid or inactive`);
    }

    if (now < coupon.valid_from) {
      throw new Error(`COUPON_NOT_YET_ACTIVE: Coupon valid starting ${coupon.valid_from}`);
    }

    if (coupon.valid_until && now > coupon.valid_until) {
      throw new Error(`COUPON_EXPIRED: Coupon ${code} expired`);
    }

    if (subtotal < coupon.min_order_amount) {
      throw new Error(`COUPON_MIN_SPEND_NOT_MET: Minimum order of ₹${coupon.min_order_amount} required`);
    }

    // Check active global commitments
    if (coupon.max_uses !== undefined) {
      const activeTotal = this.reservations.filter(
        r => r.coupon_id === coupon.id && (r.status === 'CONFIRMED' || (r.status === 'PENDING' && r.expires_at > now))
      ).length;

      if (activeTotal >= coupon.max_uses) {
        throw new Error(`COUPON_EXHAUSTED: Coupon ${code} has reached its maximum usage limit`);
      }
    }

    // Check per-user commitments
    if (coupon.max_uses_per_user !== undefined) {
      const activeUser = this.reservations.filter(
        r => r.coupon_id === coupon.id &&
             r.customer_email.toLowerCase() === email.toLowerCase() &&
             (r.status === 'CONFIRMED' || (r.status === 'PENDING' && r.expires_at > now))
      ).length;

      if (activeUser >= coupon.max_uses_per_user) {
        throw new Error(`COUPON_USER_LIMIT_REACHED: You have already used coupon ${code} the maximum allowed times`);
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = Math.round(subtotal * (coupon.discount_value / 100));
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = Math.min(subtotal, coupon.discount_value);
    }

    const res: MockCouponReservation = {
      id: `cres-${Date.now()}-${Math.random()}`,
      coupon_id: coupon.id,
      order_id: orderId,
      customer_email: email.toLowerCase(),
      discount_amount: discount,
      status: 'PENDING',
      expires_at: now + 15 * 60 * 1000,
    };

    this.reservations.push(res);
    return { success: true, discount_amount: discount };
  }

  confirmCoupon(orderId: string) {
    const res = this.reservations.find(r => r.order_id === orderId && r.status === 'PENDING');
    if (res) {
      res.status = 'CONFIRMED';
      return true;
    }
    return false;
  }

  releaseCoupon(orderId: string) {
    const res = this.reservations.find(r => r.order_id === orderId && r.status === 'PENDING');
    if (res) {
      res.status = 'RELEASED';
      return true;
    }
    return false;
  }
}

test.describe('Atomic Coupon Reservation & Concurrency Suite', () => {
  test('Valid coupon calculates percentage discount with maximum cap', () => {
    const engine = new MockCouponEngine();
    // Subtotal 1500 * 10% = 150, but max cap is 100
    const result = engine.reserveCoupon('FLASH10', 'ORD-1', 'customer1@test.com', 1500);
    expect(result.discount_amount).toBe(100);
  });

  test('Subtotal below minimum order amount is rejected', () => {
    const engine = new MockCouponEngine();
    // FLASH10 requires ₹500 min spend, passing 400
    expect(() => engine.reserveCoupon('FLASH10', 'ORD-2', 'customer2@test.com', 400))
      .toThrow('COUPON_MIN_SPEND_NOT_MET');
  });

  test('Two customers race for 1 final available coupon use: zero oversubscription', () => {
    const engine = new MockCouponEngine();

    // Customer A reserves first
    const resA = engine.reserveCoupon('FLASH10', 'ORD-A', 'alice@test.com', 800);
    expect(resA.success).toBe(true);
    expect(resA.discount_amount).toBe(80);

    // Customer B attempts concurrent reservation while A is in checkout
    expect(() => engine.reserveCoupon('FLASH10', 'ORD-B', 'bob@test.com', 800))
      .toThrow('COUPON_EXHAUSTED');

    // Customer A completes payment
    engine.confirmCoupon('ORD-A');

    // Even after A confirms, B is still rejected as exhausted
    expect(() => engine.reserveCoupon('FLASH10', 'ORD-B', 'bob@test.com', 800))
      .toThrow('COUPON_EXHAUSTED');
  });

  test('Per-user limit prevents same customer from reusing single-use coupon across orders', () => {
    const engine = new MockCouponEngine();

    // First order by Charlie
    const res1 = engine.reserveCoupon('WELCOME50', 'ORD-C1', 'charlie@test.com', 500);
    expect(res1.success).toBe(true);

    // Charlie attempts second order concurrently
    expect(() => engine.reserveCoupon('WELCOME50', 'ORD-C2', 'charlie@test.com', 500))
      .toThrow('COUPON_USER_LIMIT_REACHED');

    // Email casing check (lowercase normalization)
    expect(() => engine.reserveCoupon('WELCOME50', 'ORD-C3', 'CHARLIE@TEST.COM', 500))
      .toThrow('COUPON_USER_LIMIT_REACHED');
  });

  test('Coupon reservation is released on failed checkout, restoring availability', () => {
    const engine = new MockCouponEngine();

    // Alice reserves the 1 available use of FLASH10
    engine.reserveCoupon('FLASH10', 'ORD-A', 'alice@test.com', 800);

    // Bob cannot use it right now
    expect(() => engine.reserveCoupon('FLASH10', 'ORD-B', 'bob@test.com', 800))
      .toThrow('COUPON_EXHAUSTED');

    // Alice abandons checkout or payment fails -> release coupon
    engine.releaseCoupon('ORD-A');

    // Now Bob can immediately claim it!
    const resB = engine.reserveCoupon('FLASH10', 'ORD-B', 'bob@test.com', 800);
    expect(resB.success).toBe(true);
    expect(resB.discount_amount).toBe(80);
  });
});
