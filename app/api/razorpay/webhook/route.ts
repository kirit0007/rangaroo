import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

interface RazorpayPaymentEntity {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
}

interface RazorpayOrderEntity {
  id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
}

interface RazorpayRefundEntity {
  id?: string;
  payment_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
}

interface WebhookPayload {
  event?: string;
  id?: string;
  event_id?: string;
  order_id?: string;
  razorpay_order_id?: string;
  payment_id?: string;
  razorpay_payment_id?: string;
  amount?: number;
  currency?: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    order?: { entity?: RazorpayOrderEntity };
    refund?: { entity?: RazorpayRefundEntity };
  };
  refund?: RazorpayRefundEntity;
  [key: string]: unknown;
}

/**
 * Authoritative Razorpay Webhook Endpoint
 * 
 * Invariants & Requirements:
 * 1. Reads raw binary request buffer to eliminate JSON serialization variance.
 * 2. Constant-time HMAC-SHA256 signature verification over raw request buffer.
 * 3. Durable Staging: Inserts event in RECEIVED state immediately upon receipt.
 * 4. Deduplication:
 *    - Status PROCESSED: Returns HTTP 200 Idempotent ACK ({ received: true, deduplicated: true, status: 'already_processed' }).
 *    - Status PROCESSING: Returns HTTP 200 ACK ({ received: true, deduplicated: true, status: 'in_flight' }).
 * 5. State Transition: Transitions event to PROCESSING before business logic execution.
 * 6. Amount & Currency Verification:
 *    - On payment.captured / order.paid: verifies paymentEntity.amount === Math.round(order.total_amount * 100) and currency === 'INR'.
 *    - Rejects underpayment or currency mismatch.
 * 7. Inventory Integration:
 *    - Calls database RPC confirm_order_payment to secure stock and update order atomically.
 *    - Calls confirm_coupon_usage.
 * 8. Safe Failure Handling:
 *    - On payment.failed: Does NOT cancel reservations or void orders prematurely during transient customer retries before reservation TTL has expired.
 *    - Late payment.failed events cannot downgrade an already PAID order.
 * 9. Error Resiliency & Dead-Lettering:
 *    - On handler exception: updates event to RETRYABLE_FAILED, records last_error, sets attempt_count, schedules exponential backoff.
 *    - Transitions to DEAD_LETTER after max retry attempts (>= 5).
 * 10. Success:
 *    - Updates event to PROCESSED with processed_at timestamp.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret) {
    console.error('[Razorpay Webhook Error] Webhook secret is not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const signature = request.headers.get('x-razorpay-signature');
  const eventId = request.headers.get('x-razorpay-event-id');

  if (!signature) {
    return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
  }

  // Read raw binary request body buffer
  const arrayBuffer = await request.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);

  // Constant-time HMAC-SHA256 verification
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBuffer)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const receivedBuf = Buffer.from(signature, 'utf8');

  if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    console.error('[Razorpay Webhook] Signature verification failed');
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBuffer.toString('utf8')) as WebhookPayload;
  } catch (parseErr) {
    console.error('[Razorpay Webhook] Invalid JSON payload:', parseErr);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const eventType = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;
  const orderEntity = payload.payload?.order?.entity;

  const razorpayOrderId =
    paymentEntity?.order_id ||
    orderEntity?.id ||
    payload.order_id ||
    payload.razorpay_order_id;

  const razorpayPaymentId =
    paymentEntity?.id ||
    payload.payment_id ||
    payload.razorpay_payment_id ||
    payload.id;

  const paymentAmount = paymentEntity?.amount ?? payload.amount;
  const paymentCurrency = (paymentEntity?.currency ?? payload.currency ?? 'INR').toUpperCase();

  const finalEventId = eventId || payload.id || payload.event_id || `evt_${crypto.randomUUID()}`;
  const supabase = createServerClient();

  let eventRecordId: string | null = null;
  let currentAttemptCount = 0;

  try {
    // 1. Durable Staging: Insert in RECEIVED state immediately
    if (finalEventId) {
      const { data: insertedEvent, error: insertErr } = await supabase
        .from('razorpay_webhook_events')
        .insert({
          event_id: finalEventId,
          event_type: eventType || 'unknown',
          payload: payload,
          status: 'RECEIVED',
          attempt_count: 0,
          created_at: new Date().toISOString(),
        })
        .select('id, status, attempt_count')
        .single();

      if (insertErr) {
        // Handle duplicate event_id (unique constraint collision)
        const { data: existingEvent } = await supabase
          .from('razorpay_webhook_events')
          .select('id, status, attempt_count')
          .eq('event_id', finalEventId)
          .single();

        if (existingEvent) {
          if (existingEvent.status === 'PROCESSED') {
            // Return 200 Idempotent ACK
            return NextResponse.json(
              { received: true, deduplicated: true, status: 'already_processed' },
              { status: 200 }
            );
          }
          if (existingEvent.status === 'PROCESSING') {
            // Return 200/202 In-flight ACK
            return NextResponse.json(
              { received: true, deduplicated: true, status: 'in_flight' },
              { status: 200 }
            );
          }
          // Retryable failed or received: take over execution
          eventRecordId = existingEvent.id;
          currentAttemptCount = existingEvent.attempt_count || 0;
        } else {
          throw insertErr;
        }
      } else {
        eventRecordId = insertedEvent?.id || null;
        currentAttemptCount = insertedEvent?.attempt_count || 0;
      }
    }

    // 2. Processing State Transition
    if (eventRecordId) {
      currentAttemptCount += 1;
      await supabase
        .from('razorpay_webhook_events')
        .update({
          status: 'PROCESSING',
          attempt_count: currentAttemptCount,
        })
        .eq('id', eventRecordId);
    }

    // 3. Process event business logic
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (razorpayOrderId) {
        // Fetch order to verify state and amounts
        const { data: order } = await supabase
          .from('orders')
          .select('id, order_number, total_amount, payment_status, order_status, razorpay_order_id')
          .or(`razorpay_order_id.eq.${razorpayOrderId},id.eq.${razorpayOrderId},order_number.eq.${razorpayOrderId}`)
          .single();

        if (order) {
          // Verify currency (must be INR)
          if (paymentCurrency && paymentCurrency !== 'INR') {
            console.error(`[Razorpay Webhook] Invalid currency: expected INR, got ${paymentCurrency}`);
            if (eventRecordId) {
              await supabase
                .from('razorpay_webhook_events')
                .update({
                  status: 'DEAD_LETTER',
                  last_error: `Invalid currency: ${paymentCurrency}`,
                })
                .eq('id', eventRecordId);
            }
            return NextResponse.json({ error: 'Payment currency mismatch: Expected INR' }, { status: 400 });
          }

          // Verify amount (must match order total_amount in paise)
          if (paymentAmount !== undefined && paymentAmount !== null && order.total_amount !== null && order.total_amount !== undefined) {
            const expectedPaise = Math.round(Number(order.total_amount) * 100);
            if (paymentAmount !== expectedPaise) {
              console.error(`[Razorpay Webhook] Amount mismatch: expected ${expectedPaise} paise, got ${paymentAmount} paise`);
              if (eventRecordId) {
                await supabase
                  .from('razorpay_webhook_events')
                  .update({
                    status: 'DEAD_LETTER',
                    last_error: `Amount mismatch: expected ${expectedPaise}, got ${paymentAmount}`,
                  })
                  .eq('id', eventRecordId);
              }
              return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
            }
          }

          // Invariant: Do not downgrade an already cancelled order to PROCESSING.
          // confirm_order_payment RPC encapsulates inventory deduction, state transitions,
          // and safe INVENTORY_CONFLICT / CANCELLED status handling.
          const { error: confirmErr } = await supabase.rpc('confirm_order_payment', {
            p_order_id: order.id,
            p_payment_id: razorpayPaymentId || order.id,
            p_razorpay_order_id: razorpayOrderId,
            p_amount: order.total_amount,
            p_currency: 'INR',
          });

          if (confirmErr) {
            throw new Error(`confirm_order_payment RPC failed: ${confirmErr.message}`);
          }

          // Confirm coupon reservation if present
          await supabase.rpc('confirm_coupon_usage', { p_order_id: order.id });
        } else {
          console.warn(`[Razorpay Webhook] Order not found for order reference: ${razorpayOrderId}`);
          if (eventRecordId) {
            await supabase
              .from('razorpay_webhook_events')
              .update({
                status: 'PROCESSED',
                processed_at: new Date().toISOString(),
                last_error: 'Order not found in database',
              })
              .eq('id', eventRecordId);
          }
          return NextResponse.json({
            received: true,
            warning: 'Order not found',
            status: 'PROCESSED',
          }, { status: 200 });
        }
      }
    } else if (eventType === 'payment.failed') {
      if (razorpayOrderId) {
        const { data: order } = await supabase
          .from('orders')
          .select('id, order_number, payment_status, order_status')
          .or(`razorpay_order_id.eq.${razorpayOrderId},id.eq.${razorpayOrderId},order_number.eq.${razorpayOrderId}`)
          .single();

        if (order) {
          // Critical invariant: Cannot downgrade an already PAID order!
          if (order.payment_status === 'paid' || order.payment_status === 'PAID') {
            if (eventRecordId) {
              await supabase
                .from('razorpay_webhook_events')
                .update({
                  status: 'PROCESSED',
                  processed_at: new Date().toISOString(),
                  last_error: null,
                })
                .eq('id', eventRecordId);
            }
            return NextResponse.json({
              received: true,
              status: 'ignored_already_paid',
              message: 'Ignored: Order is already paid',
            }, { status: 200 });
          }

          // Safe Failure Handling:
          // Check if active unexpired reservation exists for this order
          const { data: activeReservations } = await supabase
            .from('inventory_reservations')
            .select('id, expires_at')
            .eq('order_id', order.id)
            .eq('status', 'PENDING')
            .gt('expires_at', new Date().toISOString());

          const hasActiveReservation = activeReservations && activeReservations.length > 0;

          if (hasActiveReservation) {
            // Customer is in transient retry flow: PRESERVE holds until reservation TTL expires
            console.log(`[Razorpay Webhook] Transient payment failure for order ${order.id}. Active hold preserved until ${activeReservations[0].expires_at}`);
          } else {
            // No active hold remains; safely mark order cancelled if not already cancelled
            if (order.order_status !== 'CANCELLED') {
              await supabase
                .from('orders')
                .update({
                  payment_status: 'failed',
                  order_status: 'CANCELLED',
                  status: 'cancelled',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', order.id);

              await supabase.rpc('release_coupon_usage', { p_order_id: order.id });
              await supabase.rpc('cancel_order_reservation', {
                p_order_id: order.id,
                p_reason: 'Payment failed and reservation hold expired',
              });
            }
          }
        }
      }
    } else if (eventType === 'refund.created' || eventType === 'refund.processed') {
      // Safe partial refund handling: partial refunds must never cancel order or restore complete stock
      const refundEntity = payload.payload?.refund?.entity || payload.refund;
      const isPartial =
        refundEntity?.status === 'partial' ||
        (refundEntity?.amount && paymentEntity?.amount && refundEntity.amount < paymentEntity.amount);

      if (!isPartial && razorpayOrderId) {
        const { data: order } = await supabase
          .from('orders')
          .select('id, order_status')
          .or(`razorpay_order_id.eq.${razorpayOrderId},id.eq.${razorpayOrderId}`)
          .single();

        if (order && order.order_status !== 'CANCELLED' && order.order_status !== 'SHIPPED' && order.order_status !== 'DELIVERED') {
          await supabase.rpc('cancel_order_and_restore_inventory', {
            p_order_id: order.id,
            p_reason: 'Full refund processed via webhook',
          });
        }
      }
    }

    // 4. Success: Mark event as PROCESSED
    if (eventRecordId) {
      await supabase
        .from('razorpay_webhook_events')
        .update({
          status: 'PROCESSED',
          processed_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', eventRecordId);
    }

    return NextResponse.json({
      received: true,
      event: eventType,
      status: 'PROCESSED',
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    console.error('[Razorpay Webhook Handler Error]', error);

    // 5. Safe Failure Escalation & Exponential Backoff Scheduling
    if (eventRecordId) {
      const isDeadLetter = currentAttemptCount >= 5;
      const nextStatus = isDeadLetter ? 'DEAD_LETTER' : 'RETRYABLE_FAILED';
      const backoffSeconds = Math.pow(2, Math.min(currentAttemptCount, 6)) * 30;
      const nextRetryAt = isDeadLetter ? null : new Date(Date.now() + backoffSeconds * 1000).toISOString();

      try {
        await supabase
          .from('razorpay_webhook_events')
          .update({
            status: nextStatus,
            attempt_count: currentAttemptCount,
            last_error: message,
            next_retry_at: nextRetryAt,
          })
          .eq('id', eventRecordId);
      } catch (updateErr) {
        console.error('[Razorpay Webhook] Failed to update error state in database:', updateErr);
      }
    }

    return NextResponse.json({
      error: message,
      status: currentAttemptCount >= 5 ? 'DEAD_LETTER' : 'RETRYABLE_FAILED',
    }, { status: 500 });
  }
}
