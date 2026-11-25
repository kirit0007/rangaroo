import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminPermission } from '@/lib/admin/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'audit.read');
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const adminEmail = searchParams.get('adminEmail');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const exportFormat = searchParams.get('export'); // 'csv' or null
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));

    const supabase = createServerClient();

    let query = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (action) {
      query = query.eq('action', action);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (adminEmail) {
      query = query.ilike('admin_email', `%${adminEmail.trim()}%`);
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', new Date(endDate).toISOString());
    }

    // CSV Export: export up to 1000 logs
    if (exportFormat === 'csv') {
      const { data: allLogs, error } = await query.limit(1000);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      let csv = 'Timestamp,Admin ID,Admin Email,Action,Resource Type,Resource ID,Changes,IP Address\n';
      (allLogs || []).forEach((log: any) => {
        const changesStr = log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : '';
        csv += `"${log.created_at}","${log.admin_id || ''}","${log.admin_email}","${log.action}","${log.resource_type}","${log.resource_id}","${changesStr}","${log.ip_address || ''}"\n`;
      });

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="rangaroo-audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: logs, count, error } = await query;

    if (error) {
      console.error('[Audit Logs Query Error]', error);
      return NextResponse.json({
        logs: [],
        pagination: { total: 0, page, limit, totalPages: 1 },
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('[Admin Audit Logs API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
