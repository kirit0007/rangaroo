import { Metadata } from 'next';
import { getCollectionBySlug, getProductsByCollection } from '@/data/products';
import CollectionClient from './CollectionClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: 'Collection Not Found | Rangaroo',
    };
  }

  return {
    title: `${collection.name} Collection | Rangaroo DIY Paint Kits`,
    description: collection.description || `Explore our hand-picked selection of ${collection.name.toLowerCase()} themed painting kits.`,
    openGraph: {
      title: `${collection.name} Collection | Rangaroo`,
      description: collection.description || `Explore our hand-picked selection of ${collection.name.toLowerCase()} themed painting kits.`,
    },
  };
}

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const products = getProductsByCollection(collection.id);

  return <CollectionClient initialCollection={collection} initialProducts={products} />;
}
