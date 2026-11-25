'use client';

import React from 'react';
import { CheckCircle2, Palette, Box, Brush, ShieldCheck, Sparkles } from 'lucide-react';

interface KitContentsBreakdownProps {
  kitContents?: string[];
  figureCount?: number;
  paintType?: string;
  ageGroup?: string;
  className?: string;
}

export default function KitContentsBreakdown({
  kitContents = [],
  figureCount,
  paintType = 'Tempera (100% Non-Toxic & Washable)',
  ageGroup = '5+',
  className = '',
}: KitContentsBreakdownProps) {
  const displayFigureCount = figureCount || 2;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Visual Spec Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Figure count badge */}
        <div className="bg-[#FFFDF9] border border-[#EFE8DE] rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#FF5722]/10 text-[#FF5722] flex items-center justify-center shrink-0">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Figurine Count</p>
            <p className="text-sm sm:text-base font-extrabold text-gray-900 font-heading">
              {displayFigureCount} {displayFigureCount === 1 ? 'Figurine' : 'Figurines'}
            </p>
          </div>
        </div>

        {/* Paint type badge */}
        <div className="bg-[#FFFDF9] border border-[#EFE8DE] rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#FFA000]/15 text-[#FFA000] flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Paint Formula</p>
            <p className="text-sm sm:text-base font-extrabold text-gray-900 font-heading truncate max-w-[130px]" title={paintType}>
              {paintType.split('(')[0].trim() || 'Non-Toxic'}
            </p>
          </div>
        </div>

        {/* Child Safe & Age badge */}
        <div className="bg-[#FFFDF9] border border-[#EFE8DE] rounded-2xl p-3.5 flex items-center gap-3 shadow-xs col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Age Safety</p>
            <p className="text-sm sm:text-base font-extrabold text-gray-900 font-heading">
              Ages {ageGroup} Safe
            </p>
          </div>
        </div>
      </div>

      {/* Kit contents detailed checklist */}
      {kitContents && kitContents.length > 0 && (
        <div className="rounded-3xl p-6 bg-[#FFFDF9] border border-[#EFE8DE] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EFE8DE]">
            <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF5722]" /> What&apos;s Inside The Craft Box
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EFE8DE] text-gray-800">
              {kitContents.length} Items Included
            </span>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
            {kitContents.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#EFE8DE]/60 text-gray-800 text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-[#FF5722] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-3 border-t border-[#EFE8DE] flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Brush className="w-3.5 h-3.5 text-gray-500" /> Complete kit: zero extra craft supplies needed
            </span>
            <span className="text-[#FF5722] font-semibold">
              Ready to unbox & paint!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
