'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Award, Gift, Palette, Smile, Star } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import ReturnGiftCalculator from '@/components/shared/ReturnGiftCalculator';
import VirtualPaintStudio from '@/components/shared/VirtualPaintStudio';
import KidsArtGallery from '@/components/shared/KidsArtGallery';
import VideoSection from '@/components/shared/VideoSection';
import { getFeaturedProducts, categories, collections } from '@/data/products';

export default function HomePage() {
  const featuredProducts = getFeaturedProducts();

  const testimonials = [
    { name: 'Priya M.', location: 'Mumbai', stars: 5, quote: 'My 6-year-old daughter was engrossed for 2 full hours painting her princess kit! Best screen-free activity we have ever tried.', role: 'Parent of 2' },
    { name: 'Rahul S.', location: 'Bengaluru', stars: 5, quote: 'Ordered 20 Mini Kits as return gifts for my son\'s 7th birthday. All the kids and parents loved it! Will definitely order again.', role: 'Birthday Party Host' },
    { name: 'Ananya K.', location: 'Delhi NCR', stars: 5, quote: 'The figurine quality is smooth and heavy, colors are bright & non-toxic. Rangaroo is now our go-to birthday gift choice.', role: 'Mom of 8yo' },
  ];

  return (
    <div className="space-y-24 pb-20 overflow-hidden">

      {/* 1. HERO SECTION WITH OFFICIAL MASCOT LOGO */}
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-[#FFF9F2] via-orange-50/50 to-[#FFF9F2]">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-orange-400/20 via-yellow-300/20 to-purple-400/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-orange-200 shadow-sm text-xs md:text-sm font-bold text-orange-600 mb-6 animate-float">
                <span className="text-base">🦘</span>
                <span>Meet Rangoo! India's #1 DIY Paint Kit Brand</span>
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              </div>

              <h1 className="font-heading text-4xl sm:text-6xl lg:text-6xl text-slate-900 tracking-tight leading-tight">
                Where Little Hands Create <span className="gradient-text-orange inline-block">Big Smiles! 🎨</span>
              </h1>

              <p className="mt-6 text-base sm:text-xl text-slate-600 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Unbox creativity with thoughtfully designed DIY Paint Kits that encourage children to step away from screens and enjoy hands-on artistic adventures!
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  href="/products" 
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 hover:opacity-95 text-white font-heading text-lg px-8 py-4 rounded-2xl shadow-fun flex items-center justify-center gap-3 group transition-all transform hover:-translate-y-0.5"
                >
                  <span>Explore All Paint Kits</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link 
                  href="/#collections" 
                  className="w-full sm:w-auto bg-white hover:bg-orange-50 text-slate-800 border-2 border-orange-200 font-heading text-lg px-8 py-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span>View Collections 🦕</span>
                </Link>
              </div>

            </div>

            {/* Right Mascot Hero Card */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-purple-500 p-3 shadow-2xl flex items-center justify-center group">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-6 shadow-inner overflow-hidden relative">
                  <Image 
                    src="/rangoo.png" 
                    alt="Rangoo Kangaroo Mascot - Rangaroo DIY Paint Kits" 
                    width={360} 
                    height={360} 
                    className="w-full h-full object-contain drop-shadow-2xl animate-float group-hover:scale-105 transition-transform duration-500" 
                    priority
                  />
                </div>

                <div className="absolute -bottom-4 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full border-2 border-orange-300 shadow-xl flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <span className="font-heading text-sm text-slate-900">Paint. Create. Imagine.</span>
                </div>
              </div>
            </div>

          </div>

          {/* Trust Badges Bar */}
          <div className="mt-14 pt-8 border-t border-orange-200/60 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
            {[
              { icon: '📵', title: 'Screen-Free Fun' },
              { icon: '🧠', title: 'Boosts Concentration' },
              { icon: '🎁', title: 'Perfect Return Gift' },
              { icon: '🇮🇳', title: 'Made with Love in India' },
              { icon: '📦', title: 'Pan India Shipping' },
            ].map((badge, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-orange-100 shadow-sm flex items-center justify-center gap-2 text-xs font-bold text-slate-700">
                <span className="text-lg">{badge.icon}</span>
                <span>{badge.title}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 2. CHOOSE YOUR KIT TIERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="bg-orange-100 text-orange-600 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Curated For Every Budget
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl text-slate-900 mt-2">
            Choose Your DIY Paint Kit 🎁
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 4).map((cat) => (
            <div 
              key={cat.id} 
              className="bg-white rounded-3xl p-6 border-2 border-orange-100 shadow-card hover:shadow-fun transition-all duration-300 relative flex flex-col justify-between hover:-translate-y-2 group"
            >
              {cat.badge && (
                <div 
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs font-black px-4 py-1 rounded-full shadow-md uppercase tracking-wider"
                  style={{ backgroundColor: cat.badgeColor || '#FF6B35' }}
                >
                  {cat.badge}
                </div>
              )}

              <div>
                <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                  🎨
                </div>
                <h3 className="font-heading text-xl text-center text-slate-900 mb-2">{cat.name}</h3>
                <p className="text-slate-500 text-xs text-center leading-relaxed font-medium mb-6">
                  {cat.description}
                </p>
              </div>

              <div>
                <div className="text-center mb-4">
                  <span className="text-xs text-slate-400 font-bold block uppercase">Starting At</span>
                  <span className="font-heading text-3xl text-slate-900 font-extrabold">₹{cat.price}</span>
                </div>

                <Link 
                  href={`/products?category=${cat.id}`}
                  className="w-full bg-slate-900 hover:bg-orange-500 text-white font-heading text-sm py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span>Shop {cat.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. BESTSELLERS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="bg-purple-100 text-purple-600 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Loved By Kids
            </span>
            <h2 className="font-heading text-3xl sm:text-5xl text-slate-900 mt-2">
              Our Bestselling Kits 🌟
            </h2>
          </div>
          <Link 
            href="/products" 
            className="text-orange-500 font-heading text-base hover:underline flex items-center gap-1 font-bold"
          >
            <span>View All 20+ Kits</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. INTERACTIVE VIRTUAL PAINT STUDIO */}
      <VirtualPaintStudio />

      {/* 5. THEME COLLECTIONS GRID */}
      <section id="collections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="bg-amber-100 text-amber-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Endless Themes
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl text-slate-900 mt-2">
            Explore Theme Collections 🌈
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {collections.map((col) => (
            <Link 
              key={col.id} 
              href={`/collections/${col.slug}`}
              className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm hover:shadow-fun transition-all text-center group hover:-translate-y-1.5"
            >
              <div className="text-5xl mb-3 group-hover:scale-125 transition-transform duration-300">
                {col.emoji}
              </div>
              <h3 className="font-heading text-lg text-slate-900 group-hover:text-orange-500 transition-colors">
                {col.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">
                {col.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. UNBOXING & VIDEO DEMO SECTION */}
      <VideoSection />

      {/* 7. RETURN GIFT CALCULATOR FOR PARTY HOSTS */}
      <ReturnGiftCalculator />

      {/* 8. KIDS ARTWORK GALLERY SHOWCASE */}
      <KidsArtGallery />

      {/* 9. REVIEWS & TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading text-3xl sm:text-5xl text-slate-900">
            What Parents Are Saying 💬
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-orange-100 shadow-card space-y-4">
              <div className="flex text-amber-400 gap-1">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-sm font-medium leading-relaxed italic">
                "{t.quote}"
              </p>
              <div className="pt-2 border-t border-slate-100">
                <div className="font-heading text-slate-900 text-base">{t.name}</div>
                <div className="text-xs text-slate-400 font-bold">{t.role} • {t.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
