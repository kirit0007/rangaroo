import { test, expect } from '@playwright/test';
import crypto from 'crypto';

// Simulation of secure guest order tracking logic
class MockGuestOrderSecurity {
  orders: Map<string, {
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    tracking_token_hash: string;
    tracking_token_expires_at: number;
    tracking_token_revoked_at?: number;
    order_status: string;
  }> = new Map();

  rateLimits: Map<string, { count: number; window_start: number }> = new Map();

  createGuestOrder(orderNumber: string, name: string, email: string, phone: string) {
    // Generate high-entropy raw token (32 bytes = 256 bits of entropy)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    this.orders.set(orderNumber, {
      order_number: orderNumber,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      tracking_token_hash: tokenHash,
      tracking_token_expires_at: Date.now() + 30 * 86400000, // 30 days
      order_status: 'PROCESSING',
    });

    return { orderNumber, rawToken };
  }

  trackOrder(orderNumber: string, providedRawToken: string, clientIp: string, now: number = Date.now()) {
    // 1. IP Rate Limiting: Max 5 attempts per minute
    const windowMs = 60 * 1000;
    const rl = this.rateLimits.get(clientIp) || { count: 0, window_start: now };
    if (now - rl.window_start > windowMs) {
      rl.count = 1;
      rl.window_start = now;
    } else {
      rl.count += 1;
    }
    this.rateLimits.set(clientIp, rl);

    if (rl.count > 5) {
      return { status: 429, error: 'RATE_LIMIT_EXCEEDED' };
    }

    // 2. Hash comparison
    const providedHash = crypto.createHash('sha256').update(providedRawToken).digest('hex');
    const order = this.orders.get(orderNumber);

    // Constant-time comparison & anti-enumeration:
    // If order not found, compare with dummy hash to prevent timing side-channels
    const targetHash = order?.tracking_token_hash || crypto.createHash('sha256').update('dummy').digest('hex');
    const isMatch = crypto.timingSafeEqual(Buffer.from(providedHash, 'hex'), Buffer.from(targetHash, 'hex'));

    if (!order || !isMatch) {
      return { status: 404, error: 'ORDER_NOT_FOUND', message: 'Order not found or tracking link is invalid' };
    }

    // Expiry check
    if (now > order.tracking_token_expires_at) {
      return { status: 410, error: 'LINK_EXPIRED', message: 'Tracking link has expired' };
    }

    // Revocation check
    if (order.tracking_token_revoked_at) {
      return { status: 403, error: 'LINK_REVOKED', message: 'Tracking link has been revoked' };
    }

    // Masked PII response
    return {
      status: 200,
      data: {
        order_number: order.order_number,
        order_status: order.order_status,
        customer_name: order.customer_name.replace(/(\w)\w+/g, '$1***'),
        customer_email: order.customer_email.replace(/^(.)(.*)(@.)(.*)(\..*)$/, '$1***$3***$5'),
        customer_phone: order.customer_phone.slice(0, 3) + ' ***** **' + order.customer_phone.slice(-3),
      },
    };
  }

  revokeToken(orderNumber: string, now: number = Date.now()) {
    const order = this.orders.get(orderNumber);
    if (order) {
      order.tracking_token_revoked_at = now;
    }
  }
}

test.describe('Guest Order Tracking Security & Invariant Suite', () => {
  test('High-entropy raw token is 64 hex characters (256-bit entropy)', () => {
    const tracker = new MockGuestOrderSecurity();
    const { rawToken } = tracker.createGuestOrder('ORD-901', 'Pooja Patel', 'pooja@gmail.com', '+919876543210');
    expect(rawToken).toHaveLength(64);
  });

  test('Database stores only token hash, never raw token in plaintext', () => {
    const tracker = new MockGuestOrderSecurity();
    const { orderNumber, rawToken } = tracker.createGuestOrder('ORD-902', 'Pooja Patel', 'pooja@gmail.com', '+919876543210');
    const stored = tracker.orders.get(orderNumber)!;

    expect(stored.tracking_token_hash).not.toBe(rawToken);
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    expect(stored.tracking_token_hash).toBe(expectedHash);
  });

  test('Valid raw token retrieves masked order data successfully', () => {
    const tracker = new MockGuestOrderSecurity();
    const { orderNumber, rawToken } = tracker.createGuestOrder('ORD-903', 'Vikram Seth', 'vikram.seth@example.com', '+919123456789');

    const res = tracker.trackOrder(orderNumber, rawToken, '192.168.1.1');
    expect(res.status).toBe(200);
    expect(res.data?.order_number).toBe('ORD-903');
    expect(res.data?.customer_name).toBe('V*** S***');
    expect(res.data?.customer_email).toBe('v***@e***.com');
    expect(res.data?.customer_phone).toContain('***** **');
  });

  test('Invalid raw token returns anti-enumeration 404 response', () => {
    const tracker = new MockGuestOrderSecurity();
    const { orderNumber } = tracker.createGuestOrder('ORD-904', 'Vikram Seth', 'vikram@example.com', '+919123456789');

    const fakeToken = crypto.randomBytes(32).toString('hex');
    const res = tracker.trackOrder(orderNumber, fakeToken, '192.168.1.2');

    expect(res.status).toBe(404);
    expect(res.error).toBe('ORDER_NOT_FOUND');
  });

  test('Expired tracking token is rejected with 410', () => {
    const tracker = new MockGuestOrderSecurity();
    const { orderNumber, rawToken } = tracker.createGuestOrder('ORD-905', 'Kiran Bedi', 'kiran@example.com', '+919123456789');

    // Simulate 31 days into future
    const futureTime = Date.now() + 31 * 86400000;
    const res = tracker.trackOrder(orderNumber, rawToken, '192.168.1.3', futureTime);

    expect(res.status).toBe(410);
    expect(res.error).toBe('LINK_EXPIRED');
  });

  test('Revoked tracking token is rejected with 403', () => {
    const tracker = new MockGuestOrderSecurity();
    const { orderNumber, rawToken } = tracker.createGuestOrder('ORD-906', 'Kiran Bedi', 'kiran@example.com', '+919123456789');

    tracker.revokeToken(orderNumber);
    const res = tracker.trackOrder(orderNumber, rawToken, '192.168.1.4');

    expect(res.status).toBe(403);
    expect(res.error).toBe('LINK_REVOKED');
  });

  test('Brute-force attack on tracking endpoint triggers 429 Rate Limit', () => {
    const tracker = new MockGuestOrderSecurity();
    const attackerIp = '203.0.113.42';

    // Send 5 rapid requests
    for (let i = 0; i < 5; i++) {
      const fakeToken = crypto.randomBytes(32).toString('hex');
      tracker.trackOrder('ORD-TARGET', fakeToken, attackerIp);
    }

    // 6th request within window must be rate limited
    const sixth = tracker.trackOrder('ORD-TARGET', crypto.randomBytes(32).toString('hex'), attackerIp);
    expect(sixth.status).toBe(429);
    expect(sixth.error).toBe('RATE_LIMIT_EXCEEDED');
  });
});
