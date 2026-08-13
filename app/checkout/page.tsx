'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Truck, CreditCard, ShoppingBag, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/data/products';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const items = useCartStore((state) => state.items) || [];
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTotal = useCartStore((state) => state.getTotal);
  const getShippingFee = useCartStore((state) => state.getShippingFee);
  const getGiftWrapFee = useCartStore((state) => state.getGiftWrapFee);
  const getTaxAmount = useCartStore((state) => state.getTaxAmount);
  const threshold = useAdminStore((state) => state.siteSettings?.freeShippingThreshold) || 499;
  const isGiftWrapped = useCartStore((state) => state.isGiftWrapped);
  const giftMessage = useCartStore((state) => state.giftMessage);
  
  const appliedCoupon: any = null; // Placeholder for coupon implementation
  const addOrder = useAdminStore((state) => state.addOrder);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Shipping Form State
  const [formData, setFormData] = useState({
    fullName: user?.fullName || (user as any)?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address1: '',
    address2: '',
    pincode: '',
    city: '',
    state: '',
  });

  const [isFetchingPincode, setIsFetchingPincode] = useState(false);

  // Allow guest checkout or logged-in users
  useEffect(() => {
    // Guest checkout is enabled by default
  }, []);

  // Redirect if empty cart
  useEffect(() => {
    if (items.length === 0 && !isLoading && user) {
      toast.error('Your cart is empty');
      router.push('/products');
    }
  }, [items, router, isLoading, user]);

  // Handle Pincode Auto-fill
  useEffect(() => {
    const fetchPincodeDetails = async () => {
      if (formData.pincode.length === 6) {
        setIsFetchingPincode(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            setFormData(prev => ({
              ...prev,
              city: postOffice.District,
              state: postOffice.State
            }));
            toast.success('Location updated automatically');
          } else {
            toast.error('Invalid Pincode');
          }
        } catch (error) {
          console.error('Pincode fetch error:', error);
        } finally {
          setIsFetchingPincode(false);
        }
      }
    };

    fetchPincodeDetails();
  }, [formData.pincode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'pincode' && value.length > 6) return;
    if (name === 'phone' && value.length > 10) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinueToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address1 || !formData.pincode || !formData.city || !formData.state) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        if ((window as any).Razorpay) {
          resolve(true);
          return;
        }
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    
    try {
      // 1. Fetch server-calculated order details and create pending order
      const orderRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(it => ({ productId: it.productId, quantity: it.quantity })),
          couponCode: appliedCoupon?.code || null,
          isGiftWrapped,
          giftMessage,
          shippingAddress: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            addressLine1: formData.address1,
            addressLine2: formData.address2,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
        }),
      });
      
      const orderData = await orderRes.json();
      
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize checkout');
      }

      const { razorpayOrderId, key: keyId, orderId, orderNumber, amountInPaise } = orderData;

      // 2. Load SDK Script safely AFTER order creation
      const res = await loadRazorpayScript();
      if (!res || !(window as any).Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 3. Razorpay Checkout Options
      const options: any = {
        key: keyId,
        amount: amountInPaise,
        currency: 'INR',
        name: 'Rangaroo Store',
        description: 'DIY Paint Kits Order',
        image: '/logo.png',
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify HMAC signature on backend and finalize order
            if (response.razorpay_signature) {
              const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                toast.error(verifyData.error || 'Payment signature verification failed. Please contact support.');
                setIsLoading(false);
                return;
              }

              // Payment successful and verified
              clearCart();
              toast.success('Payment Verified & Order Confirmed! 🎉');
              router.push(`/order-confirmation?orderNumber=${encodeURIComponent(orderNumber)}`);
            } else {
              throw new Error('No signature returned from Razorpay');
            }
          } catch (error: any) {
            console.error('Payment processing error:', error);
            toast.error(error.message || 'Payment verification failed');
            setIsLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email || 'customer@example.com',
          contact: formData.phone,
        },
        theme: {
          color: '#FF5722',
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            toast('Checkout modal closed', { icon: 'ℹ️' });
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);

      paymentObject.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response.error);
        toast.error(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
        setIsLoading(false);
      });

      paymentObject.open();

    } catch (error: any) {
      console.error('Razorpay initialization error:', error);
      toast.error(error.message || 'Failed to launch payment popup. Please try again.');
      setIsLoading(false);
    }
  };

  if (items.length === 0) return null; // Will redirect via useEffect

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Steps */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-outfit font-bold text-gray-900 mb-6">Secure Checkout</h1>
          
          <div className="flex items-center justify-center max-w-md mx-auto">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 1 ? 'bg-orange-100 text-orange-600 border-2 border-orange-500' : 'bg-gray-100'}`}>
                {step > 1 ? <Check className="w-5 h-5" /> : 1}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider">Shipping</span>
            </div>
            
            <div className={`flex-grow h-1 mx-4 rounded ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
            
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 2 ? 'bg-orange-100 text-orange-600 border-2 border-orange-500' : 'bg-gray-100'}`}>
                2
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider">Review & Pay</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <div className="flex-grow lg:w-2/3">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <Truck className="w-6 h-6 text-orange-500" />
                    <h2 className="text-2xl font-outfit font-bold text-gray-900">Shipping Details</h2>
                  </div>

                  <form onSubmit={handleContinueToReview} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name *</label>
                        <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" placeholder="Enter your name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm font-medium">+91</span>
                          <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="flex-1 px-4 py-3 rounded-r-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" placeholder="10-digit mobile number" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email Address (Optional for tracking)</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" placeholder="your@email.com" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Address Line 1 *</label>
                      <input required type="text" name="address1" value={formData.address1} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" placeholder="House/Flat No., Building Name, Street" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Address Line 2 (Optional)</label>
                      <input type="text" name="address2" value={formData.address2} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" placeholder="Landmark, Area, etc." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Pincode *</label>
                        <div className="relative">
                          <input required type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" placeholder="6-digit PIN" />
                          {isFetchingPincode && <Loader2 className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 animate-spin" />}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">City *</label>
                        <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-gray-50" readOnly placeholder="Auto-filled" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">State *</label>
                        <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-gray-50" readOnly placeholder="Auto-filled" />
                      </div>
                    </div>

                    <div className="pt-6">
                      <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg">
                        Continue to Review <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-6 h-6 text-purple-500" />
                      <h2 className="text-2xl font-outfit font-bold text-gray-900">Review Order</h2>
                    </div>
                    <button onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-orange-600 flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Edit Shipping
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-2">Delivering to:</h3>
                    <p className="text-gray-800 font-medium">{formData.fullName} ({formData.phone})</p>
                    <p className="text-gray-600 text-sm mt-1">
                      {formData.address1}, {formData.address2 && `${formData.address2}, `}
                      {formData.city}, {formData.state} - {formData.pincode}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h3 className="font-semibold text-gray-900">Items ({items.length})</h3>
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-white">
                        <div className="relative w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                          <Image src={item.image || '/logo.png'} alt={item.name} fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex-grow flex flex-col justify-center">
                          <h4 className="font-medium text-gray-900 line-clamp-1">{item.name}</h4>
                          <div className="text-sm text-gray-500 mb-1">Qty: {item.quantity}</div>
                          <div className="font-bold text-orange-600">{formatPrice(item.price * item.quantity)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={handlePlaceOrder} 
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                      {isLoading ? 'Processing...' : `Proceed to Pay ${formatPrice(getTotal(threshold))}`}
                    </button>
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      100% Secure Payments via Razorpay
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-outfit font-bold text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">{formatPrice(getShippingFee(threshold))}</span>
                </div>
                {getSubtotal() >= threshold && (
                  <div className="flex justify-between text-green-600">
                    <span>Shipping Discount</span>
                    <span>-₹60</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="font-bold text-gray-900 text-lg">Total Amount</span>
                <div className="text-right">
                  <span className="font-bold text-orange-600 text-2xl">{formatPrice(getTotal(threshold))}</span>
                  <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                </div>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 flex gap-3 text-sm text-orange-800 border border-orange-100">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-orange-500" />
                <p>We use SSL encryption to ensure your payment details are safe and secure.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
