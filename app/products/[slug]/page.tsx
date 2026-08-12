import { Metadata } from 'next';
import { getProductBySlug, products as defaultProducts, formatPrice } from '@/data/products';
import ProductClient from './ProductClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = defaultProducts.find(p => p.slug === slug || p.id === slug) || getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found | Rangaroo' };
  }

  const imageUrl = product.images?.[0] || '/logo.png';

  return {
    title: `${product.name} | Rangaroo DIY Paint Kits`,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} | Rangaroo`,
      description: product.description,
      url: `/products/${product.slug}`,
      images: [{ url: imageUrl }],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = defaultProducts.find(p => p.slug === slug || p.id === slug) || getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = defaultProducts
    .filter(p => p.collectionId === product.collectionId && p.id !== product.id)
    .slice(0, 4);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map(img => `https://www.rangaroo.store${img}`) || [],
    brand: {
      '@type': 'Brand',
      name: 'Rangaroo',
    },
    offers: {
      '@type': 'Offer',
      url: `https://www.rangaroo.store/products/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Rangaroo',
      },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.rangaroo.store' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://www.rangaroo.store/products' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://www.rangaroo.store/products/${product.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductClient initialProduct={product} initialRelatedProducts={relatedProducts} />
    </>
  );
}
