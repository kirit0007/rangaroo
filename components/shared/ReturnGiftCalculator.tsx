'use client';

import { useState } from 'react';
import { Gift, Calculator, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ReturnGiftCalculator() {
  const [kidsCount, setKidsCount] = useState<number>(15);
  const [selectedTier, setSelectedTier] = useState<string>('mini');

  const tiers = [
    { id: 'mini', name: 'Mini Paint Kit', basePrice: 149, figures: '1 Large / 2 Small' },
    { id: 'fun', name: 'Fun Paint Kit', basePrice: 199, figures: '2-3 Figures' },
    { id: 'creative', name: 'Creative Kit', basePrice: 299, figures: '3 Premium Figures' },
  ];

  const currentTierObj = tiers.find(t => t.id === selectedTier) || tiers[0];
  
  // Bulk Discount Rules
  let discountPercent = 0;
  if (kidsCount >= 30) discountPercent = 25;
  else if (kidsCount >= 20) discountPercent = 20;
  else if (kidsCount >= 10) discountPercent = 15;

  const originalTotal = kidsCount * currentTierObj.basePrice;
  const finalTotal = Math.round(originalTotal * (1 - discountPercent / 100));
  const pricePerKid = Math.round(finalTotal / kidsCount);

  return (
    <div className="bg-gradient-to-br from-white via-orange-50/50 to-amber-50 rounded-3xl p-6 sm:p-10 border border-orange-200 shadow-xl max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-2xl shadow-fun">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-heading text-2xl text-slate-900">Birthday Return Gift Calculator 🎂</h3>
          <p className="text-xs font-bold text-slate-500">Calculate instant bulk savings for your child's birthday party!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Inputs */}
        <div className="space-y-6">
          
          {/* Kids Count Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Number of Guests / Kids:</label>
              <span className="font-heading text-2xl text-orange-500 font-extrabold">{kidsCount} Kids</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="100" 
              step="5"
              value={kidsCount} 
              onChange={(e) => setKidsCount(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
              <span>5 Kids</span>
              <span>25 Kids (20% OFF)</span>
              <span>50+ Kids (25% OFF)</span>
            </div>
          </div>

          {/* Kit Tier Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">Select Kit Tier:</label>
            <div className="grid grid-cols-3 gap-3">
              {tiers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTier(t.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedTier === t.id 
                      ? 'bg-orange-500 text-white border-orange-500 shadow-fun scale-105' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <div className="font-heading text-sm">{t.name}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">₹{t.basePrice}/kit</div>
                </button>
              ))}
            </div>
          </div>

          {/* Included Party Perks */}
          <div className="space-y-2 pt-2 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>FREE Custom Personalized Name Cards</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>FREE Ready-To-Gift Ribbon Packaging</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>FREE Pan-India Express Delivery</span>
            </div>
          </div>

        </div>

        {/* Right Pricing Summary Box */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden border border-slate-800">
          
          {discountPercent > 0 && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 text-xs font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{discountPercent}% Bulk Savings Applied!</span>
            </div>
          )}

          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Total Amount</div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="font-heading text-4xl sm:text-5xl text-amber-400 font-extrabold">₹{finalTotal}</span>
              {discountPercent > 0 && (
                <span className="text-lg text-slate-500 line-through font-bold">₹{originalTotal}</span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Just <strong className="text-white">₹{pricePerKid} per child</strong> for a complete DIY craft kit!
            </p>
          </div>

          <a 
            href={`https://wa.me/918793687379?text=Hi! I used the website Return Gift Calculator for ${kidsCount} kids (${currentTierObj.name}). Estimated Total: ₹${finalTotal}. Please assist with my order.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-heading text-base py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all"
          >
            <span>Lock In Bulk Offer on WhatsApp</span>
            <ArrowRight className="w-5 h-5" />
          </a>

        </div>

      </div>
    </div>
  );
}
