'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Lock, Sparkles, Tag, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useAdminStore } from '@/store/adminStore';
import FreeShippingBar from '@/components/storefront/FreeShippingBar';

export default function CartDrawer() {
  const isOpen = useCartStore((state: any) => state.isOpen ?? state.isCartOpen ?? false);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items) || [];
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const isGiftWrapped = useCartStore((state) => state.isGiftWrapped);
  const setIsGiftWrapped = useCartStore((state) => state.setGiftWrap);
  const giftMessage = useCartStore((state) => state.giftMessage);
  const setGiftMessage = useCartStore((state) => state.setGiftMessage);
  const getCoupon = useAdminStore((state) => state.getCoupon);

  const [mounted, setMounted] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountValue: number; discountType: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const freeShippingThreshold = useAdminStore((state) => state.siteSettings?.freeShippingThreshold) || 499;

  const cartSubtotal = items.reduce(
    (acc: number, item: any) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const shippingFee = cartSubtotal >= freeShippingThreshold || items.length === 0 ? 0 : 60;
  const giftWrapFee = isGiftWrapped ? 30 : 0;

  // Authoritative discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      const pct = appliedCoupon.discountValue > 1 ? appliedCoupon.discountValue / 100 : appliedCoupon.discountValue;
      discountAmount = Math.round(cartSubtotal * pct);
    } else {
      discountAmount = Math.min(cartSubtotal, appliedCoupon.discountValue);
    }
  }

  const finalTotal = Math.max(0, cartSubtotal + shippingFee + giftWrapFee - discountAmount);
  const totalItemCount = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
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
      toast.success(`Coupon ${found.code} applied successfully! 🎉`);
    } else {
      // Fallback for default promo codes
      if (code === 'FIRST10' || code === 'WELCOME10') {
        setAppliedCoupon({
          code,
          discountValue: 10,
          discountType: 'percentage',
        });
        toast.success(`Coupon ${code} applied (10% OFF)! 🎉`);
      } else if (code === 'CRAFT50') {
        setAppliedCoupon({
          code,
          discountValue: 50,
          discountType: 'fixed',
        });
        toast.success(`Coupon ${code} applied (₹50 OFF)! 🎉`);
      } else {
        toast.error('Invalid or expired promo code');
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    toast.success('Coupon removed');
  };

  return (
    <AnimatePresence>
      {mounted && isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Cart">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer container with Indian DTC craft colors */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative w-full max-w-md sm:max-w-lg h-full bg-[#FFFDF9] text-gray-900 border-l border-[#EFE8DE] shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#EFE8DE] bg-[#FFFDF9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5722]/10 text-[#FF5722] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-gray-900">
                    Your Craft Box
                  </h2>
                  <p className="text-xs text-gray-600">
                    {totalItemCount} {totalItemCount === 1 ? 'kit selected' : 'kits selected'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart drawer"
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl border border-[#EFE8DE] bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5722]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Free Shipping Progress Bar */}
            {items.length > 0 && (
              <div className="p-4 bg-white/70 border-b border-[#EFE8DE]">
                <FreeShippingBar currentSubtotal={cartSubtotal} threshold={freeShippingThreshold} />
              </div>
            )}

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 hide-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                  <div className="w-20 h-20 rounded-full bg-[#FF5722]/10 text-[#FF5722] flex items-center justify-center text-4xl mb-4">
                    🎨
                  </div>
                  <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                    Your craft cart is empty
                  </h3>
                  <p className="text-sm text-gray-600 max-w-xs mb-8">
                    Discover safe, non-toxic plaster paint kits designed for hours of creative fun!
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="min-h-[44px] min-w-[44px] px-8 py-3 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-full font-bold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    Explore Paint Kits <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Item List */}
                  {items.map((item: any) => {
                    const id = item.productId || item.id;
                    const qty = item.quantity || 1;
                    return (
                      <motion.div
                        key={id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex gap-4 p-3.5 bg-white rounded-2xl border border-[#EFE8DE] shadow-xs"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-[#FFFDF9] border border-[#EFE8DE] overflow-hidden shrink-0">
                          <Image
                            src={item.image || '/logo.png'}
                            alt={item.name}
                            fill
                            sizes="88px"
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.src = '/logo.png';
                            }}
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-2">
                            <Link
                              href={`/products/${item.slug || id}`}
                              onClick={closeCart}
                              className="font-heading font-bold text-sm text-gray-900 hover:text-[#FF5722] line-clamp-2 transition-colors"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeItem(id)}
                              aria-label={`Remove ${item.name} from cart`}
                              className="min-w-[44px] min-h-[44px] w-11 h-11 -mr-2 -mt-2 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#EFE8DE]/60">
                            <span className="font-extrabold text-base text-[#FF5722] font-mono">
                              ₹{(Number(item.price) * qty).toLocaleString('en-IN')}
                            </span>

                            {/* Accessible Quantity Stepper (44x44px touch targets) */}
                            <div className="flex items-center bg-[#FFFDF9] border border-[#EFE8DE] rounded-xl overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(id, Math.max(1, qty - 1))}
                                aria-label={`Decrease quantity of ${item.name}`}
                                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5722]"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-gray-900 font-mono select-none">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(id, qty + 1)}
                                aria-label={`Increase quantity of ${item.name}`}
                                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-[#FF5722]"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Gift Wrap & Birthday Card Note */}
                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isGiftWrapped}
                        onChange={(e) => setIsGiftWrapped(e.target.checked)}
                        className="w-5 h-5 rounded text-[#FF5722] accent-[#FF5722] focus:ring-[#FF5722]"
                      />
                      <span className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        🎁 Add Artisanal Gift Packaging & Note <span className="text-[#FF5722] font-mono">(+₹30)</span>
                      </span>
                    </label>
                    {isGiftWrapped && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <textarea
                          rows={2}
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="Write a custom birthday or celebration message for the little artist..."
                          className="w-full bg-white p-3 rounded-xl border border-amber-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF5722] resize-none"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Promo Code Input Card */}
                  <div className="p-4 bg-white rounded-2xl border border-[#EFE8DE] shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#FF5722]" /> Have a Promo Code?
                      </span>
                    </div>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Coupon &quot;{appliedCoupon.code}&quot; applied (-₹{discountAmount.toLocaleString('en-IN')})
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          aria-label="Remove promo code"
                          className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-emerald-700 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. FIRST10, CRAFT50"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-gray-300 uppercase text-xs sm:text-sm font-semibold tracking-wider bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="min-h-[44px] min-w-[44px] px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Summary & Frictionless Guest Checkout CTA */}
            {items.length > 0 && (
              <div className="p-5 sm:p-6 bg-[#FFFDF9] border-t border-[#EFE8DE] shadow-lg space-y-4">
                <div className="space-y-2 text-xs sm:text-sm text-gray-700 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900 font-mono">
                      ₹{cartSubtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {isGiftWrapped && (
                    <div className="flex justify-between text-amber-800">
                      <span>Artisanal Gift Packaging</span>
                      <span className="font-bold font-mono">+₹30</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Delivery Charges</span>
                    {shippingFee === 0 ? (
                      <span className="font-bold text-emerald-700">FREE Express Shipping</span>
                    ) : (
                      <span className="font-bold text-gray-900 font-mono">₹{shippingFee}</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#EFE8DE] flex justify-between items-baseline">
                    <span className="font-heading text-base font-extrabold text-gray-900">
                      Total Amount
                    </span>
                    <span className="font-heading text-2xl font-black text-[#FF5722] font-mono">
                      ₹{finalTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Frictionless Guest Checkout: No forced login modals! */}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-[#FF5722] hover:bg-[#E64A19] text-white font-heading font-bold text-base shadow-lg shadow-[#FF5722]/25 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  Proceed to Checkout <ArrowRight className="w-5 h-5" />
                </Link>

                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium pt-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Secure Guest Checkout • No Account Required</span>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
