import { Metadata } from 'next';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'Shop All DIY Paint Kits | Rangaroo',
  description: 'Explore our complete collection of non-toxic, plaster DIY paint kits for kids. Shop mini kits, fun kits, and signature collections for creative fun.',
};

export default function ProductsPage() {
  return <ProductsClient />;
}
