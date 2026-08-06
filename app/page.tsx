'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Palette, Shield, Gift, Star, Heart, ArrowRight, Brush, Sparkles, CheckCircle2 } from 'lucide-react';
import { getFeaturedProducts } from '@/data/products';
import ProductCard from '@/components/product/ProductCard';

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
    { title: '4.9/5 Parent Rating', desc: 'Over 10,000+ happy young artists across India', icon: Star, color: 'bg-amber-100 text-amber-600' },
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100/80 border border-orange-200 text-orange-700 font-bold text-xs shadow-sm">
                <Sparkles className="w-4 h-4 text-orange-500" /> Premium DIY Craft Kits For Kids
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-outfit font-extrabold text-gray-900 leading-tight tracking-tight">
                Where Little Hands <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600">
                  Create Big Smiles
                </span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-lg mx-auto lg:mx-0 font-body leading-relaxed">
                Spark imagination with premium plaster figurines, non-toxic colors, and complete paint sets delivered in gift packaging.
              </p>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link href="/products" className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-bold text-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-[0_10px_25px_rgba(255,87,34,0.3)] hover:shadow-[0_15px_30px_rgba(255,87,34,0.4)] hover:-translate-y-0.5 flex items-center gap-2">
                  Shop All Kits <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/collections" className="px-8 py-4 bg-white/80 backdrop-blur-md text-gray-800 border-2 border-orange-200/80 rounded-full font-bold text-lg hover:border-orange-500 hover:bg-white transition-all shadow-sm">
                  Explore Collections
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-gray-700 pt-4 border-t border-orange-100">
                <div className="flex items-center gap-1.5 justify-center lg:justify-start"><Shield className="w-4 h-4 text-emerald-500" /> Non-Toxic Colors</div>
                <div className="flex items-center gap-1.5 justify-center lg:justify-start"><Heart className="w-4 h-4 text-rose-500" /> Made in India</div>
                <div className="flex items-center gap-1.5 justify-center lg:justify-start"><Gift className="w-4 h-4 text-pink-500" /> Gift Packaging</div>
                <div className="flex items-center gap-1.5 justify-center lg:justify-start"><Star className="w-4 h-4 text-amber-500" /> 4.9/5 Star Rating</div>
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
                animate={{ y: [-8, 8, -8], rotate: [-3, 3, -3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 left-2 sm:left-8 z-20 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-orange-100/80 flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-gray-800 pointer-events-none select-none"
              >
                <span className="text-lg">🎨</span> 100% Non-Toxic
              </motion.div>

              <motion.div 
                animate={{ y: [8, -8, 8], rotate: [3, -3, 3] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute bottom-8 right-2 sm:right-8 z-20 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-purple-100/80 flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-purple-900 pointer-events-none select-none"
              >
                <span className="text-lg">🎁</span> Gift-Ready Kits
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

      {/* Theme Collections */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-5xl font-outfit font-extrabold text-gray-900 mb-4">Explore Collections</h2>
          <p className="text-gray-600 text-base sm:text-lg">Pick the perfect theme for your little artist</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {collections.map((col, idx) => (
            <Link key={idx} href={`/collections/${col.slug}`}>
              <motion.div 
                whileHover={{ scale: 1.05, y: -4 }}
                className="bg-white/80 backdrop-blur-xl border border-orange-100 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-lg hover:border-orange-300 transition-all duration-300 cursor-pointer h-full"
              >
                <span className="text-4xl mb-3">{col.emoji}</span>
                <h3 className="font-bold text-gray-900 text-base mb-1">{col.name}</h3>
                <p className="text-xs text-gray-500">{col.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Rangaroo (USP) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-5xl font-outfit font-extrabold text-gray-900 mb-4">Why Parents Choose Rangaroo</h2>
          <p className="text-gray-600 text-base sm:text-lg">Crafted with safety, quality, and boundless joy in mind</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {usps.map((usp, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-gray-100 flex items-start gap-5 hover:shadow-md transition-all">
              <div className={`w-14 h-14 rounded-2xl ${usp.color} flex items-center justify-center flex-shrink-0`}>
                <usp.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-lg text-gray-900 mb-1">{usp.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{usp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-transparent to-orange-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-outfit font-extrabold text-gray-900 text-center mb-14">Loved By Families Across India</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((test, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all">
                <div className="flex text-amber-400 mb-4">
                  {[...Array(test.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-gray-700 italic text-sm sm:text-base mb-6 leading-relaxed">"{test.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{test.name}</p>
                  <p className="text-xs text-gray-500">{test.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
