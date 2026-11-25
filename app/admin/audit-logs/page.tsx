'use client';

import { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  ShieldCheck,
  Calendar,
  User,
  Sliders,
  X,
  FileCode,
  ArrowRight,
  Database,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuditLogEntry } from '@/lib/admin/adminTypes';

export default function AuditLogsAdminPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([
    {
      id: 'aud-1',
      adminId: '00000000-0000-0000-0000-000000000001',
      adminEmail: 'admin@rangaroo.store',
      adminRole: 'SUPER_ADMIN',
      action: 'inventory.adjust',
      resourceType: 'product',
      resourceId: 'kit-1',
      changes: {
        before: { stockQuantity: 15, physicalStock: 15 },
        after: { stockQuantity: 40, physicalStock: 40, reason: 'Physical Count Audit' },
      },
      ipAddress: '103.21.244.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'aud-2',
      adminId: '00000000-0000-0000-0000-000000000002',
      adminEmail: 'ops@rangaroo.store',
      adminRole: 'ORDER_MANAGER',
      action: 'order.fulfill',
      resourceType: 'order',
      resourceId: 'ORD-2026-9021',
      changes: {
        before: { status: 'confirmed', courierName: null, trackingNumber: null },
        after: { status: 'shipped', courierName: 'Delhivery Express', trackingNumber: 'AWB-89217392' },
      },
      ipAddress: '115.112.82.4',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'aud-3',
      adminId: '00000000-0000-0000-0000-000000000001',
      adminEmail: 'admin@rangaroo.store',
      adminRole: 'SUPER_ADMIN',
      action: 'staff.deactivate',
      resourceType: 'admin_user',
      resourceId: '00000000-0000-0000-0000-000000000005',
      changes: {
        before: { isActive: true, email: 'former.intern@rangaroo.store' },
        after: { isActive: false, revokedAt: new Date().toISOString() },
      },
      ipAddress: '103.21.244.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: 'aud-4',
      adminId: '00000000-0000-0000-0000-000000000003',
      adminEmail: 'catalog@rangaroo.store',
      adminRole: 'PRODUCT_MANAGER',
      action: 'product.update',
      resourceType: 'product',
      resourceId: 'kit-2',
      changes: {
        before: { price: 299, compareAtPrice: 399 },
        after: { price: 249, compareAtPrice: 349 },
      },
      ipAddress: '49.207.218.90',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'aud-5',
      adminId: '00000000-0000-0000-0000-000000000001',
      adminEmail: 'admin@rangaroo.store',
      adminRole: 'SUPER_ADMIN',
      action: 'settings.update',
      resourceType: 'settings',
      resourceId: 'site_settings',
      changes: {
        before: { freeShippingThreshold: 599 },
        after: { freeShippingThreshold: 499 },
      },
      ipAddress: '103.21.244.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ]);

  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase().trim();
      const inSearch =
        !q ||
        log.adminEmail.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.resourceId.toLowerCase().includes(q) ||
        log.resourceType.toLowerCase().includes(q);

      const inResource = resourceFilter === 'ALL' || log.resourceType === resourceFilter;

      return inSearch && inResource;
    });
  }, [logs, search, resourceFilter]);

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Admin Email', 'Role', 'Action', 'Resource Type', 'Resource ID', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${new Date(l.createdAt).toLocaleString()}"`,
      l.adminEmail,
      l.adminRole,
      l.action,
      l.resourceType,
      l.resourceId,
      l.ipAddress || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rangaroo_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Audit log export generated successfully!');
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Security Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Immutable log stored in <code className="text-xs bg-stone-100 px-1 py-0.5 rounded font-mono text-stone-800">public.admin_audit_logs</code>. UPDATE and DELETE actions strictly rejected at database level.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by admin email, action name, or resource ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-stone-500 font-semibold uppercase font-outfit">Resource:</span>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
          >
            <option value="ALL">All Resources ({logs.length})</option>
            <option value="product">Product Catalog</option>
            <option value="order">Order Processing</option>
            <option value="admin_user">Staff Administration</option>
            <option value="settings">Store Configuration</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#FAF5EE] text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource Target</th>
                <th className="px-4 py-3 font-mono">IP Address</th>
                <th className="px-4 py-3 text-right">Diff Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLogs.map((log) => {
                return (
                  <tr key={log.id} className="hover:bg-[#FAF5EE]/40 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3.5 text-stone-500 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    {/* Admin Email & Role */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-stone-900">{log.adminEmail}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{log.adminRole}</div>
                    </td>

                    {/* Action Code */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-stone-100 text-stone-800 border border-stone-200">
                        {log.action}
                      </span>
                    </td>

                    {/* Resource Type & ID */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-stone-800 capitalize">
                        {log.resourceType.replace('_', ' ')}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono truncate max-w-xs">
                        ID: {log.resourceId}
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="px-4 py-3.5 font-mono text-stone-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    {/* Diff Inspection */}
                    <td className="px-4 py-3.5 text-right">
                      {log.changes ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-[#FFF9F2] text-[#C85A32] border border-[#C85A32]/30 rounded-lg hover:bg-[#FAF5EE] transition-colors cursor-pointer"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>View Diff</span>
                        </button>
                      ) : (
                        <span className="text-stone-300 text-[11px]">No changes</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No audit entries matching filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Before / After Diff Dialog Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setSelectedLog(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div>
                <h3 className="font-outfit font-bold text-stone-900 text-base">
                  Audit Diff Inspection
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  {selectedLog.action} on {selectedLog.resourceType} ({selectedLog.resourceId})
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 space-y-1">
                <div>Actor: <strong className="text-stone-900">{selectedLog.adminEmail}</strong> ({selectedLog.adminRole})</div>
                <div>Recorded: <strong className="text-stone-900">{new Date(selectedLog.createdAt).toLocaleString()}</strong></div>
                <div>Network IP: <strong className="text-stone-900">{selectedLog.ipAddress}</strong></div>
              </div>

              {/* Side by Side Diff Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Before */}
                <div className="p-3.5 rounded-2xl bg-red-50/50 border border-red-200 space-y-2">
                  <div className="font-bold text-red-800 uppercase text-[10px] font-outfit">
                    Previous State (Before)
                  </div>
                  <pre className="p-3 bg-white rounded-xl border border-red-100 text-[11px] text-stone-800 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.changes?.before || {}, null, 2)}
                  </pre>
                </div>

                {/* After */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-800 uppercase text-[10px] font-outfit">
                    Updated State (After)
                  </div>
                  <pre className="p-3 bg-white rounded-xl border border-emerald-100 text-[11px] text-stone-800 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.changes?.after || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF5EE] border-t border-stone-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#C85A32] text-white font-semibold rounded-xl text-xs hover:bg-[#B84B24]"
              >
                Close Diff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
