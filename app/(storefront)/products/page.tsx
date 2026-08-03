'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <nav className="breadcrumb" style={{ marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--color-dark)' }}>
        <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>&gt;</span>
        <span>Shop</span>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>Shop All Kits 🎨</h1>
        <button 
          className="btn btn-outline" 
          style={{ display: 'none' /* Will manage responsive via CSS */ }}
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
        >
          Filters
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{ width: '250px', flexShrink: 0, display: isMobileFilterOpen ? 'block' : 'block' }}>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-dark)' }}>Sort By</h3>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--color-primary)' }}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>

          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-dark)' }}>Kit Type</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="type" checked={selectedType === ''} onChange={() => setSelectedType('')} />
                All Types
              </label>
              {categories.map(cat => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="type" checked={selectedType === cat.id} onChange={() => setSelectedType(cat.id)} />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-dark)' }}>Collection</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="collection" checked={selectedCollection === ''} onChange={() => setSelectedCollection('')} />
                All Collections
              </label>
              {collections.map(col => (
                <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="collection" checked={selectedCollection === col.id} onChange={() => setSelectedCollection(col.id)} />
                  {col.emoji} {col.name}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div style={{ flex: 1 }}>
          <p style={{ marginBottom: '1rem', color: 'var(--color-dark)', fontWeight: 'bold' }}>
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>

          {filteredProducts.length > 0 ? (
            <div className="grid-4" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {filteredProducts.map((product, index) => (
                <div key={product.id} style={{ animation: `fadeIn 0.5s ease forwards ${(index % 10) * 0.1}s`, opacity: 0 }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>😢</h2>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>No products found!</h3>
              <p>Try changing your filters to see more kits.</p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setSelectedType('');
                  setSelectedCollection('');
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        @media (max-width: 768px) {
          aside {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
