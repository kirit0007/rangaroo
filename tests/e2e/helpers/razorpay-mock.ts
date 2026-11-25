import crypto from 'crypto';

export const TEST_WEBHOOK_SECRET = 'test_webhook_secret_key_12345';

/**
 * Generates an HMAC-SHA256 signature for Razorpay webhook verification.
 */
export function generateRazorpayWebhookSignature(
  rawBody: string | Buffer,
  secret: string = TEST_WEBHOOK_SECRET
): string {
  const buf = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  return crypto.createHmac('sha256', secret).update(buf).digest('hex');
}

/**
 * Generates a standard Razorpay `payment.captured` webhook payload.
 */
export function createPaymentCapturedPayload(params: {
  eventId: string;
  orderId: string;
  paymentId: string;
  amount: number; // in INR
  currency?: string;
  email?: string;
  contact?: string;
}): { eventId: string; payload: any; rawBody: string; signature: string } {
  const currency = params.currency || 'INR';
  const amountInPaise = Math.round(params.amount * 100);

  const payload = {
    entity: 'event',
    account_id: 'acc_test123',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: params.paymentId,
          entity: 'payment',
          amount: amountInPaise,
          currency,
          status: 'captured',
          order_id: params.orderId,
          invoice_id: null,
          international: false,
          method: 'upi',
          amount_refunded: 0,
          refund_status: null,
          captured: true,
          description: `Payment for order ${params.orderId}`,
          card_id: null,
          bank: null,
          wallet: null,
          vpa: 'shopper@upi',
          email: params.email || 'shopper@test.com',
          contact: params.contact || '+919876543210',
          notes: { orderId: params.orderId },
          fee: 200,
          tax: 36,
          error_code: null,
          error_description: null,
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };

  const rawBody = JSON.stringify(payload);
  const signature = generateRazorpayWebhookSignature(rawBody, TEST_WEBHOOK_SECRET);

  return {
    eventId: params.eventId,
    payload,
    rawBody,
    signature,
  };
}

/**
 * Generates a Razorpay `payment.failed` webhook payload.
 */
export function createPaymentFailedPayload(params: {
  eventId: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency?: string;
}): { eventId: string; payload: any; rawBody: string; signature: string } {
  const currency = params.currency || 'INR';
  const amountInPaise = Math.round(params.amount * 100);

  const payload = {
    entity: 'event',
    account_id: 'acc_test123',
    event: 'payment.failed',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: params.paymentId,
          entity: 'payment',
          amount: amountInPaise,
          currency,
          status: 'failed',
          order_id: params.orderId,
          method: 'card',
          captured: false,
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment was declined by issuing bank',
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };

  const rawBody = JSON.stringify(payload);
  const signature = generateRazorpayWebhookSignature(rawBody, TEST_WEBHOOK_SECRET);

  return {
    eventId: params.eventId,
    payload,
    rawBody,
    signature,
  };
}

/**
 * Generates a Razorpay `refund.processed` webhook payload.
 */
export function createRefundProcessedPayload(params: {
  eventId: string;
  orderId: string;
  paymentId: string;
  refundId: string;
  refundAmount: number; // in INR
  currency?: string;
}): { eventId: string; payload: any; rawBody: string; signature: string } {
  const currency = params.currency || 'INR';
  const refundInPaise = Math.round(params.refundAmount * 100);

  const payload = {
    entity: 'event',
    account_id: 'acc_test123',
    event: 'refund.processed',
    contains: ['refund', 'payment'],
    payload: {
      refund: {
        entity: {
          id: params.refundId,
          entity: 'refund',
          amount: refundInPaise,
          currency,
          payment_id: params.paymentId,
          status: 'processed',
          speed_processed: 'normal',
          created_at: Math.floor(Date.now() / 1000),
        },
      },
      payment: {
        entity: {
          id: params.paymentId,
          entity: 'payment',
          amount_refunded: refundInPaise,
          refund_status: 'partial',
          order_id: params.orderId,
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };

  const rawBody = JSON.stringify(payload);
  const signature = generateRazorpayWebhookSignature(rawBody, TEST_WEBHOOK_SECRET);

  return {
    eventId: params.eventId,
    payload,
    rawBody,
    signature,
  };
}
