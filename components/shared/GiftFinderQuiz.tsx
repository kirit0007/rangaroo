'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { products } from '@/data/products';

export default function GiftFinderQuiz() {
  const [ageGroup, setAgeGroup] = useState<string>('5-8');
  const [interest, setInterest] = useState<string>('dinosaur');
  const [budget, setBudget] = useState<number>(300);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const matchedProducts = products.filter(p => p.price <= budget).slice(0, 3);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-orange-100 shadow-xl max-w-4xl mx-auto">
      <div className="text-center max-w-lg mx-auto mb-8">
        <span className="bg-orange-100 text-orange-600 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
          AI Gift Matcher
        </span>
        <h3 className="font-heading text-2xl sm:text-3xl text-slate-900 mt-2">
          Find the Perfect Kit in 3 Seconds! 🎁
        </h3>
        <p className="text-xs text-slate-500 font-semibold mt-1">Answer 3 quick questions to get personalized DIY kit recommendations.</p>
      </div>

      {!submitted ? (
        <div className="space-y-6 max-w-2xl mx-auto">
          
          {/* Question 1: Child Age */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">1. Child's Age Group:</label>
            <div className="grid grid-cols-3 gap-3">
              {['3-5 Years', '5-8 Years', '8-12+ Years'].map((ag) => (
                <button
                  key={ag}
                  onClick={() => setAgeGroup(ag)}
                  className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${
                    ageGroup === ag ? 'bg-orange-500 text-white border-orange-500 shadow-fun scale-105' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Interest Theme */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">2. What do they love most?</label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'dinosaur', label: 'Dinosaurs 🦕' },
                { id: 'space', label: 'Space & Rockets 🚀' },
                { id: 'princess', label: 'Princess & Magic 👸' },
                { id: 'cartoon', label: 'Cartoons 🎭' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setInterest(t.id)}
                  className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${
                    interest === t.id ? 'bg-purple-600 text-white border-purple-600 shadow-fun scale-105' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Budget */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">3. Maximum Budget:</label>
              <span className="font-heading text-xl text-orange-500">₹{budget}</span>
            </div>
            <input 
              type="range" 
              min="149" 
              max="500" 
              step="50"
              value={budget} 
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          <button
            onClick={() => setSubmitted(true)}
            className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-white font-heading text-lg py-4 rounded-2xl shadow-fun hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <span>Show My AI Recommendations</span>
            <Sparkles className="w-5 h-5" />
          </button>

        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-xl text-slate-900">Top Matches for {ageGroup} ({interest})</h4>
            <button 
              onClick={() => setSubmitted(false)}
              className="text-xs font-bold text-slate-500 hover:text-orange-500 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {matchedProducts.map((p) => (
              <div key={p.id} className="bg-slate-50 rounded-2xl p-4 border border-orange-100 text-center space-y-2">
                <div className="w-16 h-16 rounded-xl bg-orange-100 text-orange-500 font-bold flex items-center justify-center text-xl mx-auto">
                  🎨
                </div>
                <h5 className="font-heading text-sm text-slate-900">{p.name}</h5>
                <div className="font-bold text-orange-500 text-base">₹{p.price}</div>
                <Link 
                  href={`/products/${p.slug}`}
                  className="inline-block w-full bg-orange-500 text-white font-bold text-xs py-2 rounded-xl shadow-sm hover:bg-orange-600 transition-colors"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
