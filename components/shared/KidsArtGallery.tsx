'use client';

import { Camera, Heart, Trophy, Sparkles } from 'lucide-react';

export default function KidsArtGallery() {
  const artworks = [
    { name: 'Aarav (Age 6, Delhi)', title: 'Neon T-Rex Dinosaur 🦖', likes: 142, tag: 'Monthly Winner 🏆' },
    { name: 'Ananya (Age 8, Mumbai)', title: 'Galaxy Rocket Ship 🚀', likes: 98, tag: 'Top Artist ✨' },
    { name: 'Reyansh (Age 5, Bengaluru)', title: 'Colorful Ganesha 🐘', likes: 215, tag: 'Festival Special 🌟' },
    { name: 'Myra (Age 7, Pune)', title: 'Fairytale Castle 👸', likes: 87, tag: 'Creative Pick 🎨' },
  ];

  return (
    <div className="bg-[#FFF9F2] rounded-3xl p-6 sm:p-12 border border-orange-100 shadow-xl max-w-7xl mx-auto space-y-10">
      
      <div className="text-center max-w-2xl mx-auto">
        <span className="bg-pink-100 text-pink-600 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
          Rangaroo Young Artists
        </span>
        <h2 className="font-heading text-3xl sm:text-5xl text-slate-900 mt-2">
          Kids Artwork Showcase & Competition 🏆
        </h2>
        <p className="text-slate-600 mt-3 font-medium text-sm">
          Tag @ranga.roo on Instagram or upload your child's masterpiece to win free monthly painting kits!
        </p>
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {artworks.map((art, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-5 border border-orange-100 shadow-card space-y-3 group hover:-translate-y-1.5 transition-all">
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-pink-500 p-4 flex flex-col justify-between text-white relative shadow-inner">
              <span className="self-end bg-black/20 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">
                {art.tag}
              </span>
              <div className="font-heading text-xl">{art.title}</div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <h4 className="font-heading text-slate-900 text-sm">{art.name}</h4>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-pink-500 bg-pink-50 px-2.5 py-1 rounded-full">
                <Heart className="w-3.5 h-3.5 fill-pink-500" />
                <span>{art.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Callout Box */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-fun">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl">
            📸
          </div>
          <div>
            <h3 className="font-heading text-2xl text-white">Upload Your Child's Painting!</h3>
            <p className="text-xs text-white/90 font-medium">Win a ₹1,000 Rangaroo Gift Voucher every month.</p>
          </div>
        </div>

        <a 
          href="https://wa.me/918793687379?text=Hi! I want to submit my child's artwork for the monthly Rangaroo competition."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-slate-900 hover:bg-orange-50 font-heading text-sm px-6 py-3.5 rounded-2xl shadow-lg shrink-0 flex items-center gap-2 hover:scale-105 transition-all"
        >
          <Camera className="w-4 h-4 text-orange-500" />
          <span>Submit Artwork on WhatsApp</span>
        </a>
      </div>

    </div>
  );
}
