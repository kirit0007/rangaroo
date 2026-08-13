'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import { useAdminStore } from '@/store/adminStore';
import { Search } from 'lucide-react';
import { products as defaultProducts } from '@/data/products';

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const adminProducts = useAdminStore((state) => state.products);
  const allProducts = adminProducts && adminProducts.length > 0 ? adminProducts : defaultProducts;
  
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query) {
      const lowerQuery = query.toLowerCase();
      const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.description.toLowerCase().includes(lowerQuery)
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, allProducts]);

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Search className="text-orange-500 w-8 h-8" />
          <h1 className="text-3xl font-outfit font-bold text-gray-900">
            Search Results for "{query}"
          </h1>
        </div>

        {results.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No results found</h2>
            <p className="text-gray-500">We couldn't find any products matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
