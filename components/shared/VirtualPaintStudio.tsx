'use client';

import { useState } from 'react';
import { Palette, Sparkles, RotateCcw, Download, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VirtualPaintStudio() {
  const [selectedColor, setSelectedColor] = useState<string>('#FF6B35');
  const [colorsState, setColorsState] = useState<Record<string, string>>({
    body: '#FFFFFF',
    accent1: '#FFFFFF',
    accent2: '#FFFFFF',
  });

  const palette = [
    { name: 'Rangaroo Orange', hex: '#FF6B35' },
    { name: 'Sunny Yellow', hex: '#FFD23F' },
    { name: 'Creative Purple', hex: '#7B2FF7' },
    { name: 'Emerald Green', hex: '#10B981' },
    { name: 'Bubbly Pink', hex: '#FF69B4' },
    { name: 'Sky Blue', hex: '#00BCD4' },
    { name: 'Chocolate Brown', hex: '#8B4513' },
    { name: 'Pure White', hex: '#FFFFFF' },
  ];

  const handlePaintPart = (part: string) => {
    setColorsState(prev => ({ ...prev, [part]: selectedColor }));
    confetti({
      particleCount: 15,
      spread: 40,
      origin: { y: 0.7 }
    });
  };

  const handleReset = () => {
    setColorsState({
      body: '#FFFFFF',
      accent1: '#FFFFFF',
      accent2: '#FFFFFF',
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-orange-100 shadow-xl max-w-4xl mx-auto">
      
      <div className="text-center max-w-md mx-auto mb-8">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-black mb-2 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Paint Studio</span>
        </div>
        <h3 className="font-heading text-2xl sm:text-3xl text-slate-900">Try Painting Virtual Figurine! 🎨</h3>
        <p className="text-xs text-slate-500 font-semibold mt-1">Pick your paintbrush color below and tap on figurine parts to paint!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Interactive Figurine Canvas */}
        <div className="bg-[#FFF9F2] rounded-3xl p-8 border-2 border-dashed border-orange-200 flex flex-col items-center justify-center relative min-h-[300px]">
          
          {/* Figurine SVG Illustration */}
          <svg className="w-48 h-48 drop-shadow-lg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body Part 1 */}
            <path 
              d="M100 20 C140 20, 170 50, 170 100 C170 150, 140 180, 100 180 C60 180, 30 150, 30 100 C30 50, 60 20, 100 20 Z" 
              fill={colorsState.body}
              stroke="#2D2C2E" 
              strokeWidth="6" 
              className="cursor-pointer hover:opacity-90 transition-all"
              onClick={() => handlePaintPart('body')}
            />
            {/* Eyes */}
            <circle cx="75" cy="80" r="10" fill="#2D2C2E" />
            <circle cx="125" cy="80" r="10" fill="#2D2C2E" />
            <circle cx="78" cy="77" r="3" fill="#FFFFFF" />
            <circle cx="128" cy="77" r="3" fill="#FFFFFF" />
            {/* Cheeks */}
            <circle 
              cx="60" 
              cy="105" 
              r="12" 
              fill={colorsState.accent1}
              stroke="#2D2C2E"
              strokeWidth="3"
              className="cursor-pointer hover:opacity-90 transition-all"
              onClick={() => handlePaintPart('accent1')}
            />
            <circle 
              cx="140" 
              cy="105" 
              r="12" 
              fill={colorsState.accent1}
              stroke="#2D2C2E"
              strokeWidth="3"
              className="cursor-pointer hover:opacity-90 transition-all"
              onClick={() => handlePaintPart('accent1')}
            />
            {/* Belly Patch */}
            <ellipse 
              cx="100" 
              cy="135" 
              rx="30" 
              ry="25" 
              fill={colorsState.accent2}
              stroke="#2D2C2E"
              strokeWidth="4"
              className="cursor-pointer hover:opacity-90 transition-all"
              onClick={() => handlePaintPart('accent2')}
            />
            {/* Smile */}
            <path d="M85 110 Q100 125 115 110" stroke="#2D2C2E" strokeWidth="5" strokeLinecap="round" />
          </svg>

          <p className="text-[11px] font-bold text-slate-400 mt-4 uppercase tracking-wider">
            Tap on figurine parts to paint!
          </p>

        </div>

        {/* Color Palette Controls */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
              Select Paint Color:
            </label>
            
            <div className="grid grid-cols-4 gap-3">
              {palette.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  className={`w-12 h-12 rounded-2xl transition-transform flex items-center justify-center shadow-md ${
                    selectedColor === c.hex ? 'scale-110 ring-4 ring-orange-400 ring-offset-2' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selectedColor === c.hex && (
                    <span className={`text-xs ${c.hex === '#FFFFFF' ? 'text-slate-900' : 'text-white'}`}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Canvas</span>
            </button>

            <button
              onClick={() => {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              }}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-heading text-sm py-3.5 rounded-2xl shadow-fun flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>I Love My Artwork!</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
