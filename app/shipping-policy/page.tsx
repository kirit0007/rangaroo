import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shipping Policy | Rangaroo',
  description: 'Information about Rangaroo shipping times, costs, and delivery partners across India.',
  alternates: {
    canonical: '/shipping-policy',
  },
  openGraph: {
    title: 'Shipping Policy | Rangaroo',
    description: 'Information about Rangaroo shipping times, costs, and delivery partners across India.',
    url: '/shipping-policy',
  },
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-orange-100">
        <h1 className="text-3xl font-outfit font-extrabold text-gray-900 mb-8">Shipping Policy</h1>
        
        <div className="prose prose-orange max-w-none text-gray-700 space-y-6">
          <p>
            At Rangaroo, we are committed to delivering your DIY craft kits safely and securely across India. Please review our shipping policy below.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900">1. Processing Time</h2>
          <p>
            All orders are processed and dispatched within 1-2 business days (excluding weekends and public holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.
          </p>

          <h2 className="text-xl font-bold text-gray-900">2. Shipping Rates & Delivery Estimates</h2>
          <p>
            We offer shipping across all major pin codes in India.
          </p>
          <ul className="list-disc pl-5">
            <li><strong>Orders above ₹499:</strong> Free Standard Shipping.</li>
            <li><strong>Orders below ₹499:</strong> A flat shipping fee of ₹60 will be applied at checkout.</li>
          </ul>
          <p>
            Standard delivery usually takes 4-7 business days depending on your location. Deliveries to major metro cities typically arrive within 3-5 days.
          </p>

          <h2 className="text-xl font-bold text-gray-900">3. Order Tracking</h2>
          <p>
            Once your order has shipped, you will receive an email and SMS notification containing a tracking number and a link to track your package. Please allow 24 hours for the tracking information to become active.
          </p>

          <h2 className="text-xl font-bold text-gray-900">4. Damages During Shipping</h2>
          <p>
            We pack our plaster figurines with extreme care, using protective materials. However, if your order arrives damaged, please save all packaging materials and damaged goods, and contact us within 48 hours of delivery at <a href="mailto:hello@rangaroo.store" className="text-orange-600 hover:underline">hello@rangaroo.store</a> with photos of the damage. We will arrange a replacement at no extra cost.
          </p>

          <p className="mt-8 pt-6 border-t border-gray-100 text-sm">
            If you have any further questions, please don't hesitate to <Link href="/contact" className="text-orange-600 hover:underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
