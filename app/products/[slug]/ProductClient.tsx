'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, ShoppingCart, Zap, Heart, CheckCircle2, Truck, RotateCcw, ShieldCheck, Box, Palette } from 'lucide-react';
import { getProductBySlug, products as defaultProducts, categories, formatPrice, calculateDiscount } from '@/data/products';
import { useAdminStore } from '@/store/adminStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import ProductCard from '@/components/product/ProductCard';
import ImageGallery from '@/components/storefront/ImageGallery';
import KitContentsBreakdown from '@/components/storefront/KitContentsBreakdown';
import VerifiedReviews from '@/components/storefront/VerifiedReviews';
import toast from 'react-hot-toast';

export default function ProductClient({
  initialProduct,
  initialRelatedProducts,
}: {
  initialProduct: any;
  initialRelatedProducts: any[];
}) {
  const { slug } = useParams();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const storeProducts = useAdminStore((state) => state.products) || defaultProducts;

  const product = useMemo(() => {
    if (typeof slug === 'string') {
      return storeProducts.find((p: any) => p.slug === slug || p.id === slug) || getProductBySlug(slug) || initialProduct;
    }
    return initialProduct;
  }, [slug, storeProducts, initialProduct]);

  const relatedProducts = useMemo(() => {
    if (product && product.collectionId) {
      return storeProducts
        .filter((p: any) => p.collectionId === product.collectionId && p.id !== product.id)
        .slice(0, 4);
    }
    return initialRelatedProducts || [];
  }, [product, storeProducts, initialRelatedProducts]);

  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);

  const expressDeliveryDate = useMemo(() => {
    return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const checkPincodeDelivery = async (pin: string) => {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      toast.error('Please enter a valid 6-digit Pincode');
      return;
    }
    setPincodeStatus('Checking delivery speed...');
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data && data[0]?.Status === 'Success') {
        const district = data[0].PostOffice[0]?.District || 'your city';
        setPincodeStatus(`🚚 Express Delivery by ${expressDeliveryDate} to ${district} (${pin})`);
        toast.success(`Express Delivery verified for ${district}!`);
      } else {
        setPincodeStatus(`🚚 Standard Courier Delivery available to Pincode ${pin}`);
      }
    } catch {
      setPincodeStatus(`🚚 Delivery available! Expected by ${expressDeliveryDate}`);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5722]" />
      </div>
    );
  }

  const discount = product.compareAtPrice ? calculateDiscount(product.price, product.compareAtPrice) : 0;
  const productImages = product.images?.length ? product.images : ['/logo.png'];
  const figureCount = product.figureCount ?? product.figure_count ?? 2;
  const paintType = product.paintType ?? product.paint_type ?? 'Tempera (Washable & Safe)';
  const kitContents = product.kitContents ?? product.kit_contents ?? [];

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`Added ${quantity} ${quantity > 1 ? 'kits' : 'kit'} to your craft box! 🎨`);
  };

  // Frictionless guest checkout: direct navigation to /checkout without forced login!
  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push('/checkout');
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    if (!isInWishlist(product.id)) {
      toast.success('Saved to Wishlist! ❤️');
    } else {
      toast.success('Removed from Wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex text-xs sm:text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 sm:space-x-2">
            <li>
              <Link href="/" className="hover:text-[#FF5722] transition-colors">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1" />
                <Link href="/shop" className="hover:text-[#FF5722] transition-colors">
                  Shop All
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1" />
                <span className="text-gray-900 font-bold truncate max-w-[200px] sm:max-w-md">
                  {product.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Product Feature Showcase Card */}
        <div className="bg-white rounded-3xl p-6 lg:p-10 shadow-xs border border-[#EFE8DE] mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column: Image Gallery (5 cols) */}
            <div className="lg:col-span-6">
              <ImageGallery
                images={productImages}
                productName={product.name}
                discountPercent={discount}
              />
            </div>

            {/* Right Column: Specifications, Price & Actions (6 cols) */}
            <div className="lg:col-span-6 flex flex-col space-y-6">
              {/* Category & Collection Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 text-xs font-extrabold uppercase tracking-wider bg-orange-100 text-orange-900 rounded-full border border-orange-200">
                  {categories.find((c) => c.id === product.categoryId)?.name || 'DIY Plaster Kit'}
                </span>
                <span className="px-3 py-1 text-xs font-bold bg-[#EFE8DE] text-gray-800 rounded-full">
                  Hand-Poured Craft
                </span>
                {product.ageGroup && (
                  <span className="px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                    Ages {product.ageGroup}
                  </span>
                )}
              </div>

              {/* Title & Short Description */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-gray-900 leading-tight">
                  {product.name}
                </h1>
                {product.shortDescription && (
                  <p className="text-sm sm:text-base text-gray-600 mt-2 font-medium">
                    {product.shortDescription}
                  </p>
                )}
              </div>

              {/* Price & Savings */}
              <div className="flex items-baseline gap-3 pb-4 border-b border-[#EFE8DE]">
                <span className="text-4xl font-black text-[#FF5722] font-mono">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <>
                    <span className="text-lg text-gray-400 line-through font-mono">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Save {discount}%
                    </span>
                  </>
                )}
              </div>

              {/* Kit Breakdown Highlights: Figure Count & Paint Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EFE8DE] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5722]/10 text-[#FF5722] flex items-center justify-center shrink-0">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Figurines</p>
                    <p className="text-sm font-extrabold text-gray-900 font-heading">
                      {figureCount} Handcrafted
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EFE8DE] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFA000]/15 text-[#FFA000] flex items-center justify-center shrink-0">
                    <Palette className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Paints</p>
                    <p className="text-sm font-extrabold text-gray-900 font-heading truncate max-w-[130px]" title={paintType}>
                      {paintType.split('(')[0].trim()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Delivery Pincode Checker */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EFE8DE] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#FF5722]" /> Check Delivery Speed
                  </span>
                  <span className="text-emerald-700">Nationwide Express</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPincode(val);
                      if (val.length === 6) checkPincodeDelivery(val);
                    }}
                    placeholder="Enter 6-digit Pincode"
                    className="flex-1 min-h-[44px] px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5722] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => checkPincodeDelivery(pincode)}
                    className="min-h-[44px] min-w-[44px] px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Check
                  </button>
                </div>
                {pincodeStatus && (
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {pincodeStatus}
                  </p>
                )}
              </div>

              {/* Action Stepper, Add to Cart & Buy Now (44x44px touch targets) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-[#FFFDF9] border border-[#EFE8DE] rounded-2xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="Decrease quantity"
                      className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-gray-900 font-mono select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label="Increase quantity"
                      className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Add To Cart */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 min-h-[48px] py-3 px-6 bg-white border-2 border-[#FF5722] text-[#FF5722] hover:bg-orange-50 font-heading font-bold text-base rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ShoppingCart className="w-5 h-5" /> Add to Box
                  </button>

                  {/* Wishlist Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={`min-w-[48px] min-h-[48px] w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      isInWishlist(product.id)
                        ? 'border-rose-500 bg-rose-500 text-white shadow-sm'
                        : 'border-[#EFE8DE] bg-[#FFFDF9] text-gray-600 hover:text-rose-500 hover:border-rose-300'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Buy It Now CTA: Frictionless Guest Checkout */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full min-h-[48px] py-3.5 px-6 bg-gradient-to-r from-[#FF5722] to-[#FFA000] hover:from-[#E64A19] hover:to-[#FF8F00] text-white font-heading font-extrabold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Zap className="w-5 h-5 fill-current" /> Buy Now (Guest Checkout)
                </button>
              </div>

              {/* Guarantees */}
              <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-[#EFE8DE]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Non-Toxic & Child-Safe
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#FF5722]" /> Free Delivery over ₹499
                </span>
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-indigo-600" /> 7-Day Easy Returns
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kit Contents Breakdown Section */}
        <div className="mb-12">
          <KitContentsBreakdown
            kitContents={kitContents}
            figureCount={figureCount}
            paintType={paintType}
            ageGroup={product.ageGroup || '5+'}
          />
        </div>

        {/* Detailed Description & Craft Story */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EFE8DE] shadow-xs mb-12 space-y-4">
          <h2 className="text-2xl font-heading font-extrabold text-gray-900">
            About This Creative Craft Kit
          </h2>
          <div className="prose max-w-none text-sm sm:text-base text-gray-700 leading-relaxed space-y-3">
            <p>{product.description}</p>
            <p>
              Each plaster figurine in this kit is carefully hand-poured using durable, porous plaster that absorbs watercolors and tempera effortlessly, creating rich, opaque finishes that little artists are proud to display on study desks and shelves.
            </p>
          </div>
        </div>

        {/* Verified Buyer Reviews Section */}
        <div className="mb-12">
          <VerifiedReviews productId={product.id} productName={product.name} />
        </div>

        {/* You May Also Like / Related Kits */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-extrabold text-gray-900">
                You May Also Like
              </h2>
              <Link
                href="/shop"
                className="text-xs sm:text-sm font-bold text-[#FF5722] hover:underline min-h-[44px] flex items-center"
              >
                View All Kits &rarr;
              </Link>
            </div>
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
