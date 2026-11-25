'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Palette, Shield, Gift, Star, ArrowRight, Brush, Sparkles, Truck, Box } from 'lucide-react';
import { getFeaturedProducts } from '@/data/products';
import ProductCard from '@/components/product/ProductCard';
import ReviewSkeleton from '@/components/reviews/ReviewSkeleton';
import TrustPillars from '@/components/storefront/TrustPillars';

export default function HomePage() {
  const featuredProducts = getFeaturedProducts().slice(0, 4);

  const kitTiers = [
    {
      name: 'Mini Kit',
      price: 149,
      color: 'bg-emerald-700 text-white',
      border: 'border-[#EFE8DE]',
      slug: 'mini-paint-kit',
      desc: 'Perfect for quick afternoon fun & young beginners (Ages 3-5)',
      figures: '2 Figurines',
    },
    {
      name: 'Fun Kit',
      price: 199,
      color: 'bg-[#FF5722] text-white',
      border: 'border-[#EFE8DE]',
      slug: 'fun-paint-kit',
      desc: 'Bestseller for birthdays & joyful return gifts',
      figures: '3-4 Figurines',
    },
    {
      name: 'Creative Kit',
      price: 299,
      color: 'bg-purple-800 text-white',
      border: 'border-[#EFE8DE]',
      slug: 'creative-paint-kit',
      desc: 'Engaging weekend art projects with acrylics',
      figures: '4-6 Figurines',
    },
    {
      name: 'Signature Collection',
      price: 499,
      color: 'bg-[#FFA000] text-gray-950 font-bold',
      border: 'border-[#EFE8DE]',
      slug: 'signature-collection',
      desc: 'Deluxe celebration boxes ready for gifting',
      figures: 'Complete Set',
    },
  ];

  return (
    <div className="min-h-screen pb-20 overflow-hidden bg-[#FFFDF9]">
      {/* Hero Section - Indian DTC Craft Aesthetic */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#FFFDF9] to-[#EFE8DE]/30 border-b border-[#EFE8DE]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text Column (7 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF5722]/10 border border-[#FF5722]/20 text-[#FF5722] font-bold text-xs tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#FFA000]" /> Handcrafted In India • 100% Non-Toxic
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-extrabold text-gray-900 leading-tight tracking-tight">
                Where Little Hands <br />
                Create <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#FF5722] via-[#FFA000] to-[#E64A19]">
                  Big Smiles
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-700 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Spark screen-free imagination with artisanal plaster figurines, child-safe washable colors, and complete craft sets delivered in gifting boxes.
              </p>

              {/* Action Buttons (min 44x44px touch targets) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/shop"
                  className="min-h-[48px] px-8 py-3.5 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-full font-heading font-bold text-base shadow-md shadow-[#FF5722]/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95"
                >
                  Shop All Kits <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/collections"
                  className="min-h-[48px] px-8 py-3.5 bg-white text-gray-900 border-2 border-[#EFE8DE] hover:border-[#FFA000] hover:bg-[#FFFDF9] rounded-full font-heading font-bold text-base transition-all"
                >
                  Explore Collections
                </Link>
              </div>

              {/* Craft Pillars Pill Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 max-w-2xl">
                <div className="px-3.5 py-2 rounded-full bg-white text-gray-800 font-bold text-xs border border-[#EFE8DE] shadow-2xs flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" /> 100% Non-Toxic
                </div>
                <div className="px-3.5 py-2 rounded-full bg-white text-gray-800 font-bold text-xs border border-[#EFE8DE] shadow-2xs flex items-center gap-2">
                  <span className="text-sm">🇮🇳</span> Poured in India
                </div>
                <div className="px-3.5 py-2 rounded-full bg-white text-gray-800 font-bold text-xs border border-[#EFE8DE] shadow-2xs flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#FF5722]" /> Gift Ready Box
                </div>
                <div className="px-3.5 py-2 rounded-full bg-white text-gray-800 font-bold text-xs border border-[#EFE8DE] shadow-2xs flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#FFA000]" /> Free Delivery on ₹499+
                </div>
              </div>
            </motion.div>

            {/* Right Hero Visual Column (5 cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative h-[380px] sm:h-[460px] flex items-center justify-center"
            >
              {/* Subtle Tactile Halo */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#FF5722]/15 via-[#FFA000]/15 to-transparent blur-2xl -z-10" />

              {/* Floating Ambient Badge */}
              <div className="absolute top-6 -right-2 sm:-right-4 z-20 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-[#EFE8DE] flex items-center gap-3 select-none pointer-events-none">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  🍃
                </div>
                <div>
                  <p className="font-heading font-extrabold text-sm text-gray-900 leading-tight">Screen-Free</p>
                  <p className="text-[11px] text-gray-500 font-medium">Sensory Play</p>
                </div>
              </div>

              {/* Mascot Character Image */}
              <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
                <Image
                  src="/rangoo.png"
                  alt="Rangoo - The Kangaroo Artist Mascot"
                  width={420}
                  height={500}
                  className="object-contain drop-shadow-[0_15px_30px_rgba(255,87,34,0.18)] hover:scale-103 transition-transform duration-500"
                  priority
                  unoptimized
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kit Tiers Showcase */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3 py-1 rounded-full inline-block mb-2">
            Curated For Every Artist
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-gray-900 mb-3">
            Choose Your Craft Kit
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
            Thoughtfully packaged with plaster figurines, paint pots, brushes, and instructions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kitTiers.map((tier, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6 }}
              className={`bg-white rounded-3xl p-6 border ${tier.border} shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
            >
              <div>
                <div className={`w-fit px-3 py-1 rounded-full text-xs font-bold mb-3 ${tier.color}`}>
                  {tier.name}
                </div>
                <div className="text-3xl font-heading font-black text-gray-900 mb-1 font-mono">
                  Starting at ₹{tier.price}
                </div>
                <p className="text-xs font-semibold text-[#FF5722] mb-2 flex items-center gap-1">
                  <Box className="w-3.5 h-3.5" /> {tier.figures}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
                  {tier.desc}
                </p>
              </div>
              <Link
                href={`/shop?category=${tier.slug}`}
                className="w-full min-h-[44px] flex items-center justify-center py-2.5 px-4 rounded-xl bg-[#FFFDF9] border border-[#EFE8DE] text-gray-800 font-heading font-bold text-xs sm:text-sm hover:bg-[#FF5722] hover:text-white hover:border-[#FF5722] transition-colors"
              >
                View Kits
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Pillars Section */}
      <TrustPillars />

      {/* Bestseller Kits Grid */}
      <section className="py-16 bg-white border-y border-[#EFE8DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3 py-1 rounded-full inline-block mb-2">
                Parent & Kid Favorites
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-gray-900 flex items-center gap-3">
                Bestseller Craft Kits <Brush className="w-7 h-7 text-[#FF5722]" />
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#FF5722] hover:text-[#E64A19] min-h-[44px]"
            >
              View Full Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <HomepageReviewsSection />

      {/* Call to Action Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#FFFDF9] border border-[#EFE8DE] rounded-3xl p-8 sm:p-14 text-center text-gray-900 relative overflow-hidden shadow-xs">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3 py-1 rounded-full inline-block">
              Free Shipping Across India on ₹499+
            </span>
            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-gray-900 tracking-tight">
              Ready to Spark Little Imaginations?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-lg mx-auto">
              Delight your child with safe, non-toxic plaster paint kits. Fast courier delivery, instant gift packaging, and hours of creative joy.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="min-h-[48px] inline-flex items-center gap-2 px-9 py-3.5 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-full font-heading font-bold text-base shadow-md transition-all active:scale-95"
              >
                Shop All DIY Kits <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HomepageReviewsSection() {
  const [fiveStarReviews, setFiveStarReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reviews?featured=true&minRating=5')
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews) {
          setFiveStarReviews(data.reviews);
        }
      })
      .catch((err) => console.error('Error fetching homepage reviews:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#FFA000] bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-block mb-2">
            Verified Experiences
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-gray-900">
            Loved By Families Across India
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-2">
            Read real stories from young artists and parents who painted together.
          </p>
        </div>

        {loading ? (
          <ReviewSkeleton />
        ) : fiveStarReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fiveStarReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-[#EFE8DE] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex text-[#FFA000]">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 rounded-full">
                      ✔ Verified Buyer
                    </span>
                  </div>
                  {rev.title && <h3 className="font-heading font-bold text-gray-900 text-base mb-1.5">{rev.title}</h3>}
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed mb-4">&quot;{rev.comment}&quot;</p>
                </div>
                <div className="pt-3 border-t border-[#EFE8DE] flex items-center justify-between text-xs text-gray-500 font-mono">
                  <span className="font-bold text-gray-900">{rev.customerName}</span>
                  <span>
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-[#EFE8DE] p-8 text-center max-w-lg mx-auto shadow-xs">
            <span className="text-3xl mb-2 block">🎨</span>
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-1">
              Join Our Community of Young Artists
            </h3>
            <p className="text-gray-600 text-xs mb-4">
              Order any DIY craft kit and share your child&apos;s proud painted creation!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#FF5722] text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-[#E64A19] transition-colors"
            >
              Explore Kits
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
