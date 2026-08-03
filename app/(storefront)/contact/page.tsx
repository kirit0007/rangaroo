'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
  };

  return (
    <div className="container section-padding">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="current">Contact Us</span>
      </div>

      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h1 className="h1 text-primary">Get in Touch 👋</h1>
        <p className="subtitle">We'd love to hear from you!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h2 className="h2" style={{ marginBottom: '1.5rem' }}>Contact Information</h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong>📧 Email:</strong> <a href="mailto:rangaroo.co@gmail.com">rangaroo.co@gmail.com</a></li>
              <li><strong>📞 Phone:</strong> <a href="tel:+918793687379">+91 87936 87379</a></li>
              <li><strong>💬 WhatsApp:</strong> <a href="https://wa.me/918793687379" target="_blank" rel="noopener noreferrer">+91 87936 87379</a></li>
              <li><strong>📍 Location:</strong> India</li>
              <li><strong>📸 Instagram:</strong> <a href="https://instagram.com/ranga.roo" target="_blank" rel="noopener noreferrer">@ranga.roo</a></li>
            </ul>
          </div>

          <div className="card" style={{ backgroundColor: 'var(--color-cream-dark)' }}>
            <h3 className="h3 text-secondary">Bulk Orders & Birthdays 🎈</h3>
            <p style={{ margin: '1rem 0' }}>Planning a party? We offer special discounts and custom packaging for return gifts and bulk orders.</p>
            <a href="https://wa.me/918793687379?text=Hi! I'm interested in bulk orders." target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-block' }}>Chat on WhatsApp</a>
          </div>

          <div className="card" style={{ border: '1px solid #ddd' }}>
            <h3 className="h3" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Grievance Officer</h3>
            <p style={{ fontSize: '0.9rem', color: '#555' }}>
              <strong>Name:</strong> Grievance Redressal Officer<br />
              <strong>Email:</strong> rangaroo.co@gmail.com<br />
              <strong>Phone:</strong> +91 87936 87379<br />
              <strong>Response time:</strong> Within 48 hours
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="h2" style={{ marginBottom: '1.5rem' }}>Send us a Message</h2>
          {submitted ? (
            <div style={{ padding: '2rem', backgroundColor: 'var(--color-green-light, #e8f5e9)', color: 'var(--color-green, #4CAF50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <h3 className="h3">Thank You! 🎉</h3>
              <p>Your message has been sent successfully. We'll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Name</label>
                <input type="text" id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '2px solid #ddd', fontFamily: 'var(--font-body)' }} />
              </div>
              <div>
                <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email</label>
                <input type="email" id="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '2px solid #ddd', fontFamily: 'var(--font-body)' }} />
              </div>
              <div>
                <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Phone</label>
                <input type="tel" id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '2px solid #ddd', fontFamily: 'var(--font-body)' }} />
              </div>
              <div>
                <label htmlFor="subject" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Subject</label>
                <select id="subject" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '2px solid #ddd', fontFamily: 'var(--font-body)' }}>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Order Issue">Order Issue</option>
                  <option value="Bulk Orders">Bulk Orders</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Message</label>
                <textarea id="message" required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '2px solid #ddd', fontFamily: 'var(--font-body)', resize: 'vertical' }}></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Send Message 🚀</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
