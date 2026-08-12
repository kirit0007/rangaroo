'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Palette, Shield, Gift, Star, Heart, ArrowRight, Brush, Sparkles, CheckCircle2 } from 'lucide-react';
import { getFeaturedProducts } from '@/data/products';
import ProductCard from '@/components/product/ProductCard';
import ReviewSkeleton from '@/components/reviews/ReviewSkeleton';

export default function HomePage() {
  const featuredProducts = getFeaturedProducts().slice(0, 4);

  const kitTiers = [
    { 
      name: 'Mini Kit', 
      price: 149, 
      color: 'bg-emerald-500 text-white', 
      border: 'border-emerald-200', 
      glow: 'shadow-[0_10px_25px_rgba(16,185,129,0.15)]',
      slug: 'mini-paint-kit',
      desc: 'Perfect for quick fun & beginners'
    },
    { 
      name: 'Fun Kit', 
      price: 199, 
      color: 'bg-orange-500 text-white', 
      border: 'border-orange-200', 
      glow: 'shadow-[0_10px_25px_rgba(249,115,22,0.15)]',
      slug: 'fun-paint-kit',
      desc: 'Great for birthday return gifts'
    },
    { 
      name: 'Creative Kit', 
      price: 299, 
      color: 'bg-purple-600 text-white', 
      border: 'border-purple-200', 
      glow: 'shadow-[0_10px_25px_rgba(147,51,234,0.15)]',
      slug: 'creative-paint-kit',
      desc: 'Awesome weekend art projects'
    },
    { 
      name: 'Signature Collection', 
      price: 499, 
      color: 'bg-pink-500 text-white', 
      border: 'border-pink-200', 
      glow: 'shadow-[0_10px_25px_rgba(236,72,153,0.15)]',
      slug: 'signature-collection',
      desc: 'Deluxe gift kits for special occasions'
    },
  ];

  const collections = [
    { name: 'Dinosaur', emoji: '🦖', desc: 'Roar into creativity', slug: 'dinosaur' },
    { name: 'Space', emoji: '🚀', desc: 'Out of this world', slug: 'space' },
    { name: 'Vehicle', emoji: '🚗', desc: 'Vroom vroom paint', slug: 'vehicle' },
    { name: 'Animal', emoji: '🐘', desc: 'Jungle adventures', slug: 'animal' },
    { name: 'Food', emoji: '🍩', desc: 'Sweet treats', slug: 'food' },
    { name: 'Magic', emoji: '🦄', desc: 'Enchanted colors', slug: 'magic' },
  ];

  const usps = [
    { title: 'Premium Plaster Figurines', desc: 'Smooth, durable plaster crafted specially for kids', icon: Palette, color: 'bg-purple-100 text-purple-600' },
    { title: 'Non-Toxic Washable Paints', desc: 'Child-safe, 100% non-toxic tempera colors', icon: Shield, color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Gift-Ready Premium Box', desc: 'Beautifully packaged with brushes & thank you card', icon: Gift, color: 'bg-pink-100 text-pink-600' },
    { title: 'Ideal Return Gifts', desc: 'Loved by parents & kids for birthday celebrations', icon: Heart, color: 'bg-rose-100 text-rose-600' },
    { title: 'Parent Approved Quality', desc: 'Loved by parents and young artists across India', icon: Star, color: 'bg-amber-100 text-amber-600' },
    { title: 'Proudly Made in India', desc: 'Handcrafted with care by local artisans', icon: CheckCircle2, color: 'bg-orange-100 text-orange-600' },
  ];

  const testimonials = [
    { name: 'Priya S.', location: 'Mumbai', text: 'My kids loved the dinosaur kit! The plaster figurines are super smooth and the colors are vibrant.', rating: 5 },
    { name: 'Rahul M.', location: 'Bangalore', text: 'Ordered 25 Fun Kits as return gifts for my daughter\'s 6th birthday. Parents were so appreciative!', rating: 5 },
    { name: 'Anita K.', location: 'Delhi', text: 'Keeps them engaged away from screens for hours. Truly high quality craft kits.', rating: 5 },
  ];

  return (
    <div className="min-h-screen pb-20 overflow-hidden bg-[#FFF9F2]">
      {/* Hero Section */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-br from-[#FFF9F2] via-orange-50/60 to-purple-50/40">
        {/* Animated Refraction Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-12 left-10 w-72 h-72 bg-orange-300/30 rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute top-10 right-20 w-80 h-80 bg-purple-300/30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-10 left-1/3 w-72 h-72 bg-pink-300/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs shadow-sm w-max">
                <Sparkles className="w-4 h-4 text-purple-500" /> Premium DIY Craft Kits for Kids
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-outfit font-extrabold text-gray-900 leading-tight tracking-tight">
                Where Little Hands <br />
                Create <span className="font-outfit italic font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 pr-2">
                  Big Smiles
                </span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-lg mx-auto lg:mx-0 font-body leading-relaxed">
                Spark imagination with premium plaster figurines, non-toxic colors, and complete paint sets delivered in gift packaging.
              </p>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link href="/products" className="px-7 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full font-bold text-base sm:text-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-200 hover:-translate-y-0.5 flex items-center gap-2">
                  Shop All Kits <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/collections" className="px-7 py-3 bg-white text-purple-700 border-2 border-purple-200 rounded-full font-bold text-base sm:text-lg hover:border-purple-300 hover:bg-purple-50 transition-all">
                  Explore Collections
                </Link>
              </div>

              {/* Colorful Pill Trust Badges Container */}
              <div className="mt-8 bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-orange-100/60 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 max-w-2xl">
                <div className="px-3.5 py-2 rounded-full bg-emerald-50/80 text-gray-800 font-bold text-xs sm:text-sm border border-emerald-100 shadow-2xs flex items-center gap-2 transition-transform hover:scale-105">
                  <Shield className="w-4 h-4 text-emerald-600" /> 100% Non-Toxic
                </div>
                <div className="px-3.5 py-2 rounded-full bg-orange-50/80 text-gray-800 font-bold text-xs sm:text-sm border border-orange-100 shadow-2xs flex items-center gap-2 transition-transform hover:scale-105">
                  <span className="text-sm">🇮🇳</span> Made in India
                </div>
                <div className="px-3.5 py-2 rounded-full bg-pink-50/80 text-gray-800 font-bold text-xs sm:text-sm border border-pink-100 shadow-2xs flex items-center gap-2 transition-transform hover:scale-105">
                  <Gift className="w-4 h-4 text-pink-600" /> Gift Packaging
                </div>
                <div className="px-3.5 py-2 rounded-full bg-amber-50/80 text-gray-800 font-bold text-xs sm:text-sm border border-amber-100 shadow-2xs flex items-center gap-2 transition-transform hover:scale-105">
                  <span className="text-sm">👨‍👩‍👧</span> Parent Approved
                </div>
                <div className="px-3.5 py-2 rounded-full bg-purple-50/80 text-gray-800 font-bold text-xs sm:text-sm border border-purple-100 shadow-2xs flex items-center gap-2 transition-transform hover:scale-105">
                  <Shield className="w-4 h-4 text-purple-600" /> Safe & Premium
                </div>
              </div>
            </motion.div>

            {/* Right Column: Floating Mascot & Ambient Craft Elements */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative h-[420px] sm:h-[500px] lg:h-[560px] flex items-center justify-center"
            >
              {/* Colorful Glow Background behind Mascot */}
              <div className="absolute inset-2 bg-gradient-to-tr from-orange-400/30 via-pink-400/25 to-purple-400/30 rounded-full blur-3xl -z-10 animate-pulse"></div>

              {/* Floating Ambient Craft Badges */}
              <motion.div 
                animate={{ y: [-8, 8, -8], rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-10 right-4 sm:-right-4 lg:-right-12 z-20 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center gap-3 pointer-events-none select-none"
              >
                <div className="bg-emerald-50 rounded-full w-10 h-10 flex items-center justify-center">
                  <span className="text-xl">🍃</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-gray-900 text-base leading-tight">100%</span>
                  <span className="text-xs text-gray-500 font-semibold">Non-Toxic</span>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [8, -8, 8], rotate: [2, -2, 2] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute bottom-12 right-0 sm:right-4 lg:-right-8 z-20 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center gap-3 pointer-events-none select-none"
              >
                <div className="bg-pink-50 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎁</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-gray-900 text-sm leading-tight">Gift Ready</span>
                  <span className="text-xs text-gray-500 font-semibold max-w-[120px] leading-tight mt-0.5">Perfect for every little artist!</span>
                </div>
              </motion.div>

              {/* Floating Decorative Elements: Sparkles, Paint Splatters, Stars */}
              <div className="absolute top-8 right-10 w-4 h-4 bg-orange-400 rounded-full blur-[1px] animate-ping opacity-75"></div>
              <div className="absolute bottom-16 left-10 w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="absolute top-1/2 -right-2 text-2xl animate-spin-slow select-none opacity-85">🎨</div>
              <div className="absolute top-1/3 -left-4 text-2xl animate-bounce select-none opacity-85">✨</div>
              <div className="absolute bottom-1/3 right-6 text-xl animate-pulse select-none opacity-80">⭐</div>

              {/* Clean Floating Mascot Character Image (No Square Box) */}
              <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
                <Image 
                  src="/rangoo.png" 
                  alt="Rangoo Mascot" 
                  width={460} 
                  height={540} 
                  className="object-contain drop-shadow-[0_20px_35px_rgba(255,87,34,0.25)] animate-float hover:scale-105 transition-transform duration-500"
                  priority
                  unoptimized
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kit Tiers Showcase */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-5xl font-outfit font-extrabold text-gray-900 mb-4">Choose Your Canvas</h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">Explore DIY paint kit options tailored for every budget, age group, and celebration!</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kitTiers.map((tier, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -8 }}
              className={`bg-white/80 backdrop-blur-xl rounded-3xl p-7 border ${tier.border} ${tier.glow} transition-all duration-300 flex flex-col justify-between group`}
            >
              <div>
                <div className={`w-fit px-3.5 py-1 rounded-full text-xs font-extrabold mb-4 ${tier.color}`}>
                  {tier.name}
                </div>
                <div className="text-3xl font-outfit font-extrabold text-gray-900 mb-2">
                  Starting at ₹{tier.price}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 font-medium">
                  {tier.desc}
                </p>
              </div>
              <Link 
                href={`/products?category=${tier.slug}`} 
                className="w-full text-center py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 font-bold text-sm group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-300"
              >
                View Kits
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="py-20 bg-white/70 backdrop-blur-md border-y border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <div className="text-xs font-bold text-orange-500 tracking-wider uppercase mb-2">Most Popular</div>
              <h2 className="text-3xl sm:text-4xl font-outfit font-extrabold text-gray-900 flex items-center gap-3">
                Our Bestseller Kits <Brush className="w-8 h-8 text-orange-500" />
              </h2>
            </div>
            <Link href="/products" className="hidden sm:flex items-center gap-2 text-orange-600 font-bold hover:text-orange-700">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>



      {/* Features USP Banner */}
      <section className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Feature 1 */}
            <div className="flex items-center gap-4 lg:justify-center pt-4 sm:pt-0 pl-0 sm:pl-4 first:pl-0 first:pt-0">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">Safe for Kids</h3>
                <p className="text-xs text-gray-500 font-medium">Non-toxic & child safe</p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="flex items-center gap-4 lg:justify-center pt-4 sm:pt-0 pl-0 sm:pl-4 first:pl-0 first:pt-0">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">Boosts Creativity</h3>
                <p className="text-xs text-gray-500 font-medium">Encourages imagination</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-4 lg:justify-center pt-4 sm:pt-0 pl-0 sm:pl-4 first:pl-0 first:pt-0">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">Quality You Trust</h3>
                <p className="text-xs text-gray-500 font-medium">Premium materials</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-4 lg:justify-center pt-4 sm:pt-0 pl-0 sm:pl-4 first:pl-0 first:pt-0">
              <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">Delivered with Love</h3>
                <p className="text-xs text-gray-500 font-medium">Carefully packed gifts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic 5-Star Customer Reviews */}
      <HomepageReviewsSection />

      {/* Call to Action Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-[2.5rem] p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-6xl font-outfit font-extrabold mb-6 tracking-tight">Ready to Paint?</h2>
            <p className="text-base sm:text-xl text-orange-50 mb-10 leading-relaxed">
              Unleash creativity today with non-toxic, screen-free DIY craft kits. Perfect for weekends, playdates, and gifts!
            </p>
            <Link href="/products" className="inline-block px-10 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-orange-50 transition-all shadow-xl transform hover:-translate-y-1">
              Shop All DIY Kits
            </Link>
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
    <section className="py-20 bg-gradient-to-b from-transparent via-orange-50/50 to-purple-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3">
            <Star className="w-4 h-4 fill-current text-amber-500" /> Verified Customer Reviews
          </div>
          <h2 className="text-3xl sm:text-5xl font-outfit font-extrabold text-gray-900">
            Loved By Families Across India
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-3">
            Real feedback and 5-star ratings from parents and young artists.
          </p>
        </div>

        {loading ? (
          <ReviewSkeleton />
        ) : fiveStarReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fiveStarReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white/90 backdrop-blur-xl border border-orange-100/80 rounded-3xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                      ✔ Verified Buyer
                    </span>
                  </div>
                  {rev.title && <h4 className="font-bold text-gray-900 text-base mb-2">{rev.title}</h4>}
                  <p className="text-gray-700 text-sm italic leading-relaxed mb-6">"{rev.comment}"</p>
                </div>
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900">{rev.customerName}</span>
                  <span className="text-gray-400">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-dashed border-orange-200 p-10 text-center max-w-xl mx-auto shadow-sm">
            <span className="text-4xl mb-3 block">🎨</span>
            <h3 className="text-xl font-bold font-outfit text-gray-900 mb-2">Be the First to Leave a 5-Star Review!</h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-6 leading-relaxed">
              Purchase any DIY paint kit and share your child's masterpiece on the product page!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-bold text-xs uppercase tracking-wider hover:from-orange-600 hover:to-amber-600 transition-all shadow-md"
            >
              Explore DIY Kits & Leave Review
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
