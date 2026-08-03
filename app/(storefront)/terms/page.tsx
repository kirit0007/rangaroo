import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="container section-padding">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="current">Terms & Conditions</span>
      </div>

      <div className="legal-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="h1 text-primary text-center" style={{ marginBottom: '2rem' }}>Terms & Conditions</h1>
        
        <div className="card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <section>
            <h2 className="h2">1. Acceptance of Terms</h2>
            <p>By accessing and using rangaroo.store ("Website"), you agree to comply with and be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our website.</p>
          </section>

          <section>
            <h2 className="h2">2. Use of Website</h2>
            <p>You may use this Website only for lawful purposes and in accordance with these Terms. You agree not to use the Website in any way that violates any applicable federal, state, local, or international law or regulation.</p>
          </section>

          <section>
            <h2 className="h2">3. Products and Pricing</h2>
            <ul>
              <li>All prices are displayed in Indian Rupees (INR) and are inclusive of all applicable taxes.</li>
              <li>We strive to display colors and images of our products as accurately as possible; however, we cannot guarantee that your device's display will be entirely accurate.</li>
              <li>Prices for our products are subject to change without notice. We reserve the right to modify or discontinue any product without notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="h2">4. Orders and Payment</h2>
            <p>All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason. We use Razorpay as our secure payment gateway. By placing an order, you confirm that the payment details provided are valid and correct.</p>
          </section>

          <section>
            <h2 className="h2">5. Shipping and Delivery</h2>
            <p>Please refer to our <Link href="/shipping-policy" className="text-secondary" style={{ textDecoration: 'underline' }}>Shipping Policy</Link> for detailed information on dispatch times, delivery estimates, and shipping charges.</p>
          </section>

          <section>
            <h2 className="h2">6. Returns and Refunds</h2>
            <p>Our return and refund processes are governed by our <Link href="/refund-policy" className="text-secondary" style={{ textDecoration: 'underline' }}>Refund & Return Policy</Link>.</p>
          </section>

          <section>
            <h2 className="h2">7. Intellectual Property</h2>
            <p>All content included on the Website, such as text, graphics, logos, images, and software, is the property of Rangaroo and is protected by Indian copyright and intellectual property laws.</p>
          </section>

          <section>
            <h2 className="h2">8. Limitation of Liability</h2>
            <p>Rangaroo shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the website or our products.</p>
          </section>

          <section>
            <h2 className="h2">9. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in the state where our business operates.</p>
          </section>

          <section>
            <h2 className="h2">10. Contact Information</h2>
            <p>Questions about the Terms & Conditions should be sent to us at rangaroo.co@gmail.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
