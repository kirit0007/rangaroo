'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Truck,
  Mail,
  Phone,
  Building,
  FileText,
  Key,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';
import { useAdminSession } from '@/lib/admin/useAdminSession';

export default function SettingsAdminPage() {
  const siteSettings = useAdminStore((state) => state.siteSettings);
  const updateSiteSettings = useAdminStore((state) => state.updateSiteSettings);
  const { hasPermission, effectiveRole } = useAdminSession();
  const canManageSettings = hasPermission('settings.manage');

  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'tax' | 'policies'>('general');

  const [form, setForm] = useState({
    storeName: 'Rangaroo Store',
    contactEmail: 'hello@rangaroo.store',
    contactPhone: '+91 87936 87379',
    contactLocation: 'Bengaluru, Karnataka, India IN (Shipping Nationwide)',
    registeredBusinessName: 'Rangaroo Crafts & Learning Private Limited',
    standardShippingRate: 50,
    freeShippingThreshold: 499,
    giftWrapFee: 30,
    gstNumber: '29ABCDE1234F1Z5',
    taxRatePercent: 18,
    isTaxInclusive: true,
    razorpayWebhookConfigured: true,
    privacyPolicyUrl: '/privacy',
    termsUrl: '/terms',
    refundPolicyUrl: '/refund',
  });

  useEffect(() => {
    if (siteSettings) {
      setForm((prev) => ({
        ...prev,
        ...siteSettings,
      }));
    }
  }, [siteSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) {
      toast.error(`Permission Denied: Role ${effectiveRole()} cannot modify store settings.`);
      return;
    }

    const toastId = toast.loading('Saving store configurations...');
    try {
      await updateSiteSettings(form);
      toast.success('Store settings synchronized and secured!', { id: toastId });
    } catch {
      toast.error('Failed to update settings', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Store Settings & Security
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Configure business identity, Razorpay gateway status (zero exposed secrets), taxation, and legal disclosures.
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex rounded-xl bg-white border border-stone-200/80 p-1 shadow-2xs">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'general'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'payment'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Payment Gateway
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'tax'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Tax & GST
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'policies'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Policies
          </button>
        </div>
      </div>

      {!canManageSettings && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center space-x-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Read-Only Access:</strong> Modifying store settings and payment gateway configurations requires <code className="font-mono">settings.manage</code> permission (SUPER_ADMIN).
          </span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {activeTab === 'general' && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold font-outfit text-stone-900">
                Business & Contact Profile
              </h2>
              <p className="text-xs text-stone-500">
                Official entity name and primary customer service channels
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Store Brand Name</label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Registered Legal Entity</label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={form.registeredBusinessName}
                  onChange={(e) => setForm({ ...form, registeredBusinessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Official Support Email</label>
                <input
                  type="email"
                  disabled={!canManageSettings}
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-50 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Official Support Phone</label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-50 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">Dispatch Hub Operating Address</label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={form.contactLocation}
                  onChange={(e) => setForm({ ...form, contactLocation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-50"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-outfit text-stone-900">
                  Razorpay Payment Gateway Status
                </h2>
                <p className="text-xs text-stone-500">
                  Zero secrets exposed in frontend code. Keys safely loaded from server environment.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active & Connected
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Security Invariant Alert */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2 text-emerald-900">
                <div className="flex items-center space-x-2 font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Production Security Compliance: Zero Client-Side Secret Leakage</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                  Razorpay Key Secret is never sent to browser clients or stored in the client store. All order creation, signature verification, and automated refunds occur strictly server-side in <code className="font-mono text-emerald-900 bg-white/60 px-1 rounded">/api/razorpay/*</code>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF5EE]/60 border border-stone-200 space-y-1">
                  <span className="text-stone-400 block text-[10px] font-semibold uppercase">Gateway Public Key ID</span>
                  <div className="font-mono font-bold text-stone-800 text-sm">
                    rzp_test_••••••••1829
                  </div>
                  <span className="text-[10px] text-stone-400">Public Identifier only</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF5EE]/60 border border-stone-200 space-y-1">
                  <span className="text-stone-400 block text-[10px] font-semibold uppercase">Webhook Signature Verification</span>
                  <div className="font-mono font-bold text-emerald-700 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>HMAC-SHA256 Active</span>
                  </div>
                  <span className="text-[10px] text-stone-400">Endpoint: /api/razorpay/webhook</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold font-outfit text-stone-900">
                Goods and Services Tax (GST) & Invoicing
              </h2>
              <p className="text-xs text-stone-500">
                Tax configuration applied to orders and itemized invoices
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">GSTIN Identification Number</label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={form.gstNumber}
                  onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Standard GST Rate (%)</label>
                <input
                  type="number"
                  disabled={!canManageSettings}
                  value={form.taxRatePercent}
                  onChange={(e) => setForm({ ...form, taxRatePercent: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-50 font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManageSettings}
                    checked={form.isTaxInclusive}
                    onChange={(e) => setForm({ ...form, isTaxInclusive: e.target.checked })}
                    className="rounded text-[#C85A32] focus:ring-[#C85A32]"
                  />
                  <span className="font-semibold text-stone-800">
                    Product prices displayed in catalog are Inclusive of GST (Recommended for B2C retail)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold font-outfit text-stone-900">
                Store Policies & Legal URLs
              </h2>
              <p className="text-xs text-stone-500">
                Mandatory checkout disclosures required by Razorpay and consumer protection laws
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Terms & Conditions Path</label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={form.termsUrl}
                  onChange={(e) => setForm({ ...form, termsUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-50 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Privacy Policy Path</label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={form.privacyPolicyUrl}
                  onChange={(e) => setForm({ ...form, privacyPolicyUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-50 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Refund & Return Policy Path</label>
                <input
                  type="text"
                  disabled={!canManageSettings}
                  value={form.refundPolicyUrl}
                  onChange={(e) => setForm({ ...form, refundPolicyUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none disabled:bg-stone-50 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        {canManageSettings && (
          <div className="flex items-center justify-end space-x-3">
            <button
              type="submit"
              className="px-6 py-3 bg-[#C85A32] hover:bg-[#B84B24] text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow cursor-pointer flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
