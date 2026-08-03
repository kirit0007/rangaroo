import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="container section-padding">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="current">Privacy Policy</span>
      </div>

      <div className="legal-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="h1 text-primary text-center" style={{ marginBottom: '2rem' }}>Privacy Policy</h1>
        
        <div className="card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <p><strong>Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
          
          <section>
            <h2 className="h2">1. Introduction</h2>
            <p>Welcome to Rangaroo ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and share your information when you visit our website (rangaroo.store) or make a purchase from us.</p>
          </section>

          <section>
            <h2 className="h2">2. Information We Collect</h2>
            <p>We collect personal information that you voluntarily provide to us when registering at the Website, expressing an interest in obtaining information about us or our products, or otherwise contacting us.</p>
            <ul>
              <li><strong>Personal Info:</strong> Name, email address, phone number, and delivery address.</li>
              <li><strong>Payment Details:</strong> We process payments through Razorpay. We do not store your credit/debit card numbers or UPI IDs directly on our servers.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our website.</li>
            </ul>
          </section>

          <section>
            <h2 className="h2">3. How We Use Your Information</h2>
            <p>We use the information we collect or receive for the following purposes:</p>
            <ul>
              <li>To fulfill and manage your orders, payments, and returns.</li>
              <li>To communicate with you regarding your order status or support inquiries.</li>
              <li>To improve our website, products, and services.</li>
              <li>To send marketing and promotional communications (you can opt-out at any time).</li>
            </ul>
          </section>

          <section>
            <h2 className="h2">4. Information Sharing</h2>
            <p>We only share information with third parties necessary to provide our services:</p>
            <ul>
              <li><strong>Payment Processors:</strong> Razorpay (to process your payments securely).</li>
              <li><strong>Shipping Partners:</strong> To deliver your orders to your address.</li>
            </ul>
            <p><strong>We do not sell, rent, or trade your personal information to third parties.</strong></p>
          </section>

          <section>
            <h2 className="h2">5. Data Security</h2>
            <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.</p>
          </section>

          <section>
            <h2 className="h2">6. Cookies</h2>
            <p>We may use cookies and similar tracking technologies to access or store information. This helps us provide you with a good experience when you browse our website and allows us to improve our site.</p>
          </section>

          <section>
            <h2 className="h2">7. Your Rights (DPDP Act 2023)</h2>
            <p>Under the Digital Personal Data Protection Act 2023 of India, you have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request erasure of your data in certain circumstances.</li>
              <li>Withdraw your consent at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="h2">8. Children's Privacy</h2>
            <p>While our products are for children, our website is intended for parents and guardians. We do not knowingly collect personal information from children under the age of 18 without verifiable parental consent.</p>
          </section>

          <section>
            <h2 className="h2">9. Contact Us</h2>
            <p>If you have questions or comments about this policy, or wish to exercise your rights, you may contact our Grievance Officer:</p>
            <p>
              Email: rangaroo.co@gmail.com<br />
              Phone/WhatsApp: +91 87936 87379
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
