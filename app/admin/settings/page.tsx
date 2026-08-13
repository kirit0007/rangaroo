'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';

export default function SettingsAdminPage() {
  const siteSettings = useAdminStore((state) => state.siteSettings);
  const updateSiteSettings = useAdminStore((state) => state.updateSiteSettings);

  const [settingsForm, setSettingsForm] = useState<any>({
    storeName: 'Rangaroo Store',
    contactEmail: 'hello@rangaroo.store',
    contactPhone: '+91 87936 87379',
    standardShippingRate: 50,
    freeShippingThreshold: 499,
  });

  useEffect(() => {
    if (siteSettings) {
      setSettingsForm((prev: any) => ({
        ...prev,
        ...siteSettings,
      }));
    }
  }, [siteSettings]);

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Updating store settings...');
    try {
      await updateSiteSettings(settingsForm);
      toast.success('Store settings updated successfully!', { id: toastId });
    } catch (_err) {
      toast.error('Failed to update settings', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold font-outfit text-gray-800">Store Settings</h1>
        <p className="text-sm text-gray-500">Configure store branding, shipping rates, and checkout rules.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSettingsSave} className="space-y-8">
          
          {/* General Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">General Information</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                <input
                  type="text"
                  value={settingsForm.storeName || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={settingsForm.contactEmail || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input
                    type="text"
                    value={settingsForm.contactPhone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Settings */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Shipping & Fulfillment Rates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Standard Shipping Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={settingsForm.standardShippingRate || 0}
                  onChange={(e) => setSettingsForm({ ...settingsForm, standardShippingRate: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={settingsForm.freeShippingThreshold || 0}
                  onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button type="submit" className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md cursor-pointer">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
