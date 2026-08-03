'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Award, Gift, Palette, Smile } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { getFeaturedProducts, categories, collections } from '@/data/products';

export default function HomePage() {
  const featuredProducts = getFeaturedProducts();

  return (
    <div className="space-y-20 pb-16 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-[#FFF9F2] via-orange-50/50 to-[#FFF9F2]">
        
        {/* Background Decor Elements */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-orange-400/20 via-yellow-300/20 to-purple-400/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-orange-200 shadow-sm text-xs md:text-sm font-bold text-orange-600 mb-6 animate-float">
            <span className="text-base">🦘</span>
            <span>Meet Rangoo! India's #1 DIY Paint Kit Brand</span>
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>

          {/* Main Hero Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Where Little Hands Create <span className="gradient-text-orange inline-block">Big Smiles! 🎨</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Unbox creativity with thoughtfully designed DIY Paint Kits that encourage children to step away from screens and enjoy hands-on artistic adventures!
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
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

          {/* Trust Badges Bar */}
          <div className="mt-14 pt-8 border-t border-orange-200/60 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
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
          <p className="text-slate-600 mt-3 font-medium">
            From starter duos to complete signature collections, every kit includes non-toxic paints and brushes!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 4).map((cat) => (
            <div 
              key={cat.id} 
              className="bg-white rounded-3xl p-6 border-2 border-orange-100 shadow-card hover:shadow-fun transition-all duration-300 relative flex flex-col justify-between hover:-translate-y-2 group"
            >
              {/* Top Badge */}
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

      {/* 3. BESTSELLERS PRODUCT CAROUSEL */}
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

      {/* 4. EXPLORE COLLECTIONS GRID */}
      <section id="collections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="bg-amber-100 text-amber-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Endless Themes
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl text-slate-900 mt-2">
            Explore Theme Collections 🌈
          </h2>
          <p className="text-slate-600 mt-3 font-medium">
            Find the perfect theme for your child's passion — from prehistoric dinos to magical wizards!
          </p>
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

      {/* 5. HOW IT WORKS SECTION */}
      <section className="bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 py-16 text-white rounded-3xl max-w-7xl mx-auto px-6 sm:px-12 shadow-2xl relative overflow-hidden">
        <div className="text-center max-w-2xl mx-auto mb-12 relative z-10">
          <span className="bg-white/20 text-yellow-200 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
            Simple & Fun
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl text-white mt-2">
            How Rangaroo Magic Works ✨
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {[
            { step: '01', icon: '📦', title: 'Unbox Your Kit', desc: 'Open your box to find premium figurines, non-toxic colors, brushes & guides.' },
            { step: '02', icon: '🎨', title: 'Paint & Create', desc: 'Use the included colors to bring your figurines to life with vibrant imagination!' },
            { step: '03', icon: '✨', title: 'Display & Gift', desc: 'Showcase your masterpiece proudly at home or gift it to loved ones!' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center relative">
              <div className="text-4xl mb-3">{item.icon}</div>
              <span className="text-xs font-black bg-white/20 text-yellow-200 px-3 py-1 rounded-full">STEP {item.step}</span>
              <h3 className="font-heading text-2xl text-white mt-3 mb-2">{item.title}</h3>
              <p className="text-white/80 text-sm font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. WHY FAMILIES LOVE RANGAROO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading text-3xl sm:text-5xl text-slate-900">
            Why Parents & Kids Love Us 💛
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Palette, title: 'Unleashes Creativity', desc: 'Encourages self-expression through colors and design.' },
            { icon: ShieldCheck, title: '100% Child-Safe', desc: 'EN71 certified non-toxic paints and smooth edges.' },
            { icon: Smile, title: 'Screen-Free Play', desc: 'Hours of engaging, meaningful hands-on play time.' },
            { icon: Gift, title: 'Ideal Birthday Gift', desc: 'Unique return gifts loved by kids and parents alike.' },
          ].map((usp, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center mx-auto mb-4">
                <usp.icon className="w-7 h-7" />
              </div>
              <h3 className="font-heading text-lg text-slate-900 mb-2">{usp.title}</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">{usp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. BULK / BIRTHDAY CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 to-purple-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-purple-800">
          <div className="space-y-3 text-center md:text-left">
            <span className="bg-amber-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Planning A Birthday Party? 🎂
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-white">
              Bulk Orders & Custom Return Gifts
            </h2>
            <p className="text-slate-300 text-sm max-w-xl font-medium">
              Make your child's birthday unforgettable! Enjoy attractive bulk discounts, custom packaging & pan-India delivery on 10+ kits.
            </p>
          </div>

          <a 
            href="https://wa.me/918793687379?text=Hi! I want to inquire about bulk return gifts for a birthday party."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-heading text-lg px-8 py-4 rounded-2xl shadow-lg flex items-center gap-3 shrink-0 hover:scale-105 transition-all"
          >
            <span>Chat for Bulk Orders</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

    </div>
  );
}
