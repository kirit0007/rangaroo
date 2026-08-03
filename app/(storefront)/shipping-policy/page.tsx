import Link from 'next/link';

export default function ShippingPolicyPage() {
  return (
    <div className="container section-padding">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="current">Shipping & Delivery Policy</span>
      </div>

      <div className="legal-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="h1 text-primary text-center" style={{ marginBottom: '2rem' }}>Shipping & Delivery Policy</h1>
        
        <div className="card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <section>
            <h2 className="h2">1. Dispatch & Processing Time</h2>
            <p>We process and dispatch all orders within <strong>1-2 business days</strong> (excluding weekends and public holidays) after receiving your order confirmation.</p>
          </section>

          <section>
            <h2 className="h2">2. Delivery Time</h2>
            <p>Once dispatched, standard delivery typically takes <strong>3-7 business days</strong> depending on your location within India. Remote areas or specific pin codes may require additional transit time.</p>
          </section>

          <section>
            <h2 className="h2">3. Shipping Charges</h2>
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-cream-dark)', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}><strong>Orders above ₹499:</strong> FREE Pan-India Shipping 🎉</li>
                <li><strong>Orders below ₹499:</strong> Flat shipping fee of ₹60</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="h2">4. Serviceability</h2>
            <p>We offer Pan-India coverage, delivering to most pin codes across the country through our trusted courier partners.</p>
          </section>

          <section>
            <h2 className="h2">5. Order Tracking</h2>
            <p>Once your order has been dispatched, you will receive a tracking link via email and/or WhatsApp. You can use this link to track the real-time status of your delivery.</p>
          </section>

          <section>
            <h2 className="h2">6. Undeliverable Packages</h2>
            <p>Our delivery partners will attempt delivery up to 3 times before returning the package to us (RTO). Please ensure you provide a complete and accurate shipping address along with a working phone number to avoid delivery failures.</p>
          </section>

          <section>
            <h2 className="h2">7. Damages in Transit</h2>
            <p>If you notice that the external packaging is severely damaged or tampered with at the time of delivery, please refuse to accept the package. If you discover damage after opening the package, please contact us within 48 hours of delivery with clear photographs, and we will assist you.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
