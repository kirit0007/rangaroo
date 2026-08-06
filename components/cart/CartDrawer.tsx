'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';

export default function CartDrawer() {
  const user = useAuthStore((state) => state.user);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const isCartOpen = useCartStore((state: any) => state.isOpen || state.isCartOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items) || [];
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getCoupon = useAdminStore((state) => state.getCoupon);

  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cartSubtotal = items.reduce((acc: number, item: any) => acc + (item.price * (item.quantity || 1)), 0);
  const shippingFee = cartSubtotal > 999 || items.length === 0 ? 0 : 60;

  const handleCheckoutClick = (e: React.MouseEvent) => {
    closeCart();
    if (!user) {
      e.preventDefault();
      toast.error('Please login or create an account to proceed to checkout');
      openAuthModal('login');
    }
  };
  
  // Calculate discount based on subtotal (assume flat rate for now or percentage if < 1)
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discount < 1 ? cartSubtotal * appliedCoupon.discount : appliedCoupon.discount) 
    : 0;

  const cartTotal = Math.max(0, cartSubtotal + shippingFee - discountAmount);
  const cartItemCount = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    
    // safe call to getCoupon, if undefined use a mock
    const coupon = typeof getCoupon === 'function' ? getCoupon(couponCode) : undefined;
    if (coupon) {
      const discountVal = coupon.discountType === 'percentage'
        ? (coupon.discountValue > 1 ? coupon.discountValue / 100 : coupon.discountValue)
        : coupon.discountValue;
      setAppliedCoupon({ code: coupon.code, discount: discountVal });
      toast.success('Coupon applied successfully!');
    } else {
      toast.error('Invalid or expired coupon code');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  return (
    <AnimatePresence>
      {mounted && isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cart-drawer-overlay"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="cart-drawer"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100/20 bg-white/40">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-[var(--brand-orange)]" size={24} />
                <h2 className="font-heading text-2xl font-bold text-gray-800">Your Cart</h2>
                <span className="bg-[var(--brand-orange)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cartItemCount}
                </span>
              </div>
              <button 
                onClick={closeCart}
                className="p-2 rounded-full hover:bg-white/60 transition-colors text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="text-6xl animate-bounceIn">🦘</div>
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-gray-800 mb-2">Your cart is empty!</h3>
                    <p className="text-gray-500 mb-6 text-sm">Looks like you haven't added any paint kits yet. Let's find something creative!</p>
                    <Link 
                      href="/products" 
                      onClick={closeCart}
                      className="btn-primary inline-flex"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cart Items */}
                  <div className="space-y-4">
                    <AnimatePresence>
                      {items.map((item: any) => {
                        const id = item.productId || item.id;
                        return (
                          <motion.div 
                            key={id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex gap-4 p-3 bg-white/60 rounded-2xl border border-white/40 shadow-sm"
                          >
                            <div className="w-20 h-20 bg-white rounded-xl overflow-hidden relative shrink-0">
                              <Image 
                                src={item.image || '/logo.png'} 
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div className="flex justify-between items-start gap-2">
                                <Link 
                                  href={`/products/${item.slug || id}`}
                                  onClick={closeCart}
                                  className="font-semibold text-sm text-gray-800 hover:text-[var(--brand-orange)] line-clamp-2"
                                >
                                  {item.name}
                                </Link>
                                <button 
                                  onClick={() => removeItem(id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-[var(--brand-orange)]">
                                  ₹{item.price.toLocaleString('en-IN')}
                                </span>
                                <div className="flex items-center gap-3 bg-white/80 rounded-full px-2 py-1 border border-gray-100">
                                  <button 
                                    onClick={() => updateQuantity(id, Math.max(1, (item.quantity || 1) - 1))}
                                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="text-xs font-semibold w-4 text-center">{item.quantity || 1}</span>
                                  <button 
                                    onClick={() => updateQuantity(id, (item.quantity || 1) + 1)}
                                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Coupon Section */}
                  <div className="bg-white/50 p-4 rounded-2xl border border-white/40">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Promo Code</h4>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-xl text-sm border border-green-200">
                        <span className="font-semibold flex items-center gap-1">
                          🎉 {appliedCoupon.code} applied
                        </span>
                        <button onClick={handleRemoveCoupon} className="hover:text-green-900"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Enter code" 
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--brand-orange)] transition-colors uppercase placeholder:normal-case"
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-black transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && (
              <div className="p-6 bg-white/80 border-t border-gray-100/50 backdrop-blur-md">
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-semibold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    {shippingFee === 0 ? (
                      <span className="font-semibold text-green-600">Free</span>
                    ) : (
                      <span className="font-semibold">₹{shippingFee.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  
                  <div className="h-px bg-gray-200 w-full my-2"></div>
                  
                  <div className="flex justify-between items-end">
                    <span className="text-gray-800 font-semibold text-base">Total</span>
                    <span className="text-2xl font-bold font-heading text-gray-900">
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <Link 
                  href="/checkout"
                  onClick={handleCheckoutClick}
                  className="w-full btn-primary justify-center text-lg py-3 flex items-center gap-2 group"
                >
                  Proceed to Checkout 
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
                  <Lock size={12} /> Secure Checkout with Razorpay
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
