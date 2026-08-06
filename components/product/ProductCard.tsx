'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle2, Heart } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { categories, formatPrice, calculateDiscount } from '@/data/products';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));

  const [imgError, setImgError] = useState(false);
  
  const discount = product.compareAtPrice 
    ? calculateDiscount(product.price, product.compareAtPrice) 
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    if (!isInWishlist) {
      toast.success(`Saved to Wishlist!`);
    } else {
      toast.success(`Removed from Wishlist`);
    }
  };

  const imgSrc = !imgError && product.images?.[0] ? product.images[0] : '/logo.png';

  return (
    <motion.div 
      whileHover={{ translateY: -4 }}
      className="group relative flex flex-col h-full bg-white/80 backdrop-blur-xl border border-orange-100/80 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.08)] transition-all duration-300"
    >
      {/* Top Overlay Badges & Wishlist Button */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none">
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full shadow-sm">
            {categories.find(c => c.id === product.categoryId)?.name || 'DIY Kit'}
          </span>
          {product.ageGroup && (
            <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full shadow-sm w-fit">
              Age {product.ageGroup}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          {discount > 0 && (
            <span className="px-3 py-1 text-xs font-bold bg-orange-500 text-white rounded-full shadow-sm">
              -{discount}%
            </span>
          )}
          
          <button
            onClick={handleToggleWishlist}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className={`min-w-[48px] min-h-[48px] w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-transform active:scale-90 ${
              isInWishlist ? 'bg-rose-500 text-white' : 'bg-white/90 text-gray-600 hover:text-rose-500'
            }`}
          >
            <Heart size={18} className={isInWishlist ? 'fill-current' : ''} />
          </button>
        </div>
      </div>

      {/* Image Area - Link */}
      <Link href={`/products/${product.slug}`} className="relative h-[200px] w-full bg-cream overflow-hidden block">
        <Image
          src={imgSrc}
          alt={`${product.name} - Non-toxic DIY plaster craft kit for kids`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          onError={() => setImgError(true)}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized={true}
        />
      </Link>

      {/* Content Area */}
      <div className="flex flex-col flex-grow p-5 space-y-4">
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-outfit text-lg font-bold text-gray-900 line-clamp-1 hover:text-orange-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Kit Contents Preview */}
        {product.kitContents && product.kitContents.length > 0 && (
          <div className="flex-grow space-y-1">
            {product.kitContents.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex items-center text-xs text-gray-600">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-2 flex-shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
            {product.kitContents.length > 2 && (
              <div className="text-xs text-gray-400 pl-5">
                + {product.kitContents.length - 2} more items
              </div>
            )}
          </div>
        )}

        {/* Price & Action */}
        <div className="pt-2 mt-auto border-t border-gray-100">
          <div className="flex items-end mb-3 gap-2">
            <span className="text-xl font-extrabold text-orange-600">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-gray-400 line-through mb-0.5">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm hover:from-orange-600 hover:to-amber-600 active:scale-98 transition-all shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}
