'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminSession } from '@/lib/admin/useAdminSession';
import { products as initialProducts } from '@/data/products';

interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  author: string;
  email?: string;
  rating: number;
  title: string;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerified: boolean;
  createdAt: string;
}

export default function ReviewsAdminPage() {
  const { hasPermission, effectiveRole } = useAdminSession();
  const canModerate = hasPermission('reviews.moderate');

  const [reviews, setReviews] = useState<AdminReview[]>([
    {
      id: 'rev-1',
      productId: 'dino-t-rex-kit',
      productName: 'T-Rex Figurine Paint Kit',
      author: 'Sunita Rao',
      email: 'sunita.rao@example.com',
      rating: 5,
      title: 'Absolutely fantastic activity kit for my 6-year-old!',
      comment:
        'The plaster quality is very smooth and colors are bright yet washable. My son spent 2 whole hours painting his T-Rex. Packaging was premium!',
      status: 'APPROVED',
      isVerified: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'rev-2',
      productId: 'space-rocket-kit',
      productName: 'Cosmic Explorer Rocket Kit',
      author: 'Karan Mehra',
      email: 'karan.m@example.com',
      rating: 5,
      title: 'Best return gift for birthday party',
      comment: 'Ordered 10 kits for my daughter’s 7th birthday party. All the kids loved it!',
      status: 'PENDING',
      isVerified: true,
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: 'rev-3',
      productId: 'animal-safari-kit',
      productName: 'Safari Friends Paint Kit',
      author: 'Sneha Gupta',
      email: 'sneha.g@example.com',
      rating: 4,
      title: 'Very cute figurines, paints dry quickly',
      comment: 'Good quality. An extra brush would have been great but overall very satisfied.',
      status: 'APPROVED',
      isVerified: false,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'rev-4',
      productId: 'dino-t-rex-kit',
      productName: 'T-Rex Figurine Paint Kit',
      author: 'Rajesh Kumar',
      email: 'rajesh.k@example.com',
      rating: 1,
      title: 'Spam review testing external link',
      comment: 'Visit my website http://spam-link.example to get cheap toys free.',
      status: 'REJECTED',
      isVerified: false,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ]);

  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [productFilter, setProductFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Fetch reviews from API if available
  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          const mapped: AdminReview[] = data.reviews.map((r: any, idx: number) => ({
            id: r.id || `api-rev-${idx}`,
            productId: r.productId || 'dino-t-rex-kit',
            productName:
              initialProducts.find((p) => p.id === r.productId)?.name || 'DIY Craft Paint Kit',
            author: r.customerName || r.author || 'Parent Customer',
            email: r.email,
            rating: r.rating || 5,
            title: r.title || 'Great Quality Craft Kit',
            comment: r.comment || r.content || '',
            status: r.status || 'APPROVED',
            isVerified: !!r.isVerified,
            createdAt: r.createdAt || new Date().toISOString(),
          }));
          setReviews(mapped);
        }
      })
      .catch((err) => console.log('Using initial reviews state'));
  }, []);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const q = search.toLowerCase().trim();
      const inSearch =
        !q ||
        r.author.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q);

      const inStatus = statusTab === 'ALL' || r.status === statusTab;
      const inProduct = productFilter === 'ALL' || r.productId === productFilter;

      return inSearch && inStatus && inProduct;
    });
  }, [reviews, search, statusTab, productFilter]);

  const handleUpdateStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    if (!canModerate) {
      toast.error(`Permission Denied: Role ${effectiveRole()} cannot moderate reviews.`);
      return;
    }
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    toast.success(`Review ${newStatus.toLowerCase()} successfully!`);
  };

  const handleDelete = (id: string) => {
    if (!canModerate) {
      toast.error(`Permission Denied: Role ${effectiveRole()} cannot delete reviews.`);
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success('Review deleted');
  };

  const pendingCount = reviews.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Customer Reviews Moderation
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Approve verified buyer testimonials, screen feedback, and maintain product rating integrity.
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex rounded-xl bg-white border border-stone-200/80 p-1 shadow-2xs">
          <button
            onClick={() => setStatusTab('PENDING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
              statusTab === 'PENDING'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <span>Needs Moderation</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-[#C85A32] text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusTab('APPROVED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusTab === 'APPROVED'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusTab('REJECTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusTab === 'REJECTED'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setStatusTab('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusTab === 'ALL'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            All Reviews
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews by customer name or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-stone-500 font-semibold uppercase font-outfit">Product:</span>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
          >
            <option value="ALL">All Products</option>
            {initialProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((rev) => {
          return (
            <div
              key={rev.id}
              className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-5 sm:p-6 transition-all hover:shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {/* Rating Stars & Badges */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-200'
                          }`}
                        />
                      ))}
                    </div>

                    <span className="font-bold text-stone-900 text-sm font-outfit">
                      {rev.author}
                    </span>

                    {rev.isVerified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Buyer
                      </span>
                    )}

                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        rev.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rev.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>

                  {/* Title & Comment */}
                  <h3 className="font-bold text-stone-900 text-base font-outfit pt-1">
                    {rev.title}
                  </h3>
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-3xl">
                    {rev.comment}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400 pt-1">
                    <span className="flex items-center gap-1 font-medium text-stone-600">
                      <Package className="w-3.5 h-3.5 text-[#C85A32]" />
                      <span>{rev.productName}</span>
                    </span>
                    <span>•</span>
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Moderation Action Buttons */}
                <div className="flex items-center space-x-2 shrink-0 sm:self-center">
                  {rev.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(rev.id, 'APPROVED')}
                      disabled={!canModerate}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      title="Approve and show on storefront"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {rev.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleUpdateStatus(rev.id, 'REJECTED')}
                      disabled={!canModerate}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                      title="Reject and hide"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(rev.id)}
                    disabled={!canModerate}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredReviews.length === 0 && (
          <div className="py-16 text-center text-stone-400 bg-white rounded-3xl border border-stone-200">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50 text-[#C85A32]" />
            <p className="font-medium text-sm">No reviews in this moderation queue</p>
            <p className="text-xs text-stone-400 mt-1">All customer ratings have been reviewed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
