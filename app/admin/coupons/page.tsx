'use client';

import { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Percent,
  Coins,
  X,
  TrendingUp,
  AlertCircle,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';
import { useAdminSession } from '@/lib/admin/useAdminSession';
import { Coupon } from '@/types';

interface ExtendedCoupon extends Coupon {
  id?: string;
  isActive?: boolean;
  usageCount?: number;
  totalSavingsGenerated?: number;
  expiresAt?: string;
  usageLimit?: number;
}

export default function CouponsAdminPage() {
  const coupons = useAdminStore((state) => state.coupons);
  const addCoupon = useAdminStore((state) => state.addCoupon);
  const removeCoupon = useAdminStore((state) => state.removeCoupon);
  const { hasPermission, effectiveRole } = useAdminSession();
  const canManage = hasPermission('coupons.manage');

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<ExtendedCoupon | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState<string | null>(null);

  // Enriched coupon list with mock usage analytics
  const enrichedCoupons: ExtendedCoupon[] = useMemo(() => {
    return coupons.map((c, idx) => ({
      ...c,
      isActive: true,
      usageCount: 42 + idx * 18,
      totalSavingsGenerated: (42 + idx * 18) * (c.discountType === 'fixed' ? c.discountValue : 85),
      expiresAt: '2026-12-31',
      usageLimit: 500,
    }));
  }, [coupons]);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 15,
    minOrderAmount: 299,
    maxDiscountAmount: 150,
    usageLimit: 500,
    expiresAt: '2026-12-31',
    isActive: true,
  });

  const filteredCoupons = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enrichedCoupons.filter((c) => !q || c.code.toLowerCase().includes(q));
  }, [enrichedCoupons, search]);

  const handleOpenAdd = () => {
    if (!canManage) {
      toast.error(`Permission Denied: ${effectiveRole()} cannot manage coupons.`);
      return;
    }
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 299,
      maxDiscountAmount: 150,
      usageLimit: 500,
      expiresAt: '2026-12-31',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ExtendedCoupon) => {
    if (!canManage) {
      toast.error(`Permission Denied: ${effectiveRole()} cannot manage coupons.`);
      return;
    }
    setEditingCoupon(c);
    setFormData({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount || 0,
      maxDiscountAmount: c.maxDiscountAmount || 0,
      usageLimit: c.usageLimit || 500,
      expiresAt: c.expiresAt || '2026-12-31',
      isActive: c.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Promo code is required');
      return;
    }

    const cleanCode = formData.code.trim().toUpperCase();

    try {
      await addCoupon({
        code: cleanCode,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount) || undefined,
        maxDiscountAmount:
          formData.discountType === 'percentage' && formData.maxDiscountAmount
            ? Number(formData.maxDiscountAmount)
            : undefined,
      });

      toast.success(`Coupon ${cleanCode} active and synchronized!`);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (code: string) => {
    try {
      await removeCoupon(code);
      setDeleteConfirmCode(null);
      toast.success(`Coupon ${code} deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete coupon');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code} to clipboard!`);
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Coupons & Discounts
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Configure promotional discount codes, minimum basket thresholds, usage caps, and redemption velocity.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={!canManage}
          className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
            canManage
              ? 'bg-[#C85A32] hover:bg-[#B84B24] text-white cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Code</span>
          <span className="sr-only">Add Coupon</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupons by code name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32] uppercase font-mono"
          />
        </div>
        <div className="text-xs text-stone-500 font-medium hidden sm:block">
          {filteredCoupons.length} active coupons
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#FAF5EE] text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3">Promo Code</th>
                <th className="px-4 py-3">Discount Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Max Cap</th>
                <th className="px-4 py-3 text-center">Usage Stats</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCoupons.map((c) => {
                const isPercentage = c.discountType === 'percentage';

                return (
                  <tr key={c.code} className="hover:bg-[#FAF5EE]/40 transition-colors">
                    {/* Code */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                          {c.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(c.code)}
                          className="p-1 text-stone-400 hover:text-stone-700"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center space-x-1 font-semibold text-stone-700">
                        {isPercentage ? (
                          <>
                            <Percent className="w-3.5 h-3.5 text-[#C85A32]" />
                            <span>Percentage</span>
                          </>
                        ) : (
                          <>
                            <Coins className="w-3.5 h-3.5 text-amber-600" />
                            <span>Fixed Cash</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3.5 font-bold font-outfit text-stone-900 text-sm">
                      {isPercentage ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                    </td>

                    {/* Min Order */}
                    <td className="px-4 py-3.5 text-stone-600 font-mono">
                      {c.minOrderAmount ? `₹${c.minOrderAmount}` : 'No Min'}
                    </td>

                    {/* Max Discount Cap */}
                    <td className="px-4 py-3.5 text-stone-600 font-mono">
                      {c.maxDiscountAmount ? `₹${c.maxDiscountAmount}` : 'No Limit'}
                    </td>

                    {/* Usage Stats */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="font-semibold text-stone-800">{c.usageCount} used</div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        ₹{c.totalSavingsGenerated?.toLocaleString()} saved
                      </div>
                    </td>

                    {/* Active Status */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          disabled={!canManage}
                          className="p-1.5 text-stone-500 hover:text-[#C85A32] hover:bg-[#FFF9F2] rounded-lg transition-colors disabled:opacity-30"
                          title="Edit Coupon"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmCode(c.code)}
                          disabled={!canManage}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCoupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No promotional coupons found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div>
                <h3 className="font-outfit font-bold text-stone-900 text-base">
                  {editingCoupon ? 'Edit Discount Coupon' : 'Add Discount Coupon'}
                </h3>
                <p className="text-xs text-stone-500">
                  Enforces deterministic reservation holds during checkout.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none uppercase font-mono font-bold text-sm"
                    placeholder="e.g. ROOFUN15"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Discount Value</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Max Cap Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      disabled={formData.discountType === 'fixed'}
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Total Usage Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#FAF5EE] border-t border-stone-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs border border-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C85A32] hover:bg-[#B84B24] text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setDeleteConfirmCode(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-stone-200 p-5 z-10 text-xs font-body animate-in fade-in-0 zoom-in-95">
            <h4 className="font-outfit font-bold text-stone-900 text-base mb-1">Delete Coupon</h4>
            <p className="text-stone-500 mb-4">
              Are you sure you want to deactivate and delete coupon <strong>{deleteConfirmCode}</strong>? Existing cart holds will be invalidated.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmCode(null)}
                className="px-3 py-1.5 bg-stone-100 text-stone-700 font-semibold rounded-lg hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmCode)}
                className="px-3 py-1.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
