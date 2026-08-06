import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund & Returns Policy | Rangaroo',
  description: 'Our 7-day return and refund policy for Rangaroo DIY craft kits.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-orange-100">
        <h1 className="text-3xl font-outfit font-extrabold text-gray-900 mb-8">Refund & Returns Policy</h1>
        
        <div className="prose prose-orange max-w-none text-gray-700 space-y-6">
          <p>
            At Rangaroo, we want you and your little ones to be completely happy with your purchase. Our returns policy lasts 7 days. If 7 days have gone by since your delivery, unfortunately, we can’t offer you a refund or exchange.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900">1. Eligibility for Returns</h2>
          <p>
            To be eligible for a return, your item must be unused, unpainted, and in the same condition that you received it. It must also be in the original packaging with all included paints and brushes unopened.
          </p>
          <p>
            Several types of goods are exempt from being returned, including custom bulk orders, personalized gifts, and limited edition festival kits.
          </p>

          <h2 className="text-xl font-bold text-gray-900">2. Damaged or Defective Items</h2>
          <p>
            Plaster can be fragile. While we take utmost care in packaging, if you receive a damaged or broken figurine, please email us at <a href="mailto:hello@rangaroo.store" className="text-orange-600 hover:underline">hello@rangaroo.store</a> within 48 hours of delivery with photographic evidence. We will arrange a free replacement.
          </p>

          <h2 className="text-xl font-bold text-gray-900">3. Refunds Process</h2>
          <p>
            Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
          </p>
          <p>
            If approved, your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment via Razorpay within 5-7 working days.
          </p>

          <h2 className="text-xl font-bold text-gray-900">4. Shipping Returns</h2>
          <p>
            To return your product, please mail it to our registered warehouse address provided upon return authorization. You will be responsible for paying for your own shipping costs for returning your item unless the return is due to our error or a damaged product. Shipping costs are non-refundable.
          </p>

          <p className="mt-8 pt-6 border-t border-gray-100 text-sm">
            For further assistance regarding returns or refunds, please <Link href="/contact" className="text-orange-600 hover:underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
