'use client';

import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/data/products';

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the product page
    addItem(product);
    toast.success(`${product.name} added to cart! 🎨`);
  };

  const discountPercentage = product.compareAtPrice 
    ? calculateDiscount(product.price, product.compareAtPrice)
    : 0;

  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg';

  return (
    <Link href={`/products/${product.slug}`} className="product-card">
      <div className="product-image-container" style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1/1',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '1rem'
      }}>
        {discountPercentage > 0 && (
          <div className="discount-badge" style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'var(--primary)',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            zIndex: 2
          }}>
            {discountPercentage}% OFF
          </div>
        )}
        <div style={{ fontSize: '1.1rem', zIndex: 1 }}>
          {product.name}
        </div>
      </div>
      
      <div className="product-info" style={{ padding: '1rem 0' }}>
        <h3 className="product-name" style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.1rem',
          color: 'var(--dark)',
          marginBottom: '0.5rem',
          lineHeight: 1.3
        }}>{product.name}</h3>
        
        <div className="product-kit-info" style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          marginBottom: '0.5rem'
        }}>
          <span>{product.figureCount} {product.figureCount === 1 ? 'Figure' : 'Figures'}</span> • <span>{product.paintType}</span>
        </div>
        
        <div className="product-price-row" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <span className="product-price" style={{
            fontWeight: 'bold',
            fontSize: '1.2rem',
            color: 'var(--primary)'
          }}>{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="product-mrp" style={{
              textDecoration: 'line-through',
              color: '#888',
              fontSize: '0.9rem'
            }}>{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={handleAddToCart}
          style={{
            width: '100%',
            padding: '0.6rem 1rem',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          Add to Cart 🛒
        </button>
      </div>
    </Link>
  );
}
