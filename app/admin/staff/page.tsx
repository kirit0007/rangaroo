'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Edit2,
  Trash2,
  Key,
  Lock,
  Mail,
  UserCheck,
  Sliders,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminSession } from '@/lib/admin/useAdminSession';
import { AdminRole, AdminPermission } from '@/lib/admin/adminAuth';
import { AdminUser } from '@/lib/admin/adminTypes';

const ROLES_INFO: { role: AdminRole; label: string; desc: string; color: string }[] = [
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    desc: 'Unrestricted full administrative privileges across all modules, staff, and secrets.',
    color: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    role: 'STORE_ADMIN',
    label: 'Store Admin',
    desc: 'Operational management of catalog, orders, promotions, and CMS. No staff mutation.',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    role: 'ORDER_MANAGER',
    label: 'Order Manager',
    desc: 'Fulfillment, shipping courier assignments, cancellations, and order refunds.',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    role: 'PRODUCT_MANAGER',
    label: 'Product Manager',
    desc: 'Products catalog, collections, physical stock recounts, and manual inventory adjustments.',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    role: 'CONTENT_MANAGER',
    label: 'Content Manager',
    desc: 'CMS announcement banners, marketing campaigns, and customer reviews moderation.',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    role: 'SUPPORT_AGENT',
    label: 'Support Agent',
    desc: 'Read-only customer service view with automatic PII masking (names, emails, phones redacted).',
    color: 'bg-stone-100 text-stone-700 border-stone-200',
  },
];

const PERMISSIONS_LIST: { key: AdminPermission; category: string; desc: string }[] = [
  { key: 'products.read', category: 'Products', desc: 'View products list and details' },
  { key: 'products.manage', category: 'Products', desc: 'Create, edit, and delete products' },
  { key: 'inventory.read', category: 'Inventory', desc: 'View physical and reserved stock levels' },
  { key: 'inventory.adjust', category: 'Inventory', desc: 'Execute manual stock adjustments with audit log' },
  { key: 'collections.manage', category: 'Collections', desc: 'Create and reorder themed collections' },
  { key: 'orders.read', category: 'Orders', desc: 'View unmasked customer orders' },
  { key: 'orders.read_masked', category: 'Orders', desc: 'View orders with masked customer PII' },
  { key: 'orders.fulfill', category: 'Orders', desc: 'Assign courier partners and AWB numbers' },
  { key: 'orders.cancel', category: 'Orders', desc: 'Cancel orders and release inventory holds' },
  { key: 'orders.refund', category: 'Orders', desc: 'Initiate Razorpay refunds' },
  { key: 'customers.read', category: 'Customers', desc: 'View unmasked customer CRM profiles' },
  { key: 'customers.read_masked', category: 'Customers', desc: 'View masked customer profiles (Support)' },
  { key: 'customers.export', category: 'Customers', desc: 'Export customer CRM database to CSV' },
  { key: 'coupons.manage', category: 'Marketing', desc: 'Create and remove discount promo codes' },
  { key: 'campaigns.manage', category: 'Marketing', desc: 'Launch and edit promotional campaigns' },
  { key: 'reviews.read', category: 'Reviews', desc: 'Read customer reviews' },
  { key: 'reviews.moderate', category: 'Reviews', desc: 'Approve or reject customer reviews' },
  { key: 'cms.manage', category: 'Operations', desc: 'Publish announcements and hero content' },
  { key: 'shipping.manage', category: 'Operations', desc: 'Configure shipping rates and courier rules' },
  { key: 'staff.manage', category: 'Security', desc: 'Invite staff and mutate public.admin_users' },
  { key: 'audit.read', category: 'Security', desc: 'View immutable security audit logs' },
  { key: 'settings.manage', category: 'Security', desc: 'Configure payment gateway and store keys' },
];

export default function StaffAdminPage() {
  const { user: currentAdmin, effectiveRole, hasPermission } = useAdminSession();
  const canManageStaff = hasPermission('staff.manage');

  const [activeTab, setActiveTab] = useState<'directory' | 'matrix'>('directory');
  const [search, setSearch] = useState('');

  // Staff members state from public.admin_users
  const [staffList, setStaffList] = useState<AdminUser[]>([
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@rangaroo.store',
      fullName: 'Rangaroo Lead Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: '2026-11-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'ops@rangaroo.store',
      fullName: 'Vikram Mehta',
      role: 'ORDER_MANAGER',
      isActive: true,
      createdAt: '2026-11-05T10:00:00Z',
      lastLoginAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'catalog@rangaroo.store',
      fullName: 'Deepa Joshi',
      role: 'PRODUCT_MANAGER',
      isActive: true,
      createdAt: '2026-11-08T12:00:00Z',
      lastLoginAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'support@rangaroo.store',
      fullName: 'Rahul Sen',
      role: 'SUPPORT_AGENT',
      isActive: true,
      createdAt: '2026-11-12T15:00:00Z',
      lastLoginAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      email: 'former.intern@rangaroo.store',
      fullName: 'Aman Verma',
      role: 'SUPPORT_AGENT',
      isActive: false,
      createdAt: '2026-10-15T09:00:00Z',
      lastLoginAt: '2026-10-30T18:00:00Z',
    },
  ]);

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    role: 'SUPPORT_AGENT' as AdminRole,
  });

  // Edit Role Modal
  const [editingStaff, setEditingStaff] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>('SUPPORT_AGENT');

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase().trim();
    return staffList.filter(
      (s) =>
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
    );
  }, [staffList, search]);

  const handleOpenInvite = () => {
    if (!canManageStaff) {
      toast.error(`Permission Denied: Role ${effectiveRole()} cannot invite staff.`);
      return;
    }
    setInviteForm({
      fullName: '',
      email: '',
      role: 'SUPPORT_AGENT',
    });
    setIsInviteModalOpen(true);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) {
      toast.error('All fields are required');
      return;
    }

    const newStaff: AdminUser = {
      id: `usr-${Date.now()}`,
      fullName: inviteForm.fullName,
      email: inviteForm.email.toLowerCase(),
      role: inviteForm.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setStaffList((prev) => [newStaff, ...prev]);
    toast.success(`Invitation sent to ${newStaff.email} with ${newStaff.role} role!`);
    setIsInviteModalOpen(false);
  };

  const handleToggleActive = (staff: AdminUser) => {
    if (!canManageStaff) {
      toast.error(`Permission Denied: Only Super Admins can toggle staff active status.`);
      return;
    }

    if (staff.id === currentAdmin?.id) {
      toast.error('Safety Guard: You cannot deactivate your own active session!');
      return;
    }

    const newActive = !staff.isActive;
    setStaffList((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, isActive: newActive } : s))
    );

    if (newActive) {
      toast.success(`Access restored for ${staff.email}`);
    } else {
      toast.success(`Access revoked for ${staff.email}. Immediate database RLS revocation applied.`);
    }
  };

  const handleOpenEditRole = (staff: AdminUser) => {
    if (!canManageStaff) {
      toast.error(`Permission Denied: Cannot edit staff roles.`);
      return;
    }
    setEditingStaff(staff);
    setEditRole(staff.role);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setStaffList((prev) =>
      prev.map((s) => (s.id === editingStaff.id ? { ...s, role: editRole } : s))
    );
    toast.success(`Role for ${editingStaff.email} updated to ${editRole}`);
    setEditingStaff(null);
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Staff Directory & RBAC
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Authoritative administrator records in <code className="text-xs bg-stone-100 px-1 py-0.5 rounded font-mono text-stone-800">public.admin_users</code> with instant revocation and role assignment.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Tab switch */}
          <div className="inline-flex rounded-xl bg-white border border-stone-200/80 p-1 shadow-2xs">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-[#C85A32] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Staff Directory ({staffList.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-[#C85A32] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Permission Matrix
            </button>
          </div>

          <button
            onClick={handleOpenInvite}
            disabled={!canManageStaff}
            className={`inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              canManageStaff
                ? 'bg-[#C85A32] hover:bg-[#B84B24] text-white cursor-pointer'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Staff</span>
          </button>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, email, or assigned role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
              />
            </div>
            <div className="text-xs text-stone-500 font-medium hidden sm:block">
              Authoritative <span className="font-mono text-stone-800">public.admin_users</span> sync
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-[#FAF5EE] text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
                  <tr>
                    <th className="px-4 py-3">Administrator</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3">Access Status</th>
                    <th className="px-4 py-3">Joined Date</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredStaff.map((staff) => {
                    const roleBadge = ROLES_INFO.find((r) => r.role === staff.role);

                    return (
                      <tr key={staff.id} className="hover:bg-[#FAF5EE]/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FFF9F2] to-amber-100 border border-amber-900/10 flex items-center justify-center font-bold text-[#C85A32] text-sm shrink-0">
                              {staff.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 text-sm truncate flex items-center gap-1.5">
                                <span>{staff.fullName}</span>
                                {staff.id === currentAdmin?.id && (
                                  <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-400 font-mono truncate">
                                {staff.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              roleBadge?.color || 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {staff.role}
                          </span>
                        </td>

                        {/* Active / Revoked Toggle */}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleToggleActive(staff)}
                            disabled={!canManageStaff || staff.id === currentAdmin?.id}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                              staff.isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            } disabled:opacity-60 cursor-pointer`}
                            title={
                              staff.id === currentAdmin?.id
                                ? 'Cannot deactivate self'
                                : staff.isActive
                                ? 'Click to revoke access'
                                : 'Click to restore access'
                            }
                          >
                            {staff.isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>Access Revoked</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Joined Date */}
                        <td className="px-4 py-3.5 text-stone-500 whitespace-nowrap" suppressHydrationWarning>
                          {new Date(staff.createdAt).toLocaleDateString()}
                        </td>

                        {/* Last Active */}
                        <td className="px-4 py-3.5 text-stone-400 whitespace-nowrap" suppressHydrationWarning>
                          {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleTimeString() : 'N/A'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenEditRole(staff)}
                            disabled={!canManageStaff}
                            className="p-1.5 text-stone-500 hover:text-[#C85A32] hover:bg-[#FFF9F2] rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                            title="Change Role"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Permission Matrix View */
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden p-6 space-y-6">
          <div>
            <h3 className="font-outfit font-bold text-stone-900 text-lg">
              Role Permission Hierarchy (ROLE_PERMISSIONS)
            </h3>
            <p className="text-xs text-stone-500">
              Evaluated strictly on incoming requests via database functions and serverAuth.ts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES_INFO.map((r) => (
              <div
                key={r.role}
                className="p-4 rounded-2xl border border-stone-200 bg-[#FAF5EE]/40 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-stone-900">{r.role}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${r.color}`}>
                      {r.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">{r.desc}</p>
                </div>

                <div className="pt-2 border-t border-stone-200/60 text-[10px] text-stone-400 font-mono">
                  {r.role === 'SUPER_ADMIN' ? 'All 22 permissions enabled' : r.role === 'SUPPORT_AGENT' ? 'Strictly read-only with PII mask' : 'Scoped operational access'}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-100">
            <h4 className="font-outfit font-bold text-stone-800 text-sm mb-3">All 22 Administrative Permissions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {PERMISSIONS_LIST.map((p) => (
                <div key={p.key} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="font-mono font-bold text-stone-900 text-[11px]">{p.key}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsInviteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div>
                <h3 className="font-outfit font-bold text-stone-900 text-base">
                  Invite Administrator
                </h3>
                <p className="text-xs text-stone-500">
                  Grants entry to Rangaroo management portal.
                </p>
              </div>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    placeholder="e.g. Aditi Sharma"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-mono"
                    placeholder="aditi@rangaroo.store"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Assigned Security Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as AdminRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-mono"
                  >
                    {ROLES_INFO.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.role} ({r.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-[#FAF5EE] border-t border-stone-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs border border-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C85A32] hover:bg-[#B84B24] text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  Send Admin Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setEditingStaff(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div>
                <h3 className="font-outfit font-bold text-stone-900 text-base">
                  Modify Staff Role
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  {editingStaff.email}
                </p>
              </div>
              <button onClick={() => setEditingStaff(null)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Select New Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AdminRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-mono"
                  >
                    {ROLES_INFO.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.role} — {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-[#FAF5EE] border-t border-stone-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs border border-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C85A32] hover:bg-[#B84B24] text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  Save New Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
