import { NextRequest, NextResponse } from 'next/server';
import { runPaymentReconciliation } from '@/lib/services/reconciliationWorker';

export const dynamic = 'force-dynamic';

/**
 * Scheduled Cron Job Endpoint for Payment Reconciliation
 * Protected by CRON_SECRET authorization header.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Validate cron authorization token if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    const result = await runPaymentReconciliation();
    return NextResponse.json({ success: true, reconciliation: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reconciliation failed';
    console.error('[Payment Reconciliation Cron Error]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
