import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Rangaroo',
  description: 'Terms and conditions for using the Rangaroo e-commerce platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-orange-100">
        <h1 className="text-3xl font-outfit font-extrabold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-orange max-w-none text-gray-700 space-y-6">
          <p>
            Welcome to Rangaroo. These Terms of Service govern your use of our website and services. By accessing or using our website, you agree to be bound by these terms.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900">1. Online Store Terms</h2>
          <p>
            By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence. You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws).
          </p>
          
          <h2 className="text-xl font-bold text-gray-900">2. Products or Services</h2>
          <p>
            Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy. We have made every effort to display as accurately as possible the colors and images of our products that appear at the store.
          </p>

          <h2 className="text-xl font-bold text-gray-900">3. Accuracy of Billing and Account Information</h2>
          <p>
            We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. You agree to provide current, complete and accurate purchase and account information for all purchases made at our store.
          </p>

          <h2 className="text-xl font-bold text-gray-900">4. Modifications to the Service and Prices</h2>
          <p>
            Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
          </p>

          <h2 className="text-xl font-bold text-gray-900">5. Governing Law</h2>
          <p>
            These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India.
          </p>

          <p className="mt-8 pt-6 border-t border-gray-100 text-sm">
            Questions about the Terms of Service should be sent to us at <a href="mailto:hello@rangaroo.store" className="text-orange-600 hover:underline">hello@rangaroo.store</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
