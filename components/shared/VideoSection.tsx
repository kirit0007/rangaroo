'use client';

import { Play, Sparkles, CheckCircle2 } from 'lucide-react';

export default function VideoSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-14 border border-slate-800 text-white shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        
        {/* Left Column Text */}
        <div className="space-y-6">
          <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unboxing & Painting Demo</span>
          </span>

          <h2 className="font-heading text-3xl sm:text-5xl text-white leading-tight">
            See How Easy & Fun Painting Is! 🎬
          </h2>

          <p className="text-slate-300 text-sm font-medium leading-relaxed">
            Watch our step-by-step unboxing and painting video to see how Rangoo DIY Paint Kits bring joy, focus, and artistic confidence to every child.
          </p>

          <div className="space-y-3 pt-2 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Easy 3-step color blending guide included</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Smooth plaster figurines ready to paint out-of-the-box</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Washable paints for easy cleanup</span>
            </div>
          </div>
        </div>

        {/* Right Video Play Box */}
        <div className="relative w-full aspect-video rounded-3xl bg-gradient-to-tr from-orange-500 via-amber-500 to-purple-600 p-2 shadow-2xl flex items-center justify-center group cursor-pointer">
          <div className="w-full h-full bg-slate-950/40 rounded-2xl flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm group-hover:bg-slate-950/20 transition-all">
            <div className="w-20 h-20 rounded-full bg-white text-orange-500 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform mb-3">
              <Play className="w-8 h-8 fill-orange-500 ml-1" />
            </div>
            <span className="font-heading text-xl text-white">Watch 2-Min Video Demo</span>
            <span className="text-xs text-white/80 font-bold mt-1">Play HD Unboxing Guide</span>
          </div>
        </div>

      </div>
    </div>
  );
}
