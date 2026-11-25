'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { products as defaultProducts, categories } from '@/data/products';
import { useAdminStore } from '@/store/adminStore';
import ProductCard from '@/components/product/ProductCard';
import { ChevronDown, PackageX } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const CATEGORIES = ['All', 'Mini Kit', 'Fun Kit', 'Creative Kit', 'Signature', 'Return Gifts', 'Festival Special'];
const SORT_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  
  const adminProducts = useAdminStore((state) => state.products);
  const products = adminProducts && adminProducts.length > 0 ? adminProducts : defaultProducts;

  const [activeCategory, setActiveCategory] = useState<string>(
    initialCategory ? CATEGORIES.find(c => c.toLowerCase().replace(' ', '-') === initialCategory) || 'All' : 'All'
  );
  const [activeAge, setActiveAge] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('default');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filteredAndSortedProducts = useMemo(() => {
    // Filter
    let filtered = products.filter(p => p.isActive !== false);
    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => {
        const catName = categories.find(c => c.id === p.categoryId)?.name || '';
        return catName.toLowerCase().includes(activeCategory.toLowerCase()) || p.categoryId.toLowerCase().includes(activeCategory.toLowerCase().replace(' ', '-'));
      });
    }

    if (activeAge !== 'All') {
      filtered = filtered.filter(p => p.ageGroup === activeAge);
    }

    // Sort
    const sorted = [...filtered];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    }

    return sorted;
  }, [products, activeCategory, activeAge, sortBy]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Pure Craft • Screen-Free Fun
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-gray-900 mb-3">
            Handcrafted DIY Paint Kits
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Discover our complete range of child-safe plaster figurines and washable colors. From quick weekend projects to signature gift sets.
          </p>
        </div>

        {/* Filter & Sort Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-[#EFE8DE] mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Categories & Age Filters */}
          <div className="flex-grow space-y-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mr-1">Category:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${
                    activeCategory === cat 
                      ? 'bg-[#FF5722] text-white shadow-xs' 
                      : 'bg-[#FFFDF9] text-gray-700 hover:bg-[#EFE8DE] border border-[#EFE8DE]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 min-w-max">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mr-1">Age Group:</span>
              {['All', '3-5', '5+', '8+'].map((age) => (
                <button
                  key={age}
                  onClick={() => setActiveAge(age)}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                    activeAge === age 
                      ? 'bg-purple-700 text-white shadow-xs' 
                      : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  {age === 'All' ? 'All Ages' : `Age ${age}`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0 border-t md:border-t-0 md:border-l border-[#EFE8DE] pt-4 md:pt-0 md:pl-4 mt-2 md:mt-0">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="min-h-[44px] flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800 bg-[#FFFDF9] border border-[#EFE8DE] px-4 py-2.5 rounded-xl hover:bg-[#EFE8DE] transition-colors w-full md:w-auto justify-between"
            >
              Sort: {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
              <ChevronDown className={`w-4 h-4 transition-transform text-[#FF5722] ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#EFE8DE] overflow-hidden z-20 py-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setIsSortOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-3 text-xs sm:text-sm transition-colors ${
                      sortBy === opt.value ? 'text-[#FF5722] font-bold bg-orange-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredAndSortedProducts.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredAndSortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm"
          >
            <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6">
              <PackageX className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              We couldn&apos;t find any kits matching your current filter. Try selecting a different category.
            </p>
            <button 
              onClick={() => setActiveCategory('All')}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}

export default function ProductsClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2]">
        <div className="text-center font-bold text-orange-500">Loading products...</div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
