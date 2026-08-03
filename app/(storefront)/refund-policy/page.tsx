import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <div className="container section-padding">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="current">Refund & Return Policy</span>
      </div>

      <div className="legal-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="h1 text-primary text-center" style={{ marginBottom: '2rem' }}>Refund & Return Policy</h1>
        
        <div className="card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <p>We want you to be completely happy with your Rangaroo purchase! If you have any issues with your order, please review our policy below.</p>

          <section>
            <h2 className="h2">1. Return Window</h2>
            <p>We accept returns for damaged, defective, or incorrect items within <strong>7 days of delivery</strong>.</p>
          </section>

          <section>
            <h2 className="h2">2. Non-Returnable Items</h2>
            <p>For safety and hygiene reasons, we cannot accept returns for:</p>
            <ul>
              <li>Opened paint pots</li>
              <li>Used or painted figurines</li>
              <li>Kits with missing components</li>
              <li>Customized items or special bulk orders</li>
              <li>Items purchased during a clearance sale</li>
            </ul>
          </section>

          <section>
            <h2 className="h2">3. How to Initiate a Return</h2>
            <p>If you receive a damaged or defective item, please follow these steps:</p>
            <ol style={{ paddingLeft: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Contact us at <strong>rangaroo.co@gmail.com</strong> or WhatsApp us at <strong>+91 87936 87379</strong> within 7 days of delivery.</li>
              <li>Include your Order Number in the message.</li>
              <li>Provide clear photographs/videos of the damaged item and the outer packaging.</li>
              <li>Our team will review your request within 48 hours and provide further instructions.</li>
            </ol>
          </section>

          <section>
            <h2 className="h2">4. Refund Timeline</h2>
            <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed and credited back to your original payment method within <strong>5-7 business days</strong>.</p>
          </section>

          <section>
            <h2 className="h2">5. Cancellations</h2>
            <ul>
              <li><strong>Before Dispatch:</strong> You can cancel your order for a full refund before it has been dispatched (usually within 24 hours of placing the order).</li>
              <li><strong>After Dispatch:</strong> Once an order is handed over to our shipping partner, it cannot be canceled. You may process it as a return following our standard policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="h2">6. Exchanges</h2>
            <p>We only replace items if they are defective or damaged during transit. Exchanges are subject to product availability. If the item is out of stock, a refund will be issued.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
