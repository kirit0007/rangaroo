'use client';

import Link from 'next/link';
import { ShoppingBag, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/data/products';

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} added to cart! 🎨`, {
      style: {
        borderRadius: '1rem',
        background: '#1E1B18',
        color: '#fff',
        fontWeight: 'bold',
      },
    });
  };

  const discountPercentage = product.compareAtPrice 
    ? calculateDiscount(product.price, product.compareAtPrice)
    : 0;

  // Visual theme colors based on collection
  const collectionGradients: Record<string, string> = {
    dinosaur: 'from-emerald-400 via-teal-500 to-green-600',
    space: 'from-indigo-600 via-purple-600 to-pink-500',
    vehicle: 'from-blue-500 via-cyan-500 to-indigo-600',
    animal: 'from-amber-400 via-orange-500 to-red-500',
    food: 'from-pink-400 via-rose-500 to-red-500',
    cartoon: 'from-yellow-400 via-amber-500 to-orange-500',
    princess: 'from-purple-400 via-pink-500 to-rose-400',
    'harry-potter': 'from-amber-700 via-yellow-600 to-stone-800',
  };

  const gradientClass = collectionGradients[product.collectionId] || 'from-orange-400 via-amber-500 to-yellow-400';

  return (
    <Link 
      href={`/products/${product.slug}`} 
      className="group relative bg-white rounded-[2rem] border border-orange-100/80 p-4 shadow-card hover:shadow-fun transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5"
    >
      <div>
        {/* Product Image Mock Container */}
        <div className={`relative w-full aspect-square rounded-[1.5rem] bg-gradient-to-br ${gradientClass} p-6 flex flex-col items-center justify-center text-center text-white overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform`}>
          
          {/* Discount Pill */}
          {discountPercentage > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md tracking-wider">
              {discountPercentage}% OFF
            </div>
          )}

          {/* Featured Badge */}
          {product.isFeatured && (
            <div className="absolute top-3 left-3 bg-yellow-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Bestseller</span>
            </div>
          )}

          {/* Figurines Display Text */}
          <div className="font-heading text-xl md:text-2xl drop-shadow-md leading-tight text-white">
            {product.name}
          </div>
          <div className="text-xs font-semibold text-white/90 mt-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
            {product.figureCount} {product.figureCount === 1 ? 'Figurine' : 'Figurines'} Ready
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-4 px-1">
          {/* Star Rating */}
          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="text-slate-500 text-[11px] ml-1">(4.9)</span>
          </div>

          <h3 className="font-heading text-lg text-slate-900 leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {product.paintType}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Price & Add Button */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs text-slate-400 line-through font-semibold">
            {product.compareAtPrice ? formatPrice(product.compareAtPrice) : ''}
          </div>
          <div className="font-heading text-xl text-slate-900 font-extrabold">
            {formatPrice(product.price)}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-fun flex items-center gap-1.5 group-hover:scale-105 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>
    </Link>
  );
}
