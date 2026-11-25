'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  LayoutTemplate,
  Save,
  Eye,
  Sparkles,
  Smartphone,
  Monitor,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';

export default function CmsAdminPage() {
  const siteSettings = useAdminStore((state) => state.siteSettings);
  const updateSiteSettings = useAdminStore((state) => state.updateSiteSettings);

  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const [cmsForm, setCmsForm] = useState({
    storeName: 'Rangaroo Store',
    announcementText: '🎨 Free Express Shipping on All DIY Paint Kits above ₹499! 🦘',
    heroTitle: 'Where Little Hands Create Big Smiles',
    heroSubtitle:
      'Premium DIY Paint Kits for Kids — Handcrafted Plaster Figurines, Non-Toxic Tempera Colors & Gift-Ready Packaging.',
    heroCtaText: 'Shop All DIY Kits',
    heroSecondaryCtaText: 'Explore Collections',
    promoBannerTitle: 'Handmade with Love in India',
    promoBannerSubtitle: 'Every kit sparks imaginative curiosity and builds essential fine motor coordination.',
    promoBannerImageUrl: '/images/collections/dinosaur.jpg',
    footerTagline: '"Paint. Create. Imagine."',
    footerDescription:
      'Premium DIY Paint Kits for Kids. Sparking creativity and building fine motor skills one canvas at a time. Safe, non-toxic, and endlessly fun!',
    whatsappNumber: '+91 87936 87379',
    instagramHandle: 'ranga.roo',
    instagramUrl: 'https://www.instagram.com/ranga.roo/',
    copyrightText: '© 2026 Rangaroo. Made with ❤️ in India.',
  });

  useEffect(() => {
    if (siteSettings) {
      setCmsForm((prev) => ({
        ...prev,
        ...siteSettings,
      }));
    }
  }, [siteSettings]);

  const handleCmsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Publishing site CMS updates globally...');
    try {
      await updateSiteSettings(cmsForm);
      toast.success('Site content published successfully across all storefronts!', { id: toastId });
    } catch {
      toast.error('Failed to publish settings', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Site CMS & Branding
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Customize announcement bar ticker, homepage hero banner, value proposition messaging, and footer links.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsPreviewDrawerOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Preview Storefront</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleCmsSave} className="space-y-6">
        {/* Section 1: Top Announcement Bar */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-base font-bold font-outfit text-stone-900">
                Top Announcement Bar
              </h2>
              <p className="text-xs text-stone-500">
                Ticker displayed at the very top of every storefront page
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
              Global Header
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Announcement Message
            </label>
            <input
              type="text"
              value={cmsForm.announcementText}
              onChange={(e) => setCmsForm({ ...cmsForm, announcementText: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none text-xs sm:text-sm font-medium"
              placeholder="e.g. 🎨 Free Express Shipping above ₹499! 🦘"
            />
          </div>
        </div>

        {/* Section 2: Homepage Hero Section */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-base font-bold font-outfit text-stone-900">
              Homepage Hero Section
            </h2>
            <p className="text-xs text-stone-500">
              Main headline, value proposition subtitle, and call-to-action buttons
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Main Headline Title
              </label>
              <input
                type="text"
                value={cmsForm.heroTitle}
                onChange={(e) => setCmsForm({ ...cmsForm, heroTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-outfit font-bold text-sm text-stone-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Subtitle & Craft Narrative
              </label>
              <textarea
                rows={3}
                value={cmsForm.heroSubtitle}
                onChange={(e) => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Primary Action Button Text
                </label>
                <input
                  type="text"
                  value={cmsForm.heroCtaText}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroCtaText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Secondary Action Button Text
                </label>
                <input
                  type="text"
                  value={cmsForm.heroSecondaryCtaText}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroSecondaryCtaText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Promotional Value Banner */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-base font-bold font-outfit text-stone-900">
              Middle Promotional Banner
            </h2>
            <p className="text-xs text-stone-500">
              Showcase safe ingredients, non-toxic certifications, and craft highlights
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Banner Headline
              </label>
              <input
                type="text"
                value={cmsForm.promoBannerTitle}
                onChange={(e) => setCmsForm({ ...cmsForm, promoBannerTitle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Banner Background Image URL
              </label>
              <input
                type="text"
                value={cmsForm.promoBannerImageUrl}
                onChange={(e) => setCmsForm({ ...cmsForm, promoBannerImageUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">
                Banner Supporting Narrative
              </label>
              <input
                type="text"
                value={cmsForm.promoBannerSubtitle}
                onChange={(e) => setCmsForm({ ...cmsForm, promoBannerSubtitle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Footer & Contact Links */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-base font-bold font-outfit text-stone-900">
              Footer & Social Brand Links
            </h2>
            <p className="text-xs text-stone-500">
              Official customer support WhatsApp, Instagram handle, and legal tagline
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={cmsForm.footerTagline}
                onChange={(e) => setCmsForm({ ...cmsForm, footerTagline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Customer Support WhatsApp
              </label>
              <input
                type="text"
                value={cmsForm.whatsappNumber}
                onChange={(e) => setCmsForm({ ...cmsForm, whatsappNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Instagram Profile URL
              </label>
              <input
                type="text"
                value={cmsForm.instagramUrl}
                onChange={(e) => setCmsForm({ ...cmsForm, instagramUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Copyright Notice
              </label>
              <input
                type="text"
                value={cmsForm.copyrightText}
                onChange={(e) => setCmsForm({ ...cmsForm, copyrightText: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="submit"
            className="px-6 py-3 bg-[#C85A32] hover:bg-[#B84B24] text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow cursor-pointer flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Publish Site CMS Updates</span>
          </button>
        </div>
      </form>

      {/* Live Storefront Preview Modal / Drawer */}
      {isPreviewDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsPreviewDrawerOpen(false)} />
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95">
            {/* Header controls */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div className="flex items-center space-x-3">
                <span className="font-outfit font-bold text-stone-900 text-sm">
                  Live Storefront Preview
                </span>
                <div className="flex items-center space-x-1 bg-white border border-stone-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-[#C85A32] text-white' : 'text-stone-600'}`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-[#C85A32] text-white' : 'text-stone-600'}`}
                    title="Mobile View"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button onClick={() => setIsPreviewDrawerOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Storefront Frame */}
            <div className="p-6 bg-stone-100 max-h-[70vh] overflow-y-auto flex justify-center">
              <div
                className={`bg-white rounded-2xl shadow-md border border-stone-200 overflow-hidden transition-all ${
                  previewDevice === 'mobile' ? 'w-80' : 'w-full'
                }`}
              >
                {/* Simulated Announcement Bar */}
                <div className="bg-[#C85A32] text-white py-2 px-4 text-center text-xs font-semibold">
                  {cmsForm.announcementText}
                </div>

                {/* Simulated Header */}
                <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#FFF9F2]">
                  <div className="font-outfit font-black text-lg text-stone-900">
                    Rangaroo <span className="text-[#C85A32]">Store</span>
                  </div>
                  <span className="text-xs text-stone-500 font-semibold">Kits • Reviews • About</span>
                </div>

                {/* Simulated Hero */}
                <div className="p-8 bg-[#FAF5EE] text-center space-y-3">
                  <h2 className="text-xl sm:text-2xl font-black font-outfit text-stone-900 leading-tight">
                    {cmsForm.heroTitle}
                  </h2>
                  <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                    {cmsForm.heroSubtitle}
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <button className="px-4 py-2 bg-[#C85A32] text-white text-xs font-bold rounded-xl shadow-xs">
                      {cmsForm.heroCtaText}
                    </button>
                    <button className="px-4 py-2 bg-white text-stone-800 text-xs font-bold rounded-xl border border-stone-200">
                      {cmsForm.heroSecondaryCtaText}
                    </button>
                  </div>
                </div>

                {/* Simulated Promo Banner */}
                <div className="p-6 bg-[#FFF9F2] border-t border-stone-100 text-center">
                  <h3 className="font-outfit font-bold text-stone-900 text-sm">
                    {cmsForm.promoBannerTitle}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                    {cmsForm.promoBannerSubtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
