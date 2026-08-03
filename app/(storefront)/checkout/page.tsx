'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import Script from 'next/script';

const STEP_SHIPPING = 1;
const STEP_REVIEW = 2;
const STEP_PAYMENT = 3;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, updateQuantity } = useCartStore();
  
  const [step, setStep] = useState(STEP_SHIPPING);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address1: '',
    address2: '',
    pinCode: '',
    city: '',
    state: ''
  });

  useEffect(() => {
    if (items.length === 0) {
      router.push('/products');
    }
  }, [items, router]);

  const subtotal = getSubtotal();
  const shippingFee = subtotal >= 499 ? 0 : 60;
  const total = subtotal + shippingFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.email || !shippingInfo.address1 || !shippingInfo.pinCode || !shippingInfo.city || !shippingInfo.state) {
      toast.error('Please fill all required fields');
      return;
    }
    if (shippingInfo.pinCode.length !== 6) {
      toast.error('PIN Code must be 6 digits');
      return;
    }
    setStep(STEP_REVIEW);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          customerInfo: {
            name: shippingInfo.name,
            email: shippingInfo.email,
            phone: shippingInfo.phone,
          }
        })
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Rangaroo',
        description: 'DIY Paint Kit Order',
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success('Payment successful!');
              localStorage.setItem('lastOrder', JSON.stringify({
                orderId: 'RNG-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
                total: total,
                shippingInfo
              }));
              router.push('/order-confirmation');
            } else {
              toast.error('Payment verification failed');
              setIsProcessing(false);
            }
          } catch (error) {
            toast.error('Error verifying payment');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: shippingInfo.name,
          email: shippingInfo.email,
          contact: shippingInfo.phone,
        },
        theme: {
          color: '#FF6B35'
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
            setIsProcessing(false);
          }
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();

    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="checkout-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <h1 className="heading-primary" style={{ textAlign: 'center', marginBottom: '2rem' }}>Checkout</h1>
      
      <div className="checkout-steps" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 1rem' }}>
        <div style={{ fontWeight: step >= STEP_SHIPPING ? 'bold' : 'normal', color: step >= STEP_SHIPPING ? 'var(--color-primary, #FF6B35)' : '#999' }}>1. Shipping</div>
        <div style={{ fontWeight: step >= STEP_REVIEW ? 'bold' : 'normal', color: step >= STEP_REVIEW ? 'var(--color-primary, #FF6B35)' : '#999' }}>2. Review</div>
        <div style={{ fontWeight: step >= STEP_PAYMENT ? 'bold' : 'normal', color: step >= STEP_PAYMENT ? 'var(--color-primary, #FF6B35)' : '#999' }}>3. Payment</div>
      </div>

      <div className="checkout-content card" style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', border: '2px solid var(--color-primary, #FF6B35)' }}>
        {step === STEP_SHIPPING && (
          <form onSubmit={handleShippingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 className="heading-secondary">Shipping Information</h2>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Full Name *</label>
              <input type="text" name="name" value={shippingInfo.name} onChange={handleInputChange} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Phone Number *</label>
                <input type="tel" name="phone" value={shippingInfo.phone} onChange={handleInputChange} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc' }} />
              </div>
              <div className="form-group" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Email *</label>
                <input type="email" name="email" value={shippingInfo.email} onChange={handleInputChange} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc' }} />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Address Line 1 *</label>
              <input type="text" name="address1" value={shippingInfo.address1} onChange={handleInputChange} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc' }} />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Address Line 2 (Optional)</label>
              <input type="text" name="address2" value={shippingInfo.address2} onChange={handleInputChange} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>PIN Code *</label>
                <input type="text" name="pinCode" value={shippingInfo.pinCode} onChange={handleInputChange} required maxLength={6} pattern="[0-9]{6}" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc' }} />
              </div>
              <div className="form-group" style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>City *</label>
                <input type="text" name="city" value={shippingInfo.city} onChange={handleInputChange} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc' }} />
              </div>
              <div className="form-group" style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>State *</label>
                <input type="text" name="state" value={shippingInfo.state} onChange={handleInputChange} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ccc' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '2rem', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', backgroundColor: 'var(--color-primary, #FF6B35)', color: 'white', border: 'none' }}>
              Continue to Review
            </button>
          </form>
        )}

        {step === STEP_REVIEW && (
          <div className="review-section">
            <h2 className="heading-secondary" style={{ marginBottom: '1rem' }}>Order Review</h2>
            
            <div className="cart-items" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {items.map(item => (
                <div key={item.productId} className="cart-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-background, #FFF8F0)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                      🎨
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 'bold' }}>{item.name}</h3>
                      <p style={{ margin: 0, color: '#666' }}>₹{item.price}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#f0f0f0', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#f0f0f0', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                  
                  <div style={{ fontWeight: 'bold' }}>
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-section" style={{ backgroundColor: '#fafafa', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 'bold' }}>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Shipping {shippingFee === 0 && <span style={{ color: 'var(--color-green, #4CAF50)', fontSize: '0.8rem' }}>(Free above ₹499)</span>}</span>
                <span style={{ fontWeight: 'bold' }}>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #eee', fontSize: '1.25rem' }}>
                <span style={{ fontWeight: 'bold' }}>Total</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-primary, #FF6B35)' }}>₹{total}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setStep(STEP_SHIPPING)} className="btn" style={{ flex: '1', padding: '1rem', borderRadius: '2rem', fontWeight: 'bold', backgroundColor: 'transparent', border: '2px solid #ccc', cursor: 'pointer' }}>Back</button>
              <button onClick={() => setStep(STEP_PAYMENT)} className="btn btn-primary" style={{ flex: '2', padding: '1rem', borderRadius: '2rem', fontWeight: 'bold', backgroundColor: 'var(--color-primary, #FF6B35)', color: 'white', border: 'none', cursor: 'pointer' }}>Proceed to Payment</button>
            </div>
          </div>
        )}

        {step === STEP_PAYMENT && (
          <div className="payment-section" style={{ textAlign: 'center', padding: '1rem' }}>
            <h2 className="heading-secondary" style={{ marginBottom: '1.5rem' }}>Secure Payment</h2>
            
            <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #c8e6c9' }}>
              <span style={{ fontSize: '1.25rem' }}>🔒</span>
              <span style={{ fontWeight: 'bold' }}>100% Secure Payment</span>
            </div>
            
            <p style={{ marginBottom: '2rem', color: '#555' }}>
              You will be redirected to Razorpay to complete your secure payment of <strong style={{ fontSize: '1.25rem', color: '#000' }}>₹{total}</strong>.
            </p>
            
            <button 
              onClick={handlePayment} 
              disabled={isProcessing}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1.25rem', borderRadius: '2rem', fontSize: '1.25rem', fontWeight: 'bold', backgroundColor: 'var(--color-primary, #FF6B35)', color: 'white', border: 'none', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              {isProcessing ? 'Processing...' : `Pay ₹${total}`}
            </button>
            
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'bold' }}>Powered by Razorpay</span>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '2rem', filter: 'grayscale(1)', opacity: 0.6 }}>
                💳 🏦 📱
              </div>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>Cards, UPI, Net Banking Accepted</span>
            </div>
            
            <button onClick={() => setStep(STEP_REVIEW)} style={{ marginTop: '2rem', background: 'none', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
              Back to Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
