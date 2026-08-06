'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function OrderConfirmationPage() {
  const clearCart = useCartStore((state) => state.clearCart);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    // Generate random order ID
    const randomId = 'RNG-' + Math.floor(100000 + Math.random() * 900000);
    setOrderId(randomId);

    // Trigger confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);

    // Clear the cart
    clearCart();

    return () => clearInterval(interval);
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-32 pb-20 px-4 flex flex-col items-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 max-w-2xl w-full text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-amber-400 to-purple-400"></div>
        
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-lg">
          <Check className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-3xl md:text-4xl font-outfit font-extrabold text-gray-900 mb-4">
          Order Placed Successfully!
        </h1>
        
        <p className="text-lg text-gray-600 mb-2">
          Thank you for choosing Rangaroo. Your little artist's next masterpiece is on its way!
        </p>

        <div className="inline-block bg-gray-50 px-6 py-3 rounded-full text-sm font-medium text-gray-700 border border-gray-200 mb-10">
          Order ID: <span className="font-bold text-gray-900 ml-1">{orderId}</span>
        </div>

        <div className="relative h-48 w-full mb-10">
          <Image 
            src="/rangoo.png" 
            alt="Celebrating Rangoo" 
            fill 
            className="object-contain" 
            priority
            unoptimized
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-md">
            <ShoppingBag className="w-5 h-5" /> Continue Shopping
          </Link>
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Back to Home
          </Link>
        </div>

      </motion.div>
    </div>
  );
}
