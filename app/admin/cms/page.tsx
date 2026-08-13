'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';

export default function CmsAdminPage() {
  const siteSettings = useAdminStore((state) => state.siteSettings);
  const updateSiteSettings = useAdminStore((state) => state.updateSiteSettings);

  const [cmsForm, setCmsForm] = useState<any>({
    storeName: 'Rangaroo Store',
    announcementText: '🎨 Free Express Shipping above ₹499! 🦘',
    heroTitle: '',
    heroSubtitle: '',
    footerTagline: '"Paint. Create. Imagine."',
    footerDescription: '',
    contactLocation: '',
    whatsappNumber: '',
    instagramHandle: '',
    instagramUrl: '',
    contactPhone: '+91 87936 87379',
    contactEmail: 'hello@rangaroo.store',
    standardShippingRate: 50,
    freeShippingThreshold: 499,
    copyrightText: '© 2026 Rangaroo. Made with ❤️ in India.',
  });

  useEffect(() => {
    if (siteSettings) {
      setCmsForm((prev: any) => ({
        ...prev,
        ...siteSettings,
      }));
    }
  }, [siteSettings]);

  const handleCmsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Publishing site settings globally...');
    try {
      await updateSiteSettings(cmsForm);
      toast.success('Site settings published globally across all devices!', { id: toastId });
    } catch (_err) {
      toast.error('Failed to publish settings', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-outfit text-gray-800">Site CMS & Branding</h1>

      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 max-w-4xl">
        <form onSubmit={handleCmsSave} className="space-y-8">
          
          {/* Announcement Bar */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Top Banner Announcement</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Text</label>
              <input
                type="text"
                value={cmsForm.announcementText || ''}
                onChange={(e) => setCmsForm({ ...cmsForm, announcementText: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="🎨 Free Express Shipping above ₹499! 🦘"
              />
            </div>
          </div>

          {/* Hero Banner CMS */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Homepage Hero Section</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hero Main Headline</label>
                <input
                  type="text"
                  value={cmsForm.heroTitle || ''}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroTitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Unleash Creativity with Handmade DIY Kits"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subtitle</label>
                <textarea
                  rows={2}
                  value={cmsForm.heroSubtitle || ''}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Hand-crafted plaster figurines, rich tempera paints, and endless imaginative fun for kids & adults."
                />
              </div>
            </div>
          </div>

          {/* Footer & Social Contacts */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Footer & Contact Links</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Footer Tagline</label>
                  <input
                    type="text"
                    value={cmsForm.footerTagline || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, footerTagline: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder='"Paint. Create. Imagine."'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location / Address</label>
                  <input
                    type="text"
                    value={cmsForm.contactLocation || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, contactLocation: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Mumbai, India"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Handle</label>
                  <input
                    type="text"
                    value={cmsForm.instagramHandle || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, instagramHandle: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="ranga.roo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Direct URL</label>
                  <input
                    type="text"
                    value={cmsForm.instagramUrl || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, instagramUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://www.instagram.com/ranga.roo/"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Line</label>
                <input
                  type="text"
                  value={cmsForm.copyrightText || ''}
                  onChange={(e) => setCmsForm({ ...cmsForm, copyrightText: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="© 2026 Rangaroo. Made with ❤️ in India."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button type="submit" className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all cursor-pointer">
              Save CMS Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
