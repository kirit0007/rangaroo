'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { categories, formatPrice, calculateDiscount } from '@/data/products';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [imgError, setImgError] = useState(false);
  
  const discount = product.compareAtPrice 
    ? calculateDiscount(product.price, product.compareAtPrice) 
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <motion.div 
        whileHover={{ translateY: -4 }}
        whileTap={{ scale: 0.98 }}
        className="group relative flex flex-col h-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
      >
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full shadow-sm">
            {categories.find(c => c.id === product.categoryId)?.name || 'DIY Kit'}
          </span>
          {product.ageGroup && (
            <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full shadow-sm w-fit">
              Age {product.ageGroup}
            </span>
          )}
        </div>
        
        {discount > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-3 py-1 text-xs font-bold bg-orange-500 text-white rounded-full shadow-sm">
              -{discount}%
            </span>
          </div>
        )}

        {/* Image */}
        <div className="relative h-[200px] w-full bg-cream overflow-hidden flex items-center justify-center select-none text-[0px]">
          <img
            src={!imgError && product.images?.[0] ? product.images[0] : '/logo.png'}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 block"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow p-5 space-y-4">
          <div>
            <h3 className="font-outfit text-lg font-semibold text-gray-900 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {product.description}
            </p>
          </div>

          {/* Kit Contents Preview */}
          {product.kitContents && product.kitContents.length > 0 && (
            <div className="flex-grow space-y-1">
              {product.kitContents.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex items-center text-xs text-gray-600">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
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
              <span className="text-xl font-bold text-orange-600">
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
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-colors shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
