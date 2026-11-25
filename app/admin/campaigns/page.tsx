'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Megaphone,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  Tag,
  ArrowRight,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { products as initialProducts } from '@/data/products';
import { Campaign } from '@/lib/admin/adminTypes';

export default function CampaignsAdminPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: 'camp-1',
      name: 'Summer Creative Craft Fiesta',
      code: 'SUMMER25',
      discountType: 'percentage',
      discountValue: 25,
      startDate: '2026-06-01',
      endDate: '2026-07-15',
      bannerUrl: '/images/collections/dinosaur.jpg',
      bannerTitle: 'Unleash Your Little Explorer!',
      bannerSubtitle: 'Get 25% OFF all DIY Dinosaur & Wildlife Paint Kits this season.',
      isActive: true,
      productIds: [initialProducts[0]?.id || 'kit-1'],
      clicksCount: 1420,
      conversionsCount: 184,
      totalRevenueGenerated: 45800,
    },
    {
      id: 'camp-2',
      name: 'Weekend Birthday Bash Bundle',
      code: 'PARTY50',
      discountType: 'fixed',
      discountValue: 100,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      bannerUrl: '/images/collections/space.jpg',
      bannerTitle: 'Cosmic Party Packs for Kids',
      bannerSubtitle: 'Flat ₹100 OFF bulk orders of 5+ painting kits.',
      isActive: false,
      productIds: [initialProducts[1]?.id || 'kit-2'],
      clicksCount: 890,
      conversionsCount: 92,
      totalRevenueGenerated: 23400,
    },
  ]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 20,
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    bannerUrl: '/images/collections/dinosaur.jpg',
    bannerTitle: 'Festive Holiday Paint Kits',
    bannerSubtitle: 'Safe, non-toxic fun for the whole family.',
    isActive: true,
    productIds: [] as string[],
  });

  const filteredCampaigns = useMemo(() => {
    const q = search.toLowerCase().trim();
    return campaigns.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  const handleOpenAdd = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      code: '',
      discountType: 'percentage',
      discountValue: 20,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      bannerUrl: '/images/collections/space.jpg',
      bannerTitle: 'Explore the Cosmic Craft World',
      bannerSubtitle: 'Limited-time special discounts across all space craft kits.',
      isActive: true,
      productIds: initialProducts.slice(0, 3).map((p) => p.id),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (camp: Campaign) => {
    setEditingCampaign(camp);
    setFormData({
      name: camp.name,
      code: camp.code,
      discountType: camp.discountType,
      discountValue: camp.discountValue,
      startDate: camp.startDate,
      endDate: camp.endDate,
      bannerUrl: camp.bannerUrl,
      bannerTitle: camp.bannerTitle || '',
      bannerSubtitle: camp.bannerSubtitle || '',
      isActive: camp.isActive,
      productIds: camp.productIds,
    });
    setIsModalOpen(true);
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (editingCampaign) {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === editingCampaign.id
            ? {
                ...c,
                ...formData,
                code: formData.code.toUpperCase(),
              }
            : c
        )
      );
      toast.success('Campaign updated successfully!');
    } else {
      const newCamp: Campaign = {
        id: `camp-${Date.now()}`,
        ...formData,
        code: formData.code.toUpperCase(),
        clicksCount: 0,
        conversionsCount: 0,
        totalRevenueGenerated: 0,
      };
      setCampaigns((prev) => [newCamp, ...prev]);
      toast.success('Campaign launched successfully!');
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = (id: string, current: boolean) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c))
    );
    toast.success(`Campaign ${!current ? 'activated' : 'paused'}`);
  };

  const handleDelete = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setIsDeleteConfirmOpen(null);
    toast.success('Campaign deleted');
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Promotional Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Create scheduled marketing promotions, promotional storefront banners, and product bundles.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#C85A32] hover:bg-[#B84B24] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns by name or coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
          />
        </div>
        <div className="text-xs text-stone-500 font-medium hidden sm:block">
          {filteredCampaigns.length} marketing campaigns
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCampaigns.map((camp) => {
          return (
            <div
              key={camp.id}
              className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Visual Banner Preview Header */}
                <div className="h-36 relative bg-gradient-to-tr from-stone-900 to-stone-800 p-5 flex flex-col justify-end text-white overflow-hidden">
                  <div className="absolute inset-0 opacity-40">
                    <Image src={camp.bannerUrl} alt={camp.name} fill unoptimized className="object-cover" />
                  </div>
                  <div className="relative z-10">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#C85A32] text-white text-[10px] font-mono font-bold uppercase mb-1">
                      {camp.code} • {camp.discountType === 'percentage' ? `${camp.discountValue}% OFF` : `₹${camp.discountValue} OFF`}
                    </span>
                    <h3 className="font-outfit font-bold text-lg leading-tight line-clamp-1">
                      {camp.bannerTitle || camp.name}
                    </h3>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-stone-900 text-sm">{camp.name}</div>
                    <button
                      onClick={() => handleToggleActive(camp.id, camp.isActive)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                        camp.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {camp.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <p className="text-stone-600 line-clamp-2">{camp.bannerSubtitle}</p>

                  <div className="flex items-center space-x-2 text-stone-500 text-[11px] font-mono pt-1">
                    <Calendar className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>
                      {camp.startDate} → {camp.endDate}
                    </span>
                  </div>

                  {/* Campaign Performance Bar */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[#FAF5EE] rounded-xl text-center font-mono">
                    <div>
                      <div className="text-[10px] text-stone-400">Clicks</div>
                      <div className="font-bold text-stone-800">{camp.clicksCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-400">Orders</div>
                      <div className="font-bold text-emerald-600">{camp.conversionsCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-400">Sales (₹)</div>
                      <div className="font-bold text-stone-900 font-outfit">₹{camp.totalRevenueGenerated.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  {camp.productIds.length} Associated Product(s)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(camp)}
                    className="p-1.5 text-stone-600 hover:text-[#C85A32] hover:bg-white rounded-lg transition-colors"
                    title="Edit Campaign"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsDeleteConfirmOpen(camp.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCampaigns.length === 0 && (
          <div className="col-span-2 py-12 text-center text-stone-400 bg-white rounded-3xl border border-stone-200">
            <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-sm">No promotional campaigns found</p>
          </div>
        )}
      </div>

      {/* Create / Edit Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div>
                <h3 className="font-outfit font-bold text-stone-900 text-base">
                  {editingCampaign ? 'Edit Marketing Campaign' : 'Launch New Campaign'}
                </h3>
                <p className="text-xs text-stone-500">
                  Configure promo code, banner preview, and associated kits.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign}>
              <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4 text-xs">
                {/* Live Banner Preview Box */}
                <div className="rounded-2xl overflow-hidden border border-amber-900/20 shadow-2xs">
                  <div className="h-28 relative bg-stone-900 p-4 flex flex-col justify-end text-white">
                    <div className="absolute inset-0 opacity-40">
                      <Image src={formData.bannerUrl || '/images/collections/dinosaur.jpg'} alt="Preview" fill unoptimized className="object-cover" />
                    </div>
                    <div className="relative z-10">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#C85A32] text-white text-[10px] font-mono font-bold uppercase mb-1">
                        {formData.code || 'CODE'} • {formData.discountType === 'percentage' ? `${formData.discountValue}% OFF` : `₹${formData.discountValue} OFF`}
                      </span>
                      <div className="font-outfit font-bold text-base truncate">
                        {formData.bannerTitle || 'Campaign Headline'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Campaign Title</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                      placeholder="e.g. Diwali DIY Carnival"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Promo Code</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none uppercase font-mono font-bold"
                      placeholder="DIWALI20"
                    />
                  </div>
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
                      <option value="fixed">Fixed Cash (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Discount Amount</label>
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
                    <label className="block font-semibold text-stone-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Banner Headline</label>
                  <input
                    type="text"
                    value={formData.bannerTitle}
                    onChange={(e) => setFormData({ ...formData, bannerTitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Banner Subtitle / Description</label>
                  <textarea
                    rows={2}
                    value={formData.bannerSubtitle}
                    onChange={(e) => setFormData({ ...formData, bannerSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    value={formData.bannerUrl}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  />
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
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsDeleteConfirmOpen(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-stone-200 p-5 z-10 text-xs font-body animate-in fade-in-0 zoom-in-95">
            <h4 className="font-outfit font-bold text-stone-900 text-base mb-1">Delete Campaign</h4>
            <p className="text-stone-500 mb-4">
              Are you sure you want to delete this marketing campaign? Any live banners will be removed.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(null)}
                className="px-3 py-1.5 bg-stone-100 text-stone-700 font-semibold rounded-lg hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(isDeleteConfirmOpen)}
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
