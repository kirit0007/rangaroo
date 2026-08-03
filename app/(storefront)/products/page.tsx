'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Filter, SlidersHorizontal, ChevronRight, RefreshCw } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { products, categories, collections } from '@/data/products';

export default function ProductsPage() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedType) {
      result = result.filter(p => p.categoryId === selectedType);
    }

    if (selectedCollection) {
      result = result.filter(p => p.collectionId === selectedCollection);
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => (b.id > a.id ? 1 : -1));
        break;
      default:
        result.sort((a, b) => (a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1));
        break;
    }

    return result;
  }, [selectedType, selectedCollection, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6">
        <Link href="/" className="hover:text-orange-500">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900">Shop All Kits</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-orange-100">
        <div>
          <h1 className="font-heading text-3xl md:text-5xl text-slate-900">
            Shop DIY Paint Kits 🎨
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Browse our complete range of non-toxic DIY painting kits for kids.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="md:hidden flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800 shadow-sm"
          >
            <Filter className="w-4 h-4 text-orange-500" />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-orange-100 px-3 py-2 rounded-2xl shadow-sm">
            <SlidersHorizontal className="w-4 h-4 text-orange-500 hidden sm:block" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs md:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Filter Sidebar */}
        <aside className={`w-full md:w-64 shrink-0 space-y-6 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
          
          {/* Kit Type Filter */}
          <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm">
            <h3 className="font-heading text-base text-slate-900 mb-3">Kit Tier</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedType('')}
                className={`w-full text-left text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                  selectedType === '' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-700 hover:bg-orange-50'
                }`}
              >
                All Kit Types
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedType(cat.id)}
                  className={`w-full text-left text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                    selectedType === cat.id ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-700 hover:bg-orange-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-80">₹{cat.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Collection Filter */}
          <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm">
            <h3 className="font-heading text-base text-slate-900 mb-3">Themes</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCollection('')}
                className={`w-full text-left text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                  selectedCollection === '' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 hover:bg-purple-50'
                }`}
              >
                All Theme Collections
              </button>
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollection(col.id)}
                  className={`w-full text-left text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    selectedCollection === col.id ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 hover:bg-purple-50'
                  }`}
                >
                  <span>{col.emoji}</span>
                  <span>{col.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filters */}
          {(selectedType || selectedCollection) && (
            <button
              onClick={() => {
                setSelectedType('');
                setSelectedCollection('');
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}

        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-500 mb-4">
            Showing <span className="text-slate-900 font-extrabold">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'kit' : 'kits'}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-orange-100 shadow-sm max-w-md mx-auto">
              <div className="text-5xl mb-3">🎨</div>
              <h3 className="font-heading text-xl text-slate-900 mb-2">No kits found!</h3>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Try selecting different kit tiers or themes to view available products.
              </p>
              <button 
                onClick={() => {
                  setSelectedType('');
                  setSelectedCollection('');
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-fun transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
