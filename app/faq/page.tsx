import { Metadata } from 'next';
import FAQClient from './FAQClient';

export const metadata: Metadata = {
  title: 'FAQ | Rangaroo DIY Paint Kits',
  description: 'Frequently asked questions about Rangaroo DIY paint kits, shipping, safety, and return gifts.',
};

export default function FAQPage() {
  return <FAQClient />;
}
