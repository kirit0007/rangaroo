import { Metadata } from 'next';
import { getCollectionBySlug, getProductsByCollection } from '@/data/products';
import CollectionClient from './CollectionClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: 'Collection Not Found | Rangaroo',
    };
  }

  return {
    title: `${collection.name} Collection | Rangaroo DIY Paint Kits`,
    description: collection.description || `Explore our hand-picked selection of ${collection.name.toLowerCase()} themed painting kits.`,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title: `${collection.name} Collection | Rangaroo`,
      description: collection.description || `Explore our hand-picked selection of ${collection.name.toLowerCase()} themed painting kits.`,
      url: `/collections/${slug}`,
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const products = getProductsByCollection(collection.id);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.rangaroo.store' },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: 'https://www.rangaroo.store/collections' },
      { '@type': 'ListItem', position: 3, name: `${collection.name} Collection`, item: `https://www.rangaroo.store/collections/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CollectionClient initialCollection={collection} initialProducts={products} />
    </>
  );
}
