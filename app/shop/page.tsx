import { Metadata } from 'next';
import ProductsClient from '@/app/products/ProductsClient';

export const metadata: Metadata = {
  title: 'Shop All DIY Craft Paint Kits | Rangaroo',
  description:
    'Discover our handcrafted, non-toxic plaster paint kits for kids. Mini kits, fun return gifts, and deluxe signature sets delivered safely across India.',
  alternates: {
    canonical: '/shop',
  },
  openGraph: {
    title: 'Shop All DIY Craft Paint Kits | Rangaroo',
    description:
      'Discover our handcrafted, non-toxic plaster paint kits for kids. Mini kits, fun return gifts, and deluxe signature sets delivered safely across India.',
    url: '/shop',
  },
};

export default function ShopPage() {
  return <ProductsClient />;
}
