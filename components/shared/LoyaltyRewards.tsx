'use client';

import { Trophy, Gift, Award, Star, ArrowRight } from 'lucide-react';

export default function LoyaltyRewards() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-orange-100 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-4">
          <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Rangaroo Loyalty Rewards</span>
          </span>

          <h3 className="font-heading text-3xl sm:text-4xl text-slate-900">
            Earn Paint Points on Every Order! 🌟
          </h3>

          <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-xl">
            Join the Rangoo Club! Earn 10 Paint Points for every ₹100 spent. Redeem points for free paint kits, custom aprons, and exclusive festival vouchers.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { icon: Star, title: 'Earn 10% Back', desc: '10 pts per ₹100' },
              { icon: Gift, title: 'Refer a Friend', desc: 'Get ₹100 Coupon' },
              { icon: Award, title: 'Birthday Bonus', desc: '500 Free Points' },
            ].map((p, idx) => (
              <div key={idx} className="bg-orange-50/60 rounded-2xl p-3 border border-orange-100 text-center">
                <p.icon className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <h5 className="font-heading text-xs text-slate-900">{p.title}</h5>
                <p className="text-[10px] text-slate-500 font-bold">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right CTA */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-6 text-white text-center space-y-4 shadow-fun">
          <div className="text-4xl">👑</div>
          <h4 className="font-heading text-2xl">Join Rangoo Club</h4>
          <p className="text-xs text-white/90 font-bold">Sign up today and get 100 Bonus Points instantly!</p>
          <a
            href="https://wa.me/918793687379?text=Hi! I want to join the Rangoo Loyalty Rewards Club."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-heading text-sm px-6 py-3 rounded-2xl shadow-md w-full hover:scale-105 transition-all"
          >
            <span>Claim 100 Bonus Points</span>
            <ArrowRight className="w-4 h-4 text-orange-500" />
          </a>
        </div>

      </div>
    </div>
  );
}
