'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Truck, CreditCard, ShoppingBag, ShieldCheck, ArrowLeft, ArrowRight, Loader2, Sparkles, Tag, X, Lock } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import FreeShippingBar from '@/components/storefront/FreeShippingBar';

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items) || [];
  const clearCart = useCartStore((state) => state.clearCart);
  const isGiftWrapped = useCartStore((state) => state.isGiftWrapped);
  const giftMessage = useCartStore((state) => state.giftMessage);
  const getCoupon = useAdminStore((state) => state.getCoupon);
  const freeShippingThreshold = useAdminStore((state) => state.siteSettings?.freeShippingThreshold) || 499;

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);

  // Promo code state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountValue: number; discountType: string } | null>(null);

  // Frictionless Guest Checkout Form State
  const [formData, setFormData] = useState({
    fullName: user?.fullName || (user as any)?.name || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    address1: '',
    address2: '',
    pincode: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync user details if authenticated
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Handle Indian Pincode Auto-fill
  useEffect(() => {
    const fetchPincodeDetails = async () => {
      if (formData.pincode.trim().length === 6 && /^\d{6}$/.test(formData.pincode.trim())) {
        setIsFetchingPincode(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode.trim()}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            setFormData((prev) => ({
              ...prev,
              city: postOffice.District || postOffice.Block || prev.city,
              state: postOffice.State || prev.state,
            }));
            toast.success(`Location set: ${postOffice.District}, ${postOffice.State}`);
          } else {
            toast.error('Pincode not found. Please enter city & state manually.');
          }
        } catch (error) {
          console.error('Pincode lookup error:', error);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const cartSubtotal = items.reduce(
    (acc: number, item: any) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const shippingFee = cartSubtotal >= freeShippingThreshold || items.length === 0 ? 0 : 60;
  const giftWrapFee = isGiftWrapped ? 30 : 0;

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      const pct = appliedCoupon.discountValue > 1 ? appliedCoupon.discountValue / 100 : appliedCoupon.discountValue;
      discountAmount = Math.round(cartSubtotal * pct);
    } else {
      discountAmount = Math.min(cartSubtotal, appliedCoupon.discountValue);
    }
  }

  const orderTotal = Math.max(1, cartSubtotal + shippingFee + giftWrapFee - discountAmount);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a coupon code');
      return;
    }
    const found = typeof getCoupon === 'function' ? getCoupon(code) : undefined;
    if (found && (found.isActive === undefined || found.isActive === true)) {
      setAppliedCoupon({
        code: found.code,
        discountValue: found.discountValue,
        discountType: found.discountType,
      });
      toast.success(`Coupon ${found.code} applied! 🎉`);
    } else if (code === 'FIRST10' || code === 'WELCOME10') {
      setAppliedCoupon({ code, discountValue: 10, discountType: 'percentage' });
      toast.success(`Coupon ${code} applied (10% OFF)! 🎉`);
    } else if (code === 'CRAFT50') {
      setAppliedCoupon({ code, discountValue: 50, discountType: 'fixed' });
      toast.success(`Coupon ${code} applied (₹50 OFF)! 🎉`);
    } else {
      toast.error('Invalid or expired coupon code');
    }
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.address1.trim()) {
      toast.error('Please enter your delivery street address');
      return;
    }
    if (!formData.pincode.trim() || formData.pincode.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit Indian Pincode');
      return;
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      toast.error('Please enter your city and state');
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadRazorpayScript = (): Promise<boolean> => {
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

  const handlePlaceOrderAndPay = async () => {
    setIsLoading(true);

    try {
      // 1. Authoritative server checkout call
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it: any) => ({
            productId: it.productId || it.id,
            quantity: Number(it.quantity) || 1,
          })),
          couponCode: appliedCoupon?.code || null,
          isGiftWrapped: !!isGiftWrapped,
          giftMessage: giftMessage || '',
          shippingAddress: {
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            addressLine1: formData.address1.trim(),
            addressLine2: formData.address2.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            pincode: formData.pincode.trim(),
          },
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize order');
      }

      const { razorpayOrderId, key: keyId, orderNumber, amountInPaise, guestTrackingToken } = orderData;

      // 2. Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !(window as any).Razorpay) {
        throw new Error('Payment gateway SDK could not be loaded. Please check your connection.');
      }

      // 3. Launch Razorpay Checkout Modal
      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: 'INR',
        name: 'Rangaroo Craft Store',
        description: `Order ${orderNumber} - Non-toxic DIY Kits`,
        image: '/logo.png',
        order_id: razorpayOrderId,
        handler: async function (paymentResponse: any) {
          try {
            // Verify HMAC signature server-side
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id || razorpayOrderId,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              toast.error(verifyData.error || 'Payment verification failed. Please contact support.');
              setIsLoading(false);
              return;
            }

            // Payment succeeded and verified!
            clearCart();
            toast.success('Payment verified & order placed! 🎉');

            const redirectUrl = `/order-confirmation?orderNumber=${encodeURIComponent(orderNumber)}${
              guestTrackingToken ? `&token=${encodeURIComponent(guestTrackingToken)}` : ''
            }`;
            router.push(redirectUrl);
          } catch (err: any) {
            console.error('Payment verification error:', err);
            toast.error(err.message || 'Payment verification failed');
            setIsLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#FF5722',
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            toast('Payment modal closed', { icon: 'ℹ️' });
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function (failRes: any) {
        console.error('Razorpay payment failed:', failRes.error);
        toast.error(`Payment failed: ${failRes.error?.description || 'Transaction declined'}`);
        setIsLoading(false);
      });

      razorpayInstance.open();
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error(error.message || 'Unable to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#FF5722]/10 text-[#FF5722] flex items-center justify-center text-4xl mb-4">
          🛒
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
          Your Cart is Empty
        </h1>
        <p className="text-gray-600 mb-8 max-w-sm text-sm">
          You haven&apos;t added any plaster painting kits to your cart yet. Let&apos;s pick something colorful!
        </p>
        <Link
          href="/shop"
          className="min-h-[44px] min-w-[44px] px-8 py-3 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-full font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          Browse All Kits <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb / Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#FF5722] transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span
              className={`px-3 py-1 rounded-full ${
                step === 1 ? 'bg-[#FF5722] text-white shadow-xs' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              1. Delivery Details
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span
              className={`px-3 py-1 rounded-full ${
                step === 2 ? 'bg-[#FF5722] text-white shadow-xs' : 'bg-[#EFE8DE] text-gray-600'
              }`}
            >
              2. Order Review & Pay
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Left Column (Form or Review) */}
          <div className="lg:col-span-7 space-y-6">
            {step === 1 ? (
              <form
                onSubmit={handleProceedToReview}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE8DE] shadow-xs space-y-6"
              >
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3 py-1 rounded-full inline-block mb-2">
                    Frictionless Guest Checkout
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-900">
                    Where Should We Ship Your Kit?
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    No forced account registration required. We ship across 28,000+ Indian pincodes.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g., Rohit Sharma"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-[#FFFDF9]"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                        Email Address (for Order Updates) *
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        required
                        placeholder="e.g., rohit@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-[#FFFDF9]"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                        Mobile Number (10 digits) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 font-mono">
                          +91
                        </span>
                        <input
                          id="phone"
                          type="tel"
                          name="phone"
                          required
                          maxLength={10}
                          placeholder="9876543210"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full min-h-[44px] pl-12 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-[#FFFDF9] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Street Address */}
                  <div>
                    <label htmlFor="address1" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                      Flat / House No., Building, Street *
                    </label>
                    <input
                      id="address1"
                      type="text"
                      name="address1"
                      required
                      placeholder="e.g., Flat 402, Sunshine Apartments, MG Road"
                      value={formData.address1}
                      onChange={handleInputChange}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-[#FFFDF9]"
                    />
                  </div>

                  <div>
                    <label htmlFor="address2" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                      Landmark / Colony (Optional)
                    </label>
                    <input
                      id="address2"
                      type="text"
                      name="address2"
                      placeholder="e.g., Near City Park"
                      value={formData.address2}
                      onChange={handleInputChange}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-[#FFFDF9]"
                    />
                  </div>

                  {/* Pincode, City, State */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="pincode" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Pincode *</span>
                        {isFetchingPincode && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF5722]" />}
                      </label>
                      <input
                        id="pincode"
                        type="text"
                        name="pincode"
                        required
                        maxLength={6}
                        placeholder="400001"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-[#FFFDF9] font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                        City / District *
                      </label>
                      <input
                        id="city"
                        type="text"
                        name="city"
                        required
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-[#FFFDF9]"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                        State *
                      </label>
                      <input
                        id="state"
                        type="text"
                        name="state"
                        required
                        placeholder="Maharashtra"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-[#FFFDF9]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EFE8DE] flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-[#FF5722] hover:bg-[#E64A19] text-white font-heading font-bold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    Continue to Order Review <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Final Review and Razorpay Trigger */
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE8DE] shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#EFE8DE]">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block mb-1">
                      Step 2 of 2
                    </span>
                    <h2 className="text-2xl font-heading font-extrabold text-gray-900">
                      Review & Secure Payment
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-[#FF5722] hover:underline min-h-[44px] flex items-center"
                  >
                    Edit Shipping Info
                  </button>
                </div>

                {/* Delivery Snapshot */}
                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EFE8DE] text-xs sm:text-sm text-gray-700 space-y-1">
                  <p className="font-bold text-gray-900">{formData.fullName}</p>
                  <p className="text-gray-600">{formData.email} • +91 {formData.phone}</p>
                  <p className="text-gray-600">
                    {formData.address1}
                    {formData.address2 ? `, ${formData.address2}` : ''}, {formData.city}, {formData.state} - {formData.pincode}
                  </p>
                </div>

                {/* Line Items Snapshot */}
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-sm text-gray-800 uppercase tracking-wider">
                    Order Items ({items.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 hide-scrollbar">
                    {items.map((it: any) => {
                      const id = it.productId || it.id;
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs sm:text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-200">
                              <Image
                                src={it.image || '/logo.png'}
                                alt={it.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 line-clamp-1">{it.name}</p>
                              <p className="text-xs text-gray-500 font-mono">Qty: {it.quantity || 1}</p>
                            </div>
                          </div>
                          <span className="font-bold text-gray-900 font-mono">
                            ₹{((Number(it.price) || 0) * (Number(it.quantity) || 1)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Action Button */}
                <div className="pt-4 border-t border-[#EFE8DE] space-y-3">
                  <button
                    type="button"
                    onClick={handlePlaceOrderAndPay}
                    disabled={isLoading}
                    className="w-full min-h-[50px] py-4 px-6 bg-gradient-to-r from-[#FF5722] to-[#FFA000] hover:from-[#E64A19] hover:to-[#FF8F00] text-white font-heading font-extrabold text-lg rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Preparing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" /> Pay ₹{orderTotal.toLocaleString('en-IN')} via Razorpay
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Encrypted with 256-bit SSL • Supports UPI, Cards, NetBanking & Wallets
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary & Coupon Promo */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE8DE] shadow-xs space-y-6">
              <h2 className="font-heading font-bold text-xl text-gray-900 pb-3 border-b border-[#EFE8DE]">
                Order Summary
              </h2>

              {/* Free Shipping Alert */}
              <FreeShippingBar currentSubtotal={cartSubtotal} threshold={freeShippingThreshold} />

              {/* Promo Code Input */}
              <div className="space-y-2 pt-2">
                <label htmlFor="couponInput" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Discount Promo Code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                    <span>
                      🎉 Code &quot;{appliedCoupon.code}&quot; applied (-₹{discountAmount.toLocaleString('en-IN')})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode('');
                        toast.success('Coupon removed');
                      }}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-emerald-700 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      id="couponInput"
                      type="text"
                      placeholder="e.g. FIRST10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-gray-300 uppercase text-xs font-semibold tracking-wider bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="min-h-[44px] min-w-[44px] px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-3 border-t border-[#EFE8DE] text-sm text-gray-700 font-medium">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-mono font-bold text-gray-900">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {isGiftWrapped && (
                  <div className="flex justify-between text-amber-800">
                    <span>Artisanal Gift Wrap & Note</span>
                    <span className="font-mono font-bold">+₹30</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Savings</span>
                    <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping & Delivery</span>
                  {shippingFee === 0 ? (
                    <span className="font-bold text-emerald-700">FREE Express Delivery</span>
                  ) : (
                    <span className="font-mono font-bold text-gray-900">₹{shippingFee}</span>
                  )}
                </div>

                <div className="pt-3 border-t border-[#EFE8DE] flex justify-between items-baseline">
                  <span className="font-heading text-lg font-extrabold text-gray-900">Total Payable</span>
                  <span className="font-heading text-2xl font-black text-[#FF5722] font-mono">
                    ₹{orderTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-[#EFE8DE] grid grid-cols-2 gap-3 text-[11px] text-gray-600">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Non-Toxic</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <Truck className="w-4 h-4 text-[#FF5722] shrink-0" />
                  <span>Doorstep Courier</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
