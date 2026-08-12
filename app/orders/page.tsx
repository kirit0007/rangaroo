import { Metadata } from 'next';
import OrdersClient from './OrdersClient';

export const metadata: Metadata = {
  title: 'Track Orders | Rangaroo',
  description: 'Track your Rangaroo DIY paint kit orders, view invoices, and manage returns.',
  alternates: {
    canonical: '/orders',
  },
  openGraph: {
    title: 'Track Orders | Rangaroo',
    description: 'Track your Rangaroo DIY paint kit orders, view invoices, and manage returns.',
    url: '/orders',
  },
  robots: {
    index: false,
  },
};

export default function MyOrdersPage() {
  return <OrdersClient />;
}
