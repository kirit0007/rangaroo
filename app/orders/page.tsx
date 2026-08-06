import { Metadata } from 'next';
import OrdersClient from './OrdersClient';

export const metadata: Metadata = {
  title: 'Track Orders | Rangaroo',
  description: 'Track your Rangaroo DIY paint kit orders, view invoices, and manage returns.',
};

export default function MyOrdersPage() {
  return <OrdersClient />;
}
