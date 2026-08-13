'use client';

import { useState, useEffect } from 'react';
import { Star, CheckCircle2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      })
      .catch((err) => console.error('Error fetching reviews:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteReview = (id: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review removed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold font-outfit text-gray-800">Customer Reviews</h1>
        <p className="text-sm text-gray-500">Moderate product ratings and customer feedback.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 font-outfit">Product Ratings & Reviews</h3>
          <span className="text-xs text-gray-500 font-semibold">{reviews.length} reviews</span>
        </div>

        <div className="divide-y divide-gray-100">
          {reviews.map((review) => (
            <div key={review.id} className="p-6 hover:bg-gray-50/50 transition-colors flex justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-900">{review.author || 'Anonymous'}</span>
                  {review.isVerified && (
                    <span className="inline-flex items-center text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={10} className="mr-1" /> Verified Buyer
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-gray-800">{review.title || 'Great product!'}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment || review.content}</p>
                <p className="text-xs text-gray-400 pt-1">
                  Product ID: <span className="font-mono">{review.productId}</span> • {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recent'}
                </p>
              </div>

              <button
                onClick={() => handleDeleteReview(review.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {reviews.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-400">
              <Star size={36} className="mx-auto mb-2 opacity-50 text-amber-400" />
              <p>No customer reviews submitted yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
