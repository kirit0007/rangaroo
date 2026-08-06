'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { products as defaultProducts, categories } from '@/data/products';
import { useAdminStore } from '@/store/adminStore';
import ProductCard from '@/components/product/ProductCard';
import { Filter, ChevronDown, PackageX } from 'lucide-react';
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

    // Sort
    const sorted = [...filtered];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    }

    return sorted;
  }, [products, activeCategory, sortBy]);

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-outfit font-extrabold text-gray-900 mb-4">Shop All Kits</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our complete range of DIY paint kits. From mini projects to signature collections, find the perfect creative activity for your little one.
          </p>
        </div>

        {/* Filter & Sort Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Categories */}
          <div className="flex-grow overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              <Filter className="w-5 h-5 text-gray-400 mr-2" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeCategory === cat 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4 mt-2 md:mt-0">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors w-full md:w-auto justify-between"
            >
              Sort: {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
              <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setIsSortOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors ${
                      sortBy === opt.value ? 'text-orange-600 font-semibold bg-orange-50/50' : 'text-gray-700'
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
              We couldn't find any kits matching your current filter. Try selecting a different category.
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

export default function ProductsPage() {
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
