import { Metadata } from 'next';
import { getProductBySlug, products as defaultProducts } from '@/data/products';
import ProductClient from './ProductClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const product = defaultProducts.find(p => p.slug === slug || p.id === slug) || getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Rangaroo',
    };
  }

  const imageUrl = product.images?.[0] ? `https://www.rangaroo.store${product.images[0]}` : undefined;

  return {
    title: `${product.name} | Rangaroo DIY Paint Kits`,
    description: product.description,
    openGraph: {
      title: `${product.name} | Rangaroo`,
      description: product.description,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
  };
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const product = defaultProducts.find(p => p.slug === slug || p.id === slug) || getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = defaultProducts
    .filter(p => p.collectionId === product.collectionId && p.id !== product.id)
    .slice(0, 4);

  return <ProductClient initialProduct={product} initialRelatedProducts={relatedProducts} />;
}
