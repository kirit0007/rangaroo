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
      className="group relative flex flex-col h-full bg-[#FFFDF9] border border-[#EFE8DE] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
    >
      {/* Top Overlay Badges & Wishlist Button */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none">
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <span className="px-3 py-1 text-xs font-bold bg-orange-100 text-orange-900 rounded-full border border-orange-200 shadow-2xs">
            {categories.find(c => c.id === product.categoryId)?.name || 'DIY Kit'}
          </span>
          {product.ageGroup && (
            <span className="px-3 py-1 text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 rounded-full shadow-2xs w-fit">
              Age {product.ageGroup}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          {discount > 0 && (
            <span className="px-3 py-1 text-xs font-extrabold bg-[#FF5722] text-white rounded-full shadow-xs">
              -{discount}%
            </span>
          )}
          
          <button
            onClick={handleToggleWishlist}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md shadow-xs transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-[#FF5722] ${
              isInWishlist ? 'bg-rose-500 text-white' : 'bg-white/95 text-gray-700 hover:text-rose-500 border border-[#EFE8DE]'
            }`}
          >
            <Heart size={18} className={isInWishlist ? 'fill-current' : ''} />
          </button>
        </div>
      </div>

      {/* Image Area - Link */}
      <Link href={`/products/${product.slug}`} className="relative h-[210px] w-full bg-[#FFFDF9] overflow-hidden block">
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
            <h3 className="font-heading text-lg font-bold text-gray-900 line-clamp-1 hover:text-[#FF5722] transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Kit Contents Preview */}
        {product.kitContents && product.kitContents.length > 0 && (
          <div className="flex-grow space-y-1">
            {product.kitContents.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex items-center text-xs text-gray-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-2 flex-shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
            {product.kitContents.length > 2 && (
              <div className="text-xs text-gray-500 pl-5">
                + {product.kitContents.length - 2} more items included
              </div>
            )}
          </div>
        )}

        {/* Price & Action */}
        <div className="pt-3 mt-auto border-t border-[#EFE8DE]">
          <div className="flex items-end mb-3 gap-2">
            <span className="text-2xl font-black text-[#FF5722] font-mono">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-gray-400 line-through mb-0.5 font-mono">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-xl font-heading font-bold text-sm active:scale-98 transition-all shadow-xs"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Box
          </button>
        </div>
      </div>
    </motion.div>
  );
}
