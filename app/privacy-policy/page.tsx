import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Rangaroo',
  description: 'How Rangaroo handles and protects your personal data securely.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-orange-100">
        <h1 className="text-3xl font-outfit font-extrabold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-orange max-w-none text-gray-700 space-y-6">
          <p>
            Rangaroo ("we" and "us") is the operator of (https://www.rangaroo.store). This privacy policy describes how we collect, use, and protect your personal information when you use our website.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as your name, email address, postal address, phone number, and payment information when you place an order, create an account, or contact our customer support.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-5">
            <li>Process and fulfill your orders, including sending emails to confirm your order status and shipment.</li>
            <li>Communicate with you about products, services, offers, and promotions.</li>
            <li>Improve our website, customer service, and shopping experience.</li>
            <li>Detect and prevent fraud and unauthorized transactions.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900">3. Payment Processing</h2>
          <p>
            We use Razorpay for processing payments. We/Razorpay do not store your card data on our servers. The data is encrypted through the Payment Card Industry Data Security Standard (PCI-DSS) when processing payment. Your purchase transaction data is only used as long as is necessary to complete your purchase transaction.
          </p>

          <h2 className="text-xl font-bold text-gray-900">4. Sharing of Information</h2>
          <p>
            We do not sell or rent your personal information to third parties. We may share your information with trusted third-party service providers (like courier partners and Razorpay) strictly for the purpose of fulfilling your order or operating our business securely.
          </p>

          <h2 className="text-xl font-bold text-gray-900">5. Your Rights</h2>
          <p>
            You have the right to access, update, or delete the personal information we have on you. If you wish to exercise these rights, please contact us at <a href="mailto:hello@rangaroo.store" className="text-orange-600 hover:underline">hello@rangaroo.store</a>.
          </p>

          <p className="mt-8 pt-6 border-t border-gray-100 text-sm">
            By using our site, you consent to our privacy policy. If you have any questions, please <Link href="/contact" className="text-orange-600 hover:underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
