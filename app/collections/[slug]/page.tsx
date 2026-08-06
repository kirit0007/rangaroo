'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, PackageX } from 'lucide-react';
import { getCollectionBySlug, getProductsByCollection } from '@/data/products';
import ProductCard from '@/components/product/ProductCard';
import { Collection, Product } from '@/types';
import { motion } from 'framer-motion';

export default function CollectionPage() {
  const { slug } = useParams();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof slug === 'string') {
      const foundCollection = getCollectionBySlug(slug);
      setCollection(foundCollection || null);
      
      if (foundCollection) {
        setProducts(getProductsByCollection(foundCollection.id));
      }
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] pt-32 pb-20 px-4 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6">
          <PackageX className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-outfit font-bold text-gray-900 mb-4">Collection Not Found</h1>
        <p className="text-gray-600 mb-8 max-w-md">We couldn't find the collection you're looking for. It might have been moved or deleted.</p>
        <Link href="/products" className="px-8 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors shadow-md">
          Shop All Kits
        </Link>
      </div>
    );
  }

  // Assign emojis based on slug or use default
  const getEmoji = (slug: string) => {
    const emojis: Record<string, string> = {
      dinosaur: '🦖',
      space: '🚀',
      vehicle: '🚗',
      animal: '🐘',
      food: '🍩',
      magic: '🦄',
      'under-the-sea': '🐠',
      'superhero': '🦸‍♂️',
      'nature': '🌿',
    };
    return emojis[slug] || '🎨';
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link href="/#collections" className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700 mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Collections
        </Link>

        {/* Collection Header */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-orange-100 mb-12 relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-50/50 to-purple-50/50 z-0"></div>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-6xl md:text-8xl mb-6 relative z-10"
          >
            {getEmoji(collection.slug)}
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-outfit font-extrabold text-gray-900 mb-4 relative z-10"
          >
            {collection.name} Collection
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl relative z-10"
          >
            {collection.description} Explore our hand-picked selection of {collection.name.toLowerCase()} themed painting kits. Perfect for sparking imagination and creative play!
          </motion.p>
        </div>

        {/* Product Grid */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 font-outfit">
            {products.length} {products.length === 1 ? 'Kit' : 'Kits'} Available
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-xl text-gray-500 mb-4">No kits found in this collection yet.</p>
            <Link href="/products" className="text-orange-500 font-semibold hover:underline">
              Browse all products
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
