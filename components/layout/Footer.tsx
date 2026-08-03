import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <h2 className="footer-logo">Rangaroo 🦘</h2>
          <p className="footer-tagline">Paint. Create. Imagine.</p>
        </div>
      </div>
      
      <div className="footer-columns">
        <div className="footer-column">
          <h3>Quick Links</h3>
          <Link href="/shop">Shop All</Link>
          <Link href="/about">About Us</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/track-order">Track Order</Link>
        </div>
        
        <div className="footer-column">
          <h3>Collections</h3>
          <Link href="/collections/dinosaur">Dinosaur</Link>
          <Link href="/collections/space">Space</Link>
          <Link href="/collections/vehicle">Vehicle</Link>
          <Link href="/collections/princess">Princess</Link>
          <Link href="/collections/harry-potter">Harry Potter</Link>
          <Link href="/collections/food">Food</Link>
        </div>

        <div className="footer-column">
          <h3>Legal</h3>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund">Refund Policy</Link>
          <Link href="/shipping">Shipping Policy</Link>
        </div>

        <div className="footer-column">
          <h3>Connect</h3>
          <p>Email: rangaroo.co@gmail.com</p>
          <p>Phone: +91 87936 87379</p>
          <p>WhatsApp: +91 87936 87379</p>
          <p>Instagram: @ranga.roo</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email" />
            <button type="button">Subscribe</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="payment-badges">
          <span>UPI</span> <span>Visa</span> <span>Mastercard</span> <span>RuPay</span>
        </div>
        <div className="social-icons">
          <Link href="#">📸</Link> <Link href="#">📘</Link> <Link href="#">▶️</Link>
        </div>
        <p className="made-with-love">Made with ❤️ in India 🇮🇳</p>
      </div>
    </footer>
  );
}
