'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, ShieldCheck, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewSkeleton from '@/components/reviews/ReviewSkeleton';

interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  isVerified?: boolean;
}

interface VerifiedReviewsProps {
  productId: string;
  productName: string;
  className?: string;
}

export default function VerifiedReviews({
  productId,
  productName,
  className = '',
}: VerifiedReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let isMounted = true;

    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.reviews) setReviews(data.reviews);
        if (data.summary) {
          setSummary({
            averageRating: data.summary.averageRating || 0,
            totalReviews: data.summary.totalReviews || 0,
            ratingBreakdown: data.summary.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          });
        }
      })
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter your review details');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Publishing your review...');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName: customerName.trim() || 'Verified Customer',
          rating,
          title,
          comment,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Thank you! Your verified review has been submitted. 🎉', { id: toastId });
        if (data.review) setReviews((prev) => [data.review, ...prev]);
        if (data.summary) setSummary(data.summary);
        setCustomerName('');
        setTitle('');
        setComment('');
        setRating(5);
        setShowForm(false);
      } else {
        toast.error(data.error || 'Failed to submit review', { id: toastId });
      }
    } catch (err: any) {
      console.error('Submit review error:', err);
      toast.error('Failed to submit review. Please try again.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-3xl p-6 sm:p-10 bg-[#FFFDF9] border border-[#EFE8DE] shadow-xs ${className}`}
      aria-label="Customer Reviews"
    >
      {/* Header with aggregate score & write CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#EFE8DE]">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3 py-1 rounded-full inline-block mb-2">
            Real Experiences
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-900">
            Verified Customer Reviews
          </h2>
          <div className="flex items-center gap-3 mt-2">
            {summary.totalReviews > 0 ? (
              <>
                <div className="flex items-center text-[#FFA000]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i <= Math.round(summary.averageRating) ? 'fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-lg font-extrabold text-gray-900 font-mono">
                  {summary.averageRating.toFixed(1)} / 5.0
                </span>
                <span className="text-xs sm:text-sm text-gray-600">
                  ({summary.totalReviews} {summary.totalReviews === 1 ? 'verified review' : 'verified reviews'})
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-sm font-semibold text-gray-600 bg-[#EFE8DE] px-3 py-1 rounded-full">
                ★ Be the first young artist or parent to review this kit!
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="min-h-[44px] min-w-[44px] px-6 py-3 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
        >
          <PenTool className="w-4 h-4" />
          {showForm ? 'Cancel Review' : 'Write a Review'}
        </button>
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 p-6 rounded-2xl bg-white border border-[#EFE8DE] shadow-xs space-y-4"
        >
          <h3 className="font-heading font-bold text-lg text-gray-900">
            Share Your Experience with {productName}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customerNameInput" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Your Name (or Child&apos;s Artist Name)
              </label>
              <input
                id="customerNameInput"
                type="text"
                placeholder="e.g., Ananya Patel"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Star Rating
              </label>
              <div className="flex items-center gap-2 pt-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} star`}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl p-1 hover:scale-110 transition-transform focus-visible:ring-2 focus-visible:ring-[#FF5722]"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoverRating || rating) ? 'text-[#FFA000] fill-current' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-gray-700 ml-1">
                  {hoverRating || rating} Stars
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="reviewTitleInput" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Headline Summary
            </label>
            <input
              id="reviewTitleInput"
              type="text"
              placeholder="e.g., Amazing quality plaster & vibrant washable colors!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-white"
            />
          </div>

          <div>
            <label htmlFor="reviewCommentInput" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Your Review & Story
            </label>
            <textarea
              id="reviewCommentInput"
              rows={3}
              required
              placeholder="Tell other parents about the paint quality, plaster durability, kid excitement..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-h-[44px] min-w-[44px] px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] min-w-[44px] px-6 py-2.5 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      <div className="mt-8">
        {isLoading ? (
          <ReviewSkeleton />
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-gray-600 bg-white rounded-2xl border border-dashed border-[#EFE8DE] p-6">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-gray-800 text-base">No Customer Reviews Yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Be the first to share your creative masterpiece and help other families pick their kit!
            </p>
          </div>
        ) : (
          <div className="space-y-6 divide-y divide-[#EFE8DE]" role="list">
            {reviews.map((rev) => (
              <div key={rev.id} className="pt-6 first:pt-0" role="listitem">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#FFA000] text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                      {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'V'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{rev.customerName}</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Buyer
                        </span>
                      </div>
                      <div className="flex items-center text-[#FFA000] text-xs mt-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i <= rev.rating ? 'fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {rev.title && (
                  <h4 className="font-heading font-bold text-gray-900 text-sm mt-2">{rev.title}</h4>
                )}
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
