'use client';

import { useState } from 'react';
import { Tag, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';

export default function CouponsAdminPage() {
  const coupons = useAdminStore((state) => state.coupons);
  const addCoupon = useAdminStore((state) => state.addCoupon);
  const removeCoupon = useAdminStore((state) => state.removeCoupon);

  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0
  });

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    
    try {
      await addCoupon({
        code: couponForm.code,
        discountType: couponForm.discountType,
        discountValue: couponForm.discountValue,
        minOrderAmount: couponForm.minOrderAmount,
        maxDiscountAmount: couponForm.discountType === 'percentage' ? couponForm.maxDiscountAmount : undefined,
      });
      
      setCouponForm({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscountAmount: 0
      });
      toast.success('Coupon added & synchronized globally!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add coupon');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold font-outfit text-gray-800">Coupons & Discounts</h1>
        <p className="text-sm text-gray-500">Create promotional promo codes for discount checkouts.</p>
      </div>

      {/* Add Coupon Form */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-orange-500" />
          Create New Promo Code
        </h3>
        
        <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Coupon Code</label>
            <input
              type="text"
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none uppercase font-mono font-bold"
              placeholder="e.g. ROOFUN10"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Discount Type</label>
            <select
              value={couponForm.discountType}
              onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as 'percentage' | 'fixed' })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Discount Value</label>
            <input
              type="number"
              min="1"
              value={couponForm.discountValue || ''}
              onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              placeholder={couponForm.discountType === 'percentage' ? '15' : '100'}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Min Order Amount (₹)</label>
            <input
              type="number"
              min="0"
              value={couponForm.minOrderAmount || ''}
              onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              placeholder="499"
            />
          </div>

          {couponForm.discountType === 'percentage' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max Discount Cap (₹)</label>
              <input
                type="number"
                min="0"
                value={couponForm.maxDiscountAmount || ''}
                onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                placeholder="200 (Optional)"
              />
            </div>
          )}

          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Add Coupon
            </button>
          </div>
        </form>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 font-outfit">Active Coupons</h3>
          <span className="text-xs text-gray-500 font-semibold">{coupons.length} available</span>
        </div>

        <div className="divide-y divide-gray-100">
          {coupons.map((coupon) => (
            <div key={coupon.code} className="p-4 sm:p-6 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                  <Tag size={20} />
                </div>
                <div>
                  <div className="font-mono font-bold text-gray-900 text-lg flex items-center gap-2">
                    {coupon.code}
                    <span className="text-xs font-sans px-2 py-0.5 bg-green-100 text-green-700 rounded-md font-semibold">Active</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                    {coupon.minOrderAmount ? ` • Min Order: ₹${coupon.minOrderAmount}` : ''}
                    {coupon.maxDiscountAmount ? ` • Max Cap: ₹${coupon.maxDiscountAmount}` : ''}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm(`Remove coupon ${coupon.code}?`)) {
                    removeCoupon(coupon.code);
                    toast.success('Coupon removed');
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {coupons.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <Tag size={36} className="mx-auto mb-2 opacity-50" />
              <p>No active coupons. Create one above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
