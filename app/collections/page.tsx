'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { collections } from '@/data/products';
import { ArrowRight, Palette } from 'lucide-react';

export default function CollectionsOverviewPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-semibold text-xs mb-4 shadow-sm">
            <Palette className="w-4 h-4" /> Explore By Theme
          </div>
          <h1 className="text-4xl md:text-6xl font-outfit font-extrabold text-gray-900 mb-4">
            DIY Craft Collections
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover themed paint kits designed to inspire creativity, spark imagination, and keep little hands happily creating!
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((col, idx) => (
            <Link key={col.id} href={`/collections/${col.id}`}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(255,87,34,0.12)] hover:border-orange-300 transition-all duration-300 flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 inline-block">
                    {col.emoji}
                  </div>
                  <h3 className="font-outfit font-extrabold text-2xl text-gray-900 mb-3 group-hover:text-orange-500 transition-colors">
                    {col.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {col.description}
                  </p>
                </div>
                <div className="flex items-center text-orange-500 font-bold text-sm group-hover:translate-x-1 transition-transform">
                  Explore Collection <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
