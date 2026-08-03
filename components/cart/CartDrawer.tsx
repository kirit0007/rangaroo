'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function CartDrawer() {
  const { isOpen, items, toggleCart, updateQuantity, removeItem, getSubtotal, getShippingFee, getTotal } = useCartStore();

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const shippingFee = getShippingFee();
  const total = getTotal();
  const freeShippingThreshold = 499;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fadeIn" 
        onClick={toggleCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FFF9F2] shadow-2xl flex flex-col justify-between border-l border-orange-100">
          
          {/* Cart Header */}
          <div className="p-6 bg-white border-b border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl text-slate-900">Your Craft Basket</h2>
                <p className="text-xs text-slate-500 font-semibold">{items.length} items selected</p>
              </div>
            </div>
            <button 
              onClick={toggleCart}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Tracker */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 border-b border-orange-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
              <Truck className="w-4 h-4 text-orange-500" />
              {amountNeededForFreeShipping > 0 ? (
                <span>Add <strong className="text-orange-600">₹{amountNeededForFreeShipping}</strong> more for FREE Pan-India Shipping!</span>
              ) : (
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  🎉 You unlocked FREE Pan-India Shipping!
                </span>
              )}
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-5xl mb-4 animate-float">
                  🦘
                </div>
                <h3 className="font-heading text-xl text-slate-900 mb-2">Your basket is empty!</h3>
                <p className="text-sm text-slate-500 max-w-xs mb-6 font-medium">
                  Rangoo is waiting to paint! Explore our DIY kits and start creating today.
                </p>
                <button 
                  onClick={toggleCart}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3 rounded-2xl shadow-fun hover:scale-105 transition-all text-sm"
                >
                  Explore DIY Kits 🎨
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.productId}
                  className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm flex items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-white font-bold text-xs p-1 text-center shadow-inner shrink-0">
                    {item.name}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                    <p className="font-bold text-orange-500 text-sm mt-0.5">₹{item.price}</p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeItem(item.productId)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-orange-100 shadow-lg space-y-4">
              <div className="space-y-2 text-sm font-semibold text-slate-600">
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
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span className="text-orange-500 font-heading text-xl">₹{total}</span>
                </div>
              </div>

              <Link 
                href="/checkout" 
                onClick={toggleCart}
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 hover:opacity-95 text-white font-heading text-lg py-4 rounded-2xl shadow-fun flex items-center justify-center gap-2 group transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>100% Safe & Secure Checkout via Razorpay</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
