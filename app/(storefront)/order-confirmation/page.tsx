'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // Clear cart on successful order
    clearCart();
    
    // Retrieve order details from localStorage
    const savedOrder = localStorage.getItem('lastOrder');
    if (savedOrder) {
      setOrderDetails(JSON.parse(savedOrder));
    }
  }, [clearCart]);

  return (
    <div className="order-confirmation-container" style={{ maxWidth: '600px', margin: '3rem auto', padding: '2rem', textAlign: 'center' }}>
      
      {/* Basic CSS Confetti Animation */}
      <div className="confetti-wrapper" style={{ position: 'relative' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'bounce 2s infinite' }}>🎉</div>
      </div>
      
      <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--color-green, #4CAF50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
        <span style={{ color: 'white', fontSize: '3rem' }}>✓</span>
      </div>

      <h1 className="heading-primary" style={{ marginBottom: '0.5rem', color: 'var(--color-dark, #2D2C2E)' }}>Order Placed Successfully!</h1>
      
      {orderDetails && (
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
          Order Number: <strong style={{ color: '#000' }}>{orderDetails.orderId}</strong>
        </p>
      )}

      <div style={{ backgroundColor: 'var(--color-background, #FFF8F0)', padding: '1.5rem', borderRadius: '1rem', border: '2px dashed var(--color-secondary, #FFD23F)', marginBottom: '2rem', textAlign: 'left' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 'bold' }}>Order Summary</h2>
        {orderDetails && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#555' }}>Total Amount</span>
              <strong style={{ fontSize: '1.1rem' }}>₹{orderDetails.total}</strong>
            </div>
            <div style={{ borderTop: '1px solid #ddd', margin: '1rem 0' }}></div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Shipping Address</h3>
            <p style={{ color: '#555', lineHeight: '1.5', margin: 0 }}>
              {orderDetails.shippingInfo.name}<br/>
              {orderDetails.shippingInfo.address1}<br/>
              {orderDetails.shippingInfo.address2 && <>{orderDetails.shippingInfo.address2}<br/></>}
              {orderDetails.shippingInfo.city}, {orderDetails.shippingInfo.state} {orderDetails.shippingInfo.pinCode}
            </p>
          </>
        )}
        <div style={{ borderTop: '1px solid #ddd', margin: '1rem 0' }}></div>
        <p style={{ color: 'var(--color-primary, #FF6B35)', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🚚</span> Estimated delivery: 5-7 business days
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link href="/track-order" style={{ display: 'block', padding: '1rem', backgroundColor: 'var(--color-primary, #FF6B35)', color: 'white', borderRadius: '2rem', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>
          Track Your Order
        </Link>
        <Link href="/products" style={{ display: 'block', padding: '1rem', backgroundColor: 'transparent', border: '2px solid var(--color-primary, #FF6B35)', color: 'var(--color-primary, #FF6B35)', borderRadius: '2rem', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>
          Continue Shopping
        </Link>
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
        <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918793687379'}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#25D366', textDecoration: 'none', fontWeight: 'bold' }}>
          <span style={{ fontSize: '1.5rem' }}>💬</span> Questions? Chat with us on WhatsApp
        </a>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}} />
    </div>
  );
}
