'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, ShoppingBag, Truck, Copy, Sparkles, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAdminStore } from '@/store/adminStore';
import toast from 'react-hot-toast';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);
  const storeOrders = useAdminStore((state) => state.orders);

  const queryOrderNumber = searchParams.get('orderNumber');
  const token = searchParams.get('token');
  const latestOrderNumber = storeOrders && storeOrders.length > 0 ? storeOrders[storeOrders.length - 1].orderNumber : '#1001';
  const displayOrderId = queryOrderNumber || latestOrderNumber;
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    clearCart();
    return () => clearInterval(interval);
  }, [clearCart]);

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      toast.success('Tracking token copied to clipboard!');
      setTimeout(() => setCopiedToken(false), 3000);
    }
  };

  const trackingUrl = `/track?orderNumber=${encodeURIComponent(displayOrderId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

  return (
    <div className="min-h-screen bg-[#FFFDF9] pt-28 pb-20 px-4 flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xs border border-[#EFE8DE] max-w-2xl w-full text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF5722] via-[#FFA000] to-emerald-500" />

        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-md">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>

        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-block mb-3">
          Order Confirmed & Paid
        </span>

        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-gray-900 mb-3">
          Your Creative Kit Is On Its Way!
        </h1>

        <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
          Thank you for choosing Rangaroo. Our craftsmen are carefully packing your child&apos;s plaster figurines and non-toxic paints.
        </p>

        {/* Order Identifier */}
        <div className="inline-flex items-center gap-2 bg-[#FFFDF9] px-6 py-3 rounded-full text-sm font-medium text-gray-800 border border-[#EFE8DE] mb-6">
          <span>Order Reference:</span>
          <span className="font-extrabold text-gray-900 font-mono">{displayOrderId}</span>
        </div>

        {/* Guest Tracking Token Callout */}
        {token && (
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 mb-6 text-left max-w-lg mx-auto space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFA000]" /> Secret Guest Tracking Key
              </span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-xs font-bold text-[#FF5722] hover:text-[#E64A19] flex items-center gap-1"
              >
                {copiedToken ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedToken ? 'Copied' : 'Copy Key'}
              </button>
            </div>
            <p className="text-xs text-gray-600">
              Save this private token to securely track your guest order at any time:
            </p>
            <div className="p-2 bg-white rounded-xl border border-amber-200 font-mono text-xs text-gray-800 break-all select-all">
              {token}
            </div>
          </div>
        )}

        <div className="relative h-40 w-full mb-8">
          <Image
            src="/rangoo.png"
            alt="Celebrating Rangoo Mascot"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        {/* WhatsApp Sharing */}
        <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-100 mb-8 max-w-lg mx-auto">
          <p className="text-xs font-bold text-orange-900 uppercase tracking-wider mb-1">
            🎉 Spread The Joy!
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Share the excitement with friends on WhatsApp and invite them to explore DIY art kits!
          </p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `I just ordered a wonderful DIY paint kit from Rangaroo for my little artist! Check them out at https://www.rangaroo.store`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white rounded-full text-xs font-bold shadow-xs hover:bg-[#20bd5a] transition-all min-h-[44px]"
          >
            Share on WhatsApp 🚀
          </a>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={trackingUrl}
            className="min-h-[48px] inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-2xl font-heading font-bold text-base shadow-md transition-all active:scale-95"
          >
            <Truck className="w-5 h-5" /> Track This Order
          </Link>
          <Link
            href="/shop"
            className="min-h-[48px] inline-flex items-center justify-center gap-2 px-7 py-3 bg-white text-gray-800 border-2 border-[#EFE8DE] hover:bg-gray-50 rounded-2xl font-heading font-bold text-base transition-colors"
          >
            <ShoppingBag className="w-5 h-5" /> Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFDF9] pt-32 text-center text-gray-500">
          Loading order confirmation...
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
