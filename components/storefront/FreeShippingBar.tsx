'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Truck } from 'lucide-react';

interface FreeShippingBarProps {
  currentSubtotal: number;
  threshold?: number;
  className?: string;
}

export default function FreeShippingBar({
  currentSubtotal,
  threshold = 499,
  className = '',
}: FreeShippingBarProps) {
  const isUnlocked = currentSubtotal >= threshold;
  const remaining = Math.max(0, threshold - currentSubtotal);
  const progressPercent = Math.min(100, Math.round((currentSubtotal / threshold) * 100));

  return (
    <div
      className={`rounded-2xl p-4 bg-[#FFFDF9] border border-[#EFE8DE] shadow-xs ${className}`}
      role="region"
      aria-label="Free shipping status"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#FF5722]/10 text-[#FF5722] flex items-center justify-center shrink-0">
            {isUnlocked ? <Sparkles className="w-4 h-4 text-[#FFA000]" /> : <Truck className="w-4 h-4" />}
          </span>
          <span className="text-xs sm:text-sm font-bold text-gray-900">
            {isUnlocked ? (
              <span className="text-emerald-700 flex items-center gap-1">
                🎉 Congratulations! You unlocked <strong>FREE Express Shipping</strong>!
              </span>
            ) : (
              <span>
                Add <strong className="text-[#FF5722]">₹{remaining.toLocaleString('en-IN')}</strong> more for <strong>FREE Delivery</strong>
              </span>
            )}
          </span>
        </div>
        <span className="text-xs font-semibold text-gray-600 shrink-0 font-mono">
          {progressPercent}%
        </span>
      </div>

      {/* Progress track */}
      <div
        className="w-full bg-[#EFE8DE] rounded-full h-2.5 overflow-hidden shadow-inner"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Free shipping progress"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full transition-all duration-300 ${
            isUnlocked
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : 'bg-gradient-to-r from-[#FF5722] to-[#FFA000]'
          }`}
        />
      </div>

      <div className="flex justify-between items-center mt-1.5 text-[11px] text-gray-600">
        <span>₹0</span>
        <span className="font-semibold text-gray-700">₹{threshold.toLocaleString('en-IN')} Free Shipping Goal</span>
      </div>
    </div>
  );
}
