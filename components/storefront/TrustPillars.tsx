'use client';

import React from 'react';
import { ShieldCheck, Sparkles, HeartHandshake, Truck, RotateCcw } from 'lucide-react';

interface TrustPillarsProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export default function TrustPillars({ variant = 'full', className = '' }: TrustPillarsProps) {
  const pillars = [
    {
      icon: ShieldCheck,
      title: '100% Non-Toxic & Safe',
      description: 'Zero harsh chemicals. Washable paints, tested safe for curious little hands.',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconColor: 'text-emerald-600',
    },
    {
      icon: Sparkles,
      title: 'Screen-Free Creativity',
      description: 'Engaging tactile sensory craft that sparks imagination and fine motor skills.',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
      iconColor: 'text-[#FFA000]',
    },
    {
      icon: HeartHandshake,
      title: 'Handcrafted in India',
      description: 'Artisanal plaster figurines poured with care by local skilled craftspeople.',
      badgeColor: 'bg-orange-50 text-orange-900 border-orange-200',
      iconColor: 'text-[#FF5722]',
    },
    {
      icon: Truck,
      title: 'Express Delivery on ₹499+',
      description: 'Carefully cushioned gift-box shipping across 28,000+ Indian pincodes.',
      badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-200',
      iconColor: 'text-indigo-600',
    },
  ];

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-2 gap-3 ${className}`}>
        {pillars.slice(0, 4).map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FFFDF9] border border-[#EFE8DE] shadow-xs"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${p.badgeColor}`}>
                <Icon className={`w-4 h-4 ${p.iconColor}`} />
              </div>
              <span className="text-xs font-bold text-gray-800 leading-tight">{p.title}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className={`py-12 ${className}`} aria-label="Why Choose Rangaroo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Pure Craft • Safe Play
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-900">
            Crafted for Big Smiles & Pure Wonder
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Every kit brings joyful hours of tactile creativity right to your child’s fingertips.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-[#FFFDF9] border border-[#EFE8DE] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${pillar.badgeColor}`}>
                    <Icon className={`w-6 h-6 ${pillar.iconColor}`} />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-gray-900 mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
