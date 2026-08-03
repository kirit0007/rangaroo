'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, Gift, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SpinWheelModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<string | null>(null);

  useEffect(() => {
    // Show modal after 4 seconds for first time visitors
    const timer = setTimeout(() => {
      const hasSeen = localStorage.getItem('hasSeenSpinWheel');
      if (!hasSeen) {
        setIsOpen(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleSpin = () => {
    if (isSpinning || wonPrize) return;
    setIsSpinning(true);

    setTimeout(() => {
      setIsSpinning(false);
      const prizes = [
        '🎉 10% OFF Code: RANGOO10',
        '🎨 FREE Extra Paintbrush Set',
        '🎁 FREE Custom Name Sticker Pack',
        '✨ 15% OFF Code: SUPERCREATIVE',
      ];
      const selected = prizes[Math.floor(Math.random() * prizes.length)];
      setWonPrize(selected);
      localStorage.setItem('hasSeenSpinWheel', 'true');
      
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 }
      });
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative bg-white rounded-3xl p-6 sm:p-10 max-w-lg w-full border-4 border-orange-400 shadow-2xl z-10 text-center space-y-6">
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-2 bg-yellow-100 text-amber-800 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>Rangoo's Surprise Wheel</span>
        </div>

        <h3 className="font-heading text-3xl text-slate-900 leading-tight">
          Spin to Win Your Welcome Gift! 🎁
        </h3>

        {/* Wheel Graphic */}
        <div className="relative w-56 h-56 mx-auto flex items-center justify-center my-4">
          <div className={`w-full h-full rounded-full border-8 border-orange-500 bg-gradient-to-tr from-amber-400 via-orange-500 to-purple-600 flex items-center justify-center text-white font-heading text-4xl shadow-fun transition-all duration-[2500ms] ${
            isSpinning ? 'rotate-[1440deg]' : ''
          }`}>
            🦘
          </div>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">
            ▼
          </div>
        </div>

        {!wonPrize ? (
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-white font-heading text-xl py-4 rounded-2xl shadow-fun hover:scale-105 transition-all disabled:opacity-50"
          >
            {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL! 🎡'}
          </button>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="text-emerald-700 font-heading text-lg">{wonPrize}</div>
            <p className="text-xs text-slate-600 font-bold">Use this code at checkout to claim your reward!</p>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-2 bg-emerald-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md"
            >
              Start Shopping Now 🛍️
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
