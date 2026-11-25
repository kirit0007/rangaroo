import { test, expect } from '@playwright/test';
import crypto from 'crypto';

class MockRazorpayWebhookProcessor {
  webhookSecret = 'test_webhook_secret_key_12345';
  processedEventIds: Set<string> = new Set();
  orders: Map<string, { status: string; payment_status: string; payment_id?: string }> = new Map();

  constructor() {
    this.orders.set('ORD-WEBHOOK-1', { status: 'PENDING', payment_status: 'PENDING' });
    this.orders.set('ORD-WEBHOOK-ALREADY-PAID', { status: 'PROCESSING', payment_status: 'PAID', payment_id: 'pay_orig_123' });
  }

  verifySignature(rawBuffer: Buffer, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBuffer)
      .digest('hex');

    if (signature.length !== expected.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  processWebhookEvent(
    rawBuffer: Buffer,
    signature: string,
    eventId: string,
    eventType: string,
    payload: { order_id?: string; receipt?: string; payment_id?: string; id?: string; [key: string]: unknown }
  ) {
    // 1. Signature check over raw buffer
    if (!this.verifySignature(rawBuffer, signature)) {
      return { status: 400, error: 'INVALID_SIGNATURE' };
    }

    // 2. Deduplication check
    if (this.processedEventIds.has(eventId)) {
      return { status: 200, message: 'Event already processed (Idempotent ACK)' };
    }

    // 3. Process event
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const orderId = (payload.order_id || payload.receipt) as string;
      const paymentId = (payload.payment_id || payload.id) as string | undefined;
      const order = this.orders.get(orderId);

      if (order) {
        order.payment_status = 'PAID';
        order.status = 'PROCESSING';
        order.payment_id = paymentId;
      }
    } else if (eventType === 'payment.failed') {
      const orderId = (payload.order_id || payload.receipt) as string;
      const order = this.orders.get(orderId);

      if (order) {
        // Critical invariant: Cannot downgrade an already PAID order!
        if (order.payment_status === 'PAID') {
          // Ignore late failed event
          return { status: 200, message: 'Ignored: Order is already paid' };
        }
        order.payment_status = 'FAILED';
        order.status = 'FAILED';
      }
    }

    this.processedEventIds.add(eventId);
    return { status: 200, message: 'Processed successfully' };
  }

  // Reconciliation recovery
  reconcileOrder(orderId: string, razorpayPaymentId: string, razorpayStatus: string) {
    const order = this.orders.get(orderId);
    if (!order) return { reconciled: false, error: 'ORDER_NOT_FOUND' };

    if (razorpayStatus === 'captured' && order.payment_status === 'PENDING') {
      order.payment_status = 'PAID';
      order.status = 'PROCESSING';
      order.payment_id = razorpayPaymentId;
      return { reconciled: true, new_status: 'PAID' };
    }

    return { reconciled: false, message: 'No reconciliation needed' };
  }
}

test.describe('Razorpay Webhook Lifecycle & Recovery Invariant Suite', () => {
  test('Valid HMAC-SHA256 signature over raw buffer is verified successfully', () => {
    const processor = new MockRazorpayWebhookProcessor();
    const rawPayload = Buffer.from(JSON.stringify({ event: 'payment.captured', id: 'evt_1' }));
    const validSignature = crypto.createHmac('sha256', processor.webhookSecret).update(rawPayload).digest('hex');

    expect(processor.verifySignature(rawPayload, validSignature)).toBe(true);
  });

  test('Tampered webhook payload causes signature verification failure', () => {
    const processor = new MockRazorpayWebhookProcessor();
    const originalPayload = Buffer.from(JSON.stringify({ event: 'payment.captured', amount: 500 }));
    const signature = crypto.createHmac('sha256', processor.webhookSecret).update(originalPayload).digest('hex');

    // Tampered payload
    const tamperedPayload = Buffer.from(JSON.stringify({ event: 'payment.captured', amount: 100 }));
    expect(processor.verifySignature(tamperedPayload, signature)).toBe(false);
  });

  test('Webhook event deduplication safely handles duplicate deliveries', () => {
    const processor = new MockRazorpayWebhookProcessor();
    const rawPayload = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
    const signature = crypto.createHmac('sha256', processor.webhookSecret).update(rawPayload).digest('hex');

    const eventPayload = { order_id: 'ORD-WEBHOOK-1', payment_id: 'pay_999' };

    // First arrival
    const firstRun = processor.processWebhookEvent(rawPayload, signature, 'evt_unique_101', 'payment.captured', eventPayload);
    expect(firstRun.status).toBe(200);
    expect(firstRun.message).toBe('Processed successfully');

    const order = processor.orders.get('ORD-WEBHOOK-1')!;
    expect(order.payment_status).toBe('PAID');
    expect(order.payment_id).toBe('pay_999');

    // Duplicate arrival (same event ID)
    const duplicateRun = processor.processWebhookEvent(rawPayload, signature, 'evt_unique_101', 'payment.captured', eventPayload);
    expect(duplicateRun.status).toBe(200);
    expect(duplicateRun.message).toContain('Idempotent ACK');
  });

  test('Out-of-order or late payment.failed event cannot downgrade an already PAID order', () => {
    const processor = new MockRazorpayWebhookProcessor();
    const rawPayload = Buffer.from(JSON.stringify({ event: 'payment.failed' }));
    const signature = crypto.createHmac('sha256', processor.webhookSecret).update(rawPayload).digest('hex');

    // Attempt to fail ORD-WEBHOOK-ALREADY-PAID
    const run = processor.processWebhookEvent(
      rawPayload,
      signature,
      'evt_fail_late',
      'payment.failed',
      { order_id: 'ORD-WEBHOOK-ALREADY-PAID' }
    );

    expect(run.status).toBe(200);
    expect(run.message).toContain('Ignored: Order is already paid');

    const order = processor.orders.get('ORD-WEBHOOK-ALREADY-PAID')!;
    expect(order.payment_status).toBe('PAID'); // Remains PAID!
    expect(order.status).toBe('PROCESSING');
  });

  test('Reconciliation recovery safely marks order PAID if local network failed during webhook', () => {
    const processor = new MockRazorpayWebhookProcessor();
    // Simulate ORD-WEBHOOK-1 was never updated by webhook due to network blip
    const order = processor.orders.get('ORD-WEBHOOK-1')!;
    expect(order.payment_status).toBe('PENDING');

    // Reconciliation worker executes
    const recResult = processor.reconcileOrder('ORD-WEBHOOK-1', 'pay_recovered_888', 'captured');
    expect(recResult.reconciled).toBe(true);
    expect(order.payment_status).toBe('PAID');
    expect(order.payment_id).toBe('pay_recovered_888');
  });
});
