'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getProductBySlug, getProductsByCollection, formatPrice } from '@/data/products';
import { useCartStore } from '@/store/cartStore';
import ProductCard from '@/components/product/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const product = getProductBySlug(slug);
  const addItem = useCartStore((state) => state.addItem);
  
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary)' }}>Product Not Found 🦘</h1>
        <p style={{ margin: '1rem 0' }}>Oops! We couldn't find the kit you're looking for.</p>
        <Link href="/products" className="btn btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const relatedProducts = getProductsByCollection(product.collectionId)
    .filter(p => p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`Added ${quantity} ${product.name} to cart!`);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push('/checkout');
  };

  const incrementQuantity = () => setQuantity(q => q + 1);
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1));

  const categoryLabels: Record<string, string> = {
    'mini-kit': 'Mini Kit',
    'fun-kit': 'Fun Kit',
    'creative-kit': 'Creative Kit',
    'signature-collection': 'Signature Collection'
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <nav className="breadcrumb" style={{ marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--dark)' }}>
        <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>&gt;</span>
        <Link href="/products" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Shop</Link>
        <span style={{ margin: '0 0.5rem' }}>&gt;</span>
        <span>{product.name}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '4rem' }} className="pdp-grid">
        {/* Left: Image Gallery */}
        <div>
          <div 
            style={{ 
              width: '100%', 
              aspectRatio: '1/1', 
              borderRadius: 'var(--radius-lg)', 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '2rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
          >
            {product.name} <br/> (Main View)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[0, 1, 2, 3].map((idx) => (
              <div 
                key={idx}
                onClick={() => setActiveImage(idx)}
                style={{ 
                  aspectRatio: '1/1', 
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: activeImage === idx ? '3px solid var(--accent)' : '3px solid transparent'
                }}
              >
                View {idx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <span style={{ 
              display: 'inline-block', 
              padding: '0.25rem 0.75rem', 
              backgroundColor: 'var(--secondary)', 
              color: 'var(--dark)', 
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              {categoryLabels[product.categoryId] || 'Kit'}
            </span>
            <h1 style={{ color: 'var(--primary)', fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {product.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffb400' }}>
              <span>★★★★★</span>
              <span style={{ color: 'var(--dark)', fontSize: '0.9rem' }}>(4.8 Average Rating)</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--dark)' }}>{formatPrice(product.price)}</span>
            <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: '#888', marginBottom: '0.25rem' }}>
              {formatPrice(product.price * 1.5)}
            </span>
            <span style={{ 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              padding: '0.25rem 0.5rem', 
              borderRadius: 'var(--radius-sm)', 
              fontWeight: 'bold',
              marginBottom: '0.25rem'
            }}>
              33% OFF
            </span>
          </div>

          <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>{product.shortDescription}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="badge" style={{ background: 'var(--bg-cream)', border: '1px solid var(--primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>🎨 {product.categoryId === 'mini-kit' ? '4' : product.categoryId.includes('signature') ? '8' : '6'} Colors</span>
            <span className="badge" style={{ background: 'var(--bg-cream)', border: '1px solid var(--accent)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>👦 Age 3+</span>
            <span className="badge" style={{ background: 'var(--bg-cream)', border: '1px solid var(--secondary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>✨ Beginner Friendly</span>
          </div>

          <div style={{ margin: '1rem 0' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Quantity:</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', border: '2px solid var(--primary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <button onClick={decrementQuantity} style={{ padding: '0.5rem 1rem', background: 'white', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>-</button>
                <div style={{ padding: '0.5rem 1rem', background: 'white', borderLeft: '2px solid var(--primary)', borderRight: '2px solid var(--primary)', fontWeight: 'bold' }}>{quantity}</div>
                <button onClick={incrementQuantity} style={{ padding: '0.5rem 1rem', background: 'white', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handleAddToCart} style={{ padding: '1rem', fontSize: '1.1rem' }}>
              🛒 Add to Cart
            </button>
            <button className="btn btn-secondary" onClick={handleBuyNow} style={{ padding: '1rem', fontSize: '1.1rem' }}>
              ⚡ Buy Now
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-cream)', borderRadius: 'var(--radius-lg)', marginTop: '1rem' }}>
            <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🛡️</div>
              <div>Safe &<br/>Non-Toxic</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📦</div>
              <div>Free Shipping<br/>₹499+</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🔄</div>
              <div>Easy<br/>Returns</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '4rem' }} className="pdp-details-grid">
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ color: 'var(--accent)', fontFamily: 'var(--font-heading)', marginBottom: '1.5rem' }}>What's in the Kit? 🎁</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {product.kitContents.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                <span>✅</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ color: 'var(--primary)', fontFamily: 'var(--font-heading)', marginBottom: '1.5rem' }}>Product Description 📖</h2>
          <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
            {product.description}
          </p>
          <p style={{ lineHeight: 1.8 }}>
            Let your little one's imagination run wild with Rangaroo's DIY painting kits. Our non-toxic paints are perfectly safe for children, and the figures are made from high-quality, durable materials that will last for years as a proud display piece in their room!
          </p>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div>
          <h2 style={{ color: 'var(--primary)', fontFamily: 'var(--font-heading)', marginBottom: '2rem', textAlign: 'center' }}>You Might Also Like 🌟</h2>
          <div className="grid-4" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {relatedProducts.map(rp => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
