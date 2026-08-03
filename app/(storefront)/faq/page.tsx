'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
  { q: "What age group are Rangaroo kits suitable for?", a: "Our kits are designed for children aged 5 and above. Younger children can enjoy painting with adult supervision. The kits are beginner-friendly and perfect for first-time painters!" },
  { q: "Are the paints safe for children?", a: "Absolutely! We use EN71 certified, non-toxic, child-safe colors. Our tempera paints are washable, and our acrylic paints are water-based and safe for kids. All materials meet European safety standards." },
  { q: "What's the difference between kit types?", a: "Mini Kit (₹149): 1-2 figurines, 4 tempera colors, 1 brush. Fun Kit (₹199): 2-3 figurines, 6 tempera colors, 1 brush. Creative Kit (₹299): 3 figurines, 6 acrylic colors, 2 brushes, premium box. Signature (₹499): All 6 figurines, 8 acrylic colors, 2 brushes, gift box." },
  { q: "Do you ship across India?", a: "Yes! We offer pan-India shipping. Free shipping on orders above ₹499. Orders below ₹499 have a flat shipping fee of ₹60." },
  { q: "How long does delivery take?", a: "Orders are dispatched within 1-2 business days. Delivery typically takes 3-7 business days depending on your location." },
  { q: "Can I order in bulk for birthday parties?", a: "Yes! We love being part of birthday celebrations. We offer attractive bulk discounts, custom packaging, and timely delivery. Contact us on WhatsApp for bulk order inquiries." },
  { q: "What is your return policy?", a: "We accept returns for damaged or defective products within 7 days of delivery. Please contact us with photos of the issue. Opened paint pots and used items cannot be returned." },
  { q: "What payment methods do you accept?", a: "We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Wallets. All payments are secured by Razorpay." },
  { q: "Can I track my order?", a: "Yes! Once your order is shipped, you'll receive a tracking link via email/WhatsApp. You can also contact us for tracking updates." },
  { q: "What makes Rangaroo different?", a: "Our kits are designed with love in India, using premium quality figurines and safe, non-toxic colors. We focus on creative learning, screen-free fun, and meaningful play experiences." }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container section-padding">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="current">FAQs</span>
      </div>

      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h1 className="h1 text-primary">Frequently Asked Questions 🤔</h1>
        <p className="subtitle">Find answers to common questions about our products and services.</p>
        
        <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <input 
            type="text" 
            placeholder="Search FAQs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              borderRadius: 'var(--radius-full)', 
              border: '2px solid var(--color-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '1.1rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => {
            const actualIndex = faqs.findIndex(f => f.q === faq.q);
            const isOpen = openIndex === actualIndex;
            
            return (
              <div 
                key={actualIndex} 
                className="card" 
                style={{ 
                  padding: '0', 
                  overflow: 'hidden', 
                  border: isOpen ? '2px solid var(--color-secondary)' : '2px solid #eee'
                }}
              >
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : actualIndex)}
                  style={{ 
                    width: '100%', 
                    padding: '1.5rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: isOpen ? 'var(--color-cream)' : 'white',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-headings)',
                    fontSize: '1.1rem',
                    color: isOpen ? 'var(--color-primary)' : 'var(--color-dark)'
                  }}
                >
                  {faq.q}
                  <span style={{ fontSize: '1.5rem', color: isOpen ? 'var(--color-secondary)' : '#ccc' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                
                {isOpen && (
                  <div style={{ padding: '0 1.5rem 1.5rem', lineHeight: '1.6' }}>
                    <hr style={{ borderTop: '1px dashed #eee', margin: '0 0 1rem 0' }} />
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center" style={{ padding: '3rem' }}>
            <p>No FAQs found matching "{searchTerm}".</p>
          </div>
        )}
      </div>

      <div className="text-center card" style={{ maxWidth: '600px', margin: '3rem auto', backgroundColor: 'var(--color-purple-light, #f3e5f5)' }}>
        <h2 className="h2 text-accent">Still have questions?</h2>
        <p style={{ margin: '1rem 0' }}>Can't find the answer you're looking for? Please contact our friendly team.</p>
        <Link href="/contact" className="btn btn-accent">Contact Us</Link>
      </div>
    </div>
  );
}
