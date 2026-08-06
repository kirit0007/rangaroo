'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, Star, Plus, Minus, ShoppingCart, Zap, CheckCircle2, Shield, Truck, Package, RotateCcw } from 'lucide-react';
import { getProductBySlug, getProductsByCollection, products as defaultProducts, categories, formatPrice, calculateDiscount } from '@/data/products';
import { useAdminStore } from '@/store/adminStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import ProductCard from '@/components/product/ProductCard';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const addItem = useCartStore((state) => state.addItem);
  const storeProducts = useAdminStore((state) => state.products) || defaultProducts;
  
  const [product, setProduct] = useState<any>(undefined);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (typeof slug === 'string') {
      const foundProduct = storeProducts.find(p => p.slug === slug || p.id === slug) || getProductBySlug(slug);
      setProduct(foundProduct);
      
      if (foundProduct && foundProduct.collectionId) {
        const related = storeProducts
          .filter(p => p.collectionId === foundProduct.collectionId && p.id !== foundProduct.id)
          .slice(0, 4);
        setRelatedProducts(related);
      }
    }
  }, [slug, storeProducts]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const discount = product.compareAtPrice 
    ? calculateDiscount(product.price, product.compareAtPrice) 
    : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart!`);
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please login or create an account to place an order');
      openAuthModal('login');
      return;
    }
    addItem(product, quantity);
    router.push('/checkout');
  };

  const productImages = product.images?.length ? product.images : ['/logo.png'];

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link href="/" className="hover:text-orange-600">Home</Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <Link href="/products" className="hover:text-orange-600">Shop</Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-none">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-3xl p-6 lg:p-10 shadow-sm border border-gray-100 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left: Images */}
            <div className="space-y-4">
              <div className="relative aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                <Image
                  src={productImages[activeImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized={true}
                  priority
                />
                {discount > 0 && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1.5 text-sm font-bold bg-orange-500 text-white rounded-full shadow-md">
                      Save {discount}%
                    </span>
                  </div>
                )}
              </div>
              
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {productImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        activeImage === idx ? 'border-orange-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="flex flex-col">
              <div className="mb-2">
                <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                  {categories.find(c => c.id === product.categoryId)?.name || 'DIY Paint Kit'}
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-outfit font-bold text-gray-900 mb-3">
                {product.name}
              </h1>
              
              <ProductHeaderRating productId={product.id} />

              <div className="flex items-end gap-3 mb-6">
                <span className="text-4xl font-bold text-orange-600">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-xl text-gray-400 line-through mb-1">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Info Badges */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Non-Toxic Paints</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <Package className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Gift Ready</span>
                </div>
                {product.ageGroup && (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Ages {product.ageGroup}</span>
                  </div>
                )}
              </div>

              {/* Kit Contents */}
              {product.kitContents && product.kitContents.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3 font-outfit text-lg">What's inside the box?</h3>
                  <ul className="space-y-2 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                    {product.kitContents.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto pt-8 border-t border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl h-14">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-l-xl transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-gray-900 select-none">
                      {quantity}
                    </span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-r-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={handleAddToCart}
                    className="flex-grow h-14 flex items-center justify-center gap-2 bg-white border-2 border-orange-500 text-orange-600 rounded-xl font-bold text-lg hover:bg-orange-50 transition-colors shadow-sm"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                </div>
                
                <button
                  onClick={handleBuyNow}
                  className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-lg hover:from-orange-600 hover:to-amber-600 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  Buy It Now
                </button>
              </div>

              {/* Delivery info */}
              <div className="flex items-center justify-between text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Free shipping over ₹499
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> 7-day returns
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Description Section */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-100 mb-12">
          <h2 className="text-2xl font-outfit font-bold text-gray-900 mb-6">Product Details</h2>
          <div className="prose prose-orange max-w-none text-gray-600">
            <p>
              Let your child's imagination run wild with the {product.name}. Our premium plaster painting kits are designed to provide hours of screen-free entertainment while developing fine motor skills and color recognition.
            </p>
            <p className="mt-4">
              Each piece is carefully hand-poured using high-quality, durable plaster that absorbs paint beautifully, resulting in vibrant, lasting colors. The included paints are 100% non-toxic, water-based, and completely safe for little hands.
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4">Why choose our DIY kits?</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Screen-Free Fun:</strong> A perfect way to keep kids engaged away from digital devices.</li>
              <li><strong>Skill Development:</strong> Enhances hand-eye coordination, focus, and creative thinking.</li>
              <li><strong>Perfect for Gifting:</strong> Comes in a beautiful, sturdy box ready to be gifted for birthdays or special occasions.</li>
              <li><strong>Complete Set:</strong> Everything you need is included in the box—no extra trips to the craft store!</li>
            </ul>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <ProductReviewsSection product={product} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-outfit font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductHeaderRating({ productId }: { productId: string }) {
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });

  useEffect(() => {
    if (productId) {
      fetch(`/api/reviews?productId=${productId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.summary) setSummary(data.summary);
        })
        .catch((err) => console.error(err));
    }
  }, [productId]);

  if (summary.totalReviews === 0) {
    return (
      <div className="flex items-center gap-2 mb-6">
        <div className="flex text-gray-300">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4" />
          ))}
        </div>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          No reviews yet
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex text-amber-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${i < Math.round(summary.averageRating) ? 'fill-current' : 'text-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-gray-700">
        {summary.averageRating} ({summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}

function ProductReviewsSection({ product }: { product: any }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product?.id) {
      setIsLoading(true);
      fetch(`/api/reviews?productId=${product.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.reviews) setReviews(data.reviews);
          if (data.summary) setReviewSummary(data.summary);
        })
        .catch((err) => console.error('Reviews load error:', err))
        .finally(() => setIsLoading(false));
    }
  }, [product?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Publishing your review...');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName: customerName.trim() || 'Verified Customer',
          rating,
          title,
          comment,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Thank you! Your review has been submitted.', { id: toastId });
        if (data.review) setReviews((prev) => [data.review, ...prev]);
        if (data.summary) setReviewSummary(data.summary);
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
      toast.error('Failed to submit review', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-100 mb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-100 mb-8">
        <div>
          <h2 className="text-2xl font-outfit font-bold text-gray-900">Customer Reviews</h2>
          <div className="flex items-center gap-3 mt-2">
            {reviewSummary.totalReviews > 0 ? (
              <>
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(reviewSummary.averageRating) ? 'fill-current' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-lg font-extrabold text-gray-900">{reviewSummary.averageRating} out of 5</span>
                <span className="text-sm text-gray-500">• {reviewSummary.totalReviews} {reviewSummary.totalReviews === 1 ? 'review' : 'reviews'}</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                ★ No reviews yet — Be the first to review!
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm w-fit"
        >
          {showForm ? 'Cancel Review' : 'Write a Review'}
        </button>
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-orange-50/40 border border-orange-100 rounded-2xl p-6 mb-10 space-y-4">
          <h3 className="font-outfit font-bold text-lg text-gray-900">Share Your Experience with {product.name}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Rating</label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-gray-600 ml-2">{hoverRating || rating} Stars</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Review Title</label>
            <input
              type="text"
              placeholder="e.g. Great quality kit! My daughter loved painting it."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Your Review</label>
            <textarea
              rows={3}
              required
              placeholder="Write your feedback about plaster quality, non-toxic colors, packaging, etc..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Loading customer reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <p className="font-semibold text-gray-700">No customer reviews for this product yet.</p>
          <p className="text-xs text-gray-400 mt-1">Be the first young artist or parent to post a review after painting!</p>
        </div>
      ) : (
        <div className="space-y-6 divide-y divide-gray-100">
          {reviews.map((rev) => (
            <div key={rev.id} className="pt-6 first:pt-0">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-amber-400 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {rev.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      {rev.customerName}
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                        ✔ Verified Buyer
                      </span>
                    </h4>
                    <div className="flex items-center text-amber-400 text-xs mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {rev.title && <h5 className="font-bold text-gray-800 text-sm mt-2">{rev.title}</h5>}
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
