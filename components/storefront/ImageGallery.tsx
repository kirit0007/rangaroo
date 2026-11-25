'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  productName: string;
  discountPercent?: number;
  className?: string;
}

export default function ImageGallery({
  images = [],
  productName,
  discountPercent = 0,
  className = '',
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imgErrorMap, setImgErrorMap] = useState<Record<number, boolean>>({});
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const displayImages = images.length > 0 ? images : ['/logo.png'];
  const currentImg = imgErrorMap[activeIndex] ? '/logo.png' : displayImages[activeIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={`space-y-4 ${className}`} aria-label="Product Image Gallery">
      {/* Main Feature Image Container */}
      <div
        className="relative aspect-square w-full bg-[#FFFDF9] rounded-3xl overflow-hidden border border-[#EFE8DE] shadow-sm group cursor-pointer"
        onClick={() => setIsZoomOpen(true)}
      >
        <Image
          src={currentImg}
          alt={`${productName} - View ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
          onError={() => setImgErrorMap((prev) => ({ ...prev, [activeIndex]: true }))}
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-4 right-4 z-10">
            <span className="px-3.5 py-1.5 text-xs sm:text-sm font-extrabold bg-[#FF5722] text-white rounded-full shadow-md tracking-wide">
              Save {discountPercent}%
            </span>
          </div>
        )}

        {/* Zoom Hint */}
        <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-md text-gray-800 p-2.5 rounded-full shadow-sm opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-semibold">
          <ZoomIn className="w-4 h-4 text-[#FF5722]" />
          <span className="hidden sm:inline">Click to Zoom</span>
        </div>

        {/* Prev / Next Nav Buttons (min 44x44px touch targets) */}
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/90 text-gray-800 shadow-md flex items-center justify-center hover:bg-white active:scale-95 transition-all z-20 focus-visible:ring-2 focus-visible:ring-[#FF5722]"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/90 text-gray-800 shadow-md flex items-center justify-center hover:bg-white active:scale-95 transition-all z-20 focus-visible:ring-2 focus-visible:ring-[#FF5722]"
            >
              <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row (each button min 44x44px) */}
      {displayImages.length > 1 && (
        <div
          className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar"
          role="tablist"
          aria-label="Product thumbnails"
        >
          {displayImages.map((img, idx) => {
            const isSelected = activeIndex === idx;
            const src = imgErrorMap[idx] ? '/logo.png' : img;
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`View image ${idx + 1} of ${displayImages.length}`}
                onClick={() => setActiveIndex(idx)}
                className={`relative min-w-[54px] min-h-[54px] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-[#FF5722] ${
                  isSelected
                    ? 'border-[#FF5722] shadow-md ring-2 ring-[#FF5722]/30 scale-102'
                    : 'border-[#EFE8DE] opacity-70 hover:opacity-100 hover:border-gray-400'
                }`}
              >
                <Image
                  src={src}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                  onError={() => setImgErrorMap((prev) => ({ ...prev, [idx]: true }))}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setIsZoomOpen(false)}
          >
            <div
              className="relative max-w-4xl max-h-[85vh] w-full aspect-square bg-[#FFFDF9] rounded-3xl overflow-hidden shadow-2xl border border-white/20 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={currentImg}
                alt={`${productName} zoomed preview`}
                fill
                className="object-contain p-4"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                aria-label="Close zoom preview"
                className="absolute top-4 right-4 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-black/70 text-white flex items-center justify-center font-bold text-lg hover:bg-black transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
