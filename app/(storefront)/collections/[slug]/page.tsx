'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { getCollectionBySlug, getProductsByCollection } from '@/data/products';

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const collection = getCollectionBySlug(slug);
  
  if (!collection) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary)' }}>Collection Not Found 🔍</h1>
        <p style={{ margin: '1rem 0' }}>We couldn't find the collection you're looking for.</p>
        <Link href="/products" className="btn btn-primary">Shop All Kits</Link>
      </div>
    );
  }

  const collectionProducts = getProductsByCollection(collection.id);

  // Generate a background color based on collection ID
  const getBgColor = (id: string) => {
    const colors = ['var(--primary)', 'var(--accent)', 'var(--secondary)', '#4CAF50', '#FF69B4', '#00BCD4'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div>
      {/* Collection Header */}
      <div style={{ 
        backgroundColor: getBgColor(collection.id),
        color: collection.id === 'space' || collection.id === 'dinosaur' ? 'white' : 'var(--dark)',
        padding: '4rem 1rem',
        textAlign: 'center',
        marginBottom: '3rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decor blobs */}
        <div style={{ position: 'absolute', top: '-20px', left: '-20px', fontSize: '100px', opacity: 0.2 }}>{collection.emoji}</div>
        <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', fontSize: '100px', opacity: 0.2 }}>{collection.emoji}</div>
        
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', marginBottom: '1rem' }}>
            {collection.emoji} {collection.name} Collection
          </h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
            {collection.description}
          </p>
          <div style={{ 
            display: 'inline-block', 
            padding: '0.5rem 1rem', 
            backgroundColor: 'rgba(255,255,255,0.8)', 
            borderRadius: 'var(--radius-full)',
            color: 'var(--dark)',
            fontWeight: 'bold'
          }}>
            {collectionProducts.length} {collectionProducts.length === 1 ? 'Kit' : 'Kits'} Available
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '0 1rem 4rem 1rem' }}>
        <nav className="breadcrumb" style={{ marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--dark)' }}>
          <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>&gt;</span>
          <Link href="/products" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Collections</Link>
          <span style={{ margin: '0 0.5rem' }}>&gt;</span>
          <span>{collection.name}</span>
        </nav>

        {collectionProducts.length > 0 ? (
          <div className="grid-4" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {collectionProducts.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</h2>
            <h2 style={{ color: 'var(--accent)', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
              Coming Soon!
            </h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
              We're currently mixing paints and preparing molds for the {collection.name} collection. 
              Check back soon for exciting new kits!
            </p>
            <Link href="/products" className="btn btn-primary">Explore Other Collections</Link>
          </div>
        )}
      </div>
    </div>
  );
}
