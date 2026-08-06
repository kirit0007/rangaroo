'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, Star, Plus, Minus, ShoppingCart, Zap, CheckCircle2, Shield, Truck, Package, RotateCcw } from 'lucide-react';
import { getProductBySlug, getProductsByCollection, categories, formatPrice, calculateDiscount } from '@/data/products';
import { useCartStore } from '@/store/cartStore';
import ProductCard from '@/components/product/ProductCard';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  
  const [product, setProduct] = useState<ReturnType<typeof getProductBySlug>>(undefined);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (typeof slug === 'string') {
      const foundProduct = getProductBySlug(slug);
      setProduct(foundProduct);
      
      if (foundProduct && foundProduct.collectionId) {
        const related = getProductsByCollection(foundProduct.collectionId)
          .filter(p => p.id !== foundProduct.id)
          .slice(0, 4);
        setRelatedProducts(related);
      }
    }
  }, [slug]);

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
                  {productImages.map((img, idx) => (
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
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <span className="text-sm text-gray-500 font-medium">4.9 (128 reviews)</span>
              </div>

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
                    {product.kitContents.map((item, idx) => (
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
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-100 mb-16">
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
