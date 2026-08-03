'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import Script from 'next/script';
import { ShieldCheck, Truck, ArrowLeft, Lock, CreditCard, CheckCircle2 } from 'lucide-react';

const STEP_SHIPPING = 1;
const STEP_REVIEW = 2;
const STEP_PAYMENT = 3;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, updateQuantity, clearCart } = useCartStore();
  
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
              toast.success('Payment successful! 🎉');
              localStorage.setItem('lastOrder', JSON.stringify({
                orderId: 'RNG-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
                total: total,
                shippingInfo
              }));
              clearCart();
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* Step Tracker */}
      <div className="flex items-center justify-center gap-3 mb-10">
        {[
          { num: 1, title: 'Shipping' },
          { num: 2, title: 'Review' },
          { num: 3, title: 'Payment' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading text-sm font-bold ${
              step >= s.num ? 'bg-orange-500 text-white shadow-fun' : 'bg-slate-200 text-slate-500'
            }`}>
              {s.num}
            </div>
            <span className={`text-xs font-bold ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
              {s.title}
            </span>
            {s.num < 3 && <div className="w-8 h-0.5 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-orange-100 shadow-xl">
        
        {/* STEP 1: SHIPPING INFORMATION */}
        {step === STEP_SHIPPING && (
          <form onSubmit={handleShippingSubmit} className="space-y-6">
            <div>
              <h2 className="font-heading text-2xl text-slate-900">Shipping Details 📦</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Enter where you'd like your Rangaroo DIY kit delivered.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={shippingInfo.name} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="e.g. Ananya Sharma"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (For WhatsApp Updates) *</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={shippingInfo.phone} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="9876543210"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={shippingInfo.email} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="ananya@gmail.com"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Flat / Building / House No., Street *</label>
                <input 
                  type="text" 
                  name="address1" 
                  value={shippingInfo.address1} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="House 42, Green Avenue"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Landmark / Area (Optional)</label>
                <input 
                  type="text" 
                  name="address2" 
                  value={shippingInfo.address2} 
                  onChange={handleInputChange} 
                  placeholder="Near City Park"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold" 
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code *</label>
                  <input 
                    type="text" 
                    name="pinCode" 
                    value={shippingInfo.pinCode} 
                    onChange={handleInputChange} 
                    required 
                    maxLength={6} 
                    pattern="[0-9]{6}" 
                    placeholder="560001"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={shippingInfo.city} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Bengaluru"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input 
                    type="text" 
                    name="state" 
                    value={shippingInfo.state} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Karnataka"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold" 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-heading text-lg py-4 rounded-2xl shadow-fun transition-all"
            >
              Continue to Order Review
            </button>
          </form>
        )}

        {/* STEP 2: ORDER REVIEW */}
        {step === STEP_REVIEW && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-2xl text-slate-900">Review Your Order 🛒</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Please confirm your items and shipping details before payment.</p>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.productId} className="pt-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center text-xl shrink-0 font-bold">
                      🎨
                    </div>
                    <div>
                      <h4 className="font-heading text-slate-900 text-sm">{item.name}</h4>
                      <p className="text-xs font-bold text-orange-500">₹{item.price} × {item.quantity}</p>
                    </div>
                  </div>

                  <div className="font-heading text-slate-900 text-base">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-900 font-bold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Pan-India Delivery</span>
                <span className="text-slate-900 font-bold">
                  {shippingFee === 0 ? <span className="text-emerald-600 font-black">FREE</span> : `₹${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-orange-500 font-heading text-2xl">₹{total}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(STEP_SHIPPING)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button 
                onClick={() => setStep(STEP_PAYMENT)}
                className="w-2/3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-heading text-lg py-4 rounded-2xl shadow-fun transition-all"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT */}
        {step === STEP_PAYMENT && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-heading text-2xl text-slate-900">100% Secure Payment</h2>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mt-1">
                You will be redirected to Razorpay to complete your secure payment of <strong className="text-slate-900 text-sm">₹{total}</strong>.
              </p>
            </div>

            <button 
              onClick={handlePayment} 
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 hover:opacity-95 text-white font-heading text-xl py-4 rounded-2xl shadow-fun transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-6 h-6" />
              <span>{isProcessing ? 'Processing Payment...' : `Pay ₹${total} Now`}</span>
            </button>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs font-semibold text-slate-500">
              <p className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>UPI (GPay, PhonePe, Paytm), Cards & Netbanking Accepted</span>
              </p>
              <button 
                onClick={() => setStep(STEP_REVIEW)} 
                className="text-slate-400 hover:text-slate-700 underline mt-2 block mx-auto"
              >
                Back to Review
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
