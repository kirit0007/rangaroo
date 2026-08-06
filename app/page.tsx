'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Palette, Shield, Gift, Star, Truck, Heart, ArrowRight, PaintBucket, Brush, Sparkles } from 'lucide-react';
import { getFeaturedProducts } from '@/data/products';
import ProductCard from '@/components/product/ProductCard';

export default function HomePage() {
  const featuredProducts = getFeaturedProducts().slice(0, 4);

  const kitTiers = [
    { name: 'Mini Kit', price: 149, color: 'bg-green-100 text-green-700', border: 'border-green-200', slug: 'mini-kit' },
    { name: 'Fun Kit', price: 199, color: 'bg-orange-100 text-orange-700', border: 'border-orange-200', slug: 'fun-kit' },
    { name: 'Creative Kit', price: 299, color: 'bg-purple-100 text-purple-700', border: 'border-purple-200', slug: 'creative-kit' },
    { name: 'Signature Collection', price: 499, color: 'bg-pink-100 text-pink-700', border: 'border-pink-200', slug: 'signature' },
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
    { title: 'Premium Plaster Figurines', icon: Palette, color: 'text-purple-500' },
    { title: 'Non-Toxic Colors (Safe for Kids)', icon: Shield, color: 'text-green-500' },
    { title: 'Gift-Ready Packaging', icon: Gift, color: 'text-pink-500' },
    { title: 'Perfect Return Gifts', icon: Heart, color: 'text-red-500' },
    { title: '4.9/5 Customer Rating', icon: Star, color: 'text-amber-500' },
    { title: 'Made in India', icon: Truck, color: 'text-orange-500' },
  ];

  const testimonials = [
    { name: 'Priya S.', location: 'Mumbai', text: 'My kids loved the dinosaur kit! The paints are really good quality.', rating: 5 },
    { name: 'Rahul M.', location: 'Bangalore', text: 'Perfect return gifts for my daughter\'s 6th birthday. Everyone was thrilled.', rating: 5 },
    { name: 'Anita K.', location: 'Delhi', text: 'Keeps them away from screens for hours. Beautiful packaging too!', rating: 5 },
  ];

  return (
    <div className="min-h-screen pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-gradient-to-br from-[#FFF9F2] to-orange-50">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-300 rounded-full mix-blend-multiply filter blur-2xl animate-blob"></div>
          <div className="absolute top-0 right-20 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-40 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h1 className="text-5xl lg:text-7xl font-outfit font-extrabold text-gray-900 leading-tight">
                Where Little Hands <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600">Create Big Smiles</span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 max-w-lg">
                Premium DIY plaster painting kits for kids. Spark imagination, build motor skills, and create lasting memories away from screens.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/products" className="px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2">
                  Shop Now <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/collections" className="px-8 py-4 bg-white text-orange-500 border-2 border-orange-200 rounded-full font-bold text-lg hover:border-orange-500 transition-colors shadow-sm">
                  Explore Collections
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600 pt-4 border-t border-orange-100">
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" /> Non-Toxic Colors</span>
                <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-orange-500" /> Made in India</span>
                <span className="flex items-center gap-1.5"><Gift className="w-4 h-4 text-pink-500" /> Gift-Ready</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500" /> 4.9/5 Rating</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative h-[400px] lg:h-[500px] flex items-center justify-center"
            >
              <Image 
                src="/rangoo.png" 
                alt="Rangoo Mascot" 
                width={400} 
                height={500} 
                className="object-contain z-10"
                priority
              />
              {/* Floating elements behind mascot */}
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-200/50 to-purple-200/50 rounded-full blur-3xl -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kit Tiers */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-outfit font-bold mb-4">Choose Your Canvas</h2>
          <p className="text-gray-600">A kit size for every occasion and budget</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kitTiers.map((tier, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className={`bg-white rounded-3xl p-6 border ${tier.border} shadow-sm hover:shadow-md transition-all flex flex-col`}
            >
              <div className={`w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 ${tier.color}`}>
                {tier.name}
              </div>
              <h3 className="text-2xl font-bold mb-2">Starting at ₹{tier.price}</h3>
              <p className="text-sm text-gray-500 mb-6 flex-grow">
                Perfect for {tier.name === 'Mini Kit' ? 'quick fun' : tier.name === 'Fun Kit' ? 'return gifts' : tier.name === 'Creative Kit' ? 'weekend activity' : 'special occasions'}.
              </p>
              <Link href={`/products?category=${tier.slug}`} className="w-full text-center py-2.5 rounded-xl border border-gray-200 font-medium hover:bg-gray-50 transition-colors">
                View Kits
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-outfit font-bold flex items-center gap-3">
                Our Bestsellers <Brush className="w-8 h-8 text-orange-500" />
              </h2>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/products" className="inline-flex items-center gap-2 text-orange-600 font-semibold">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Theme Collections */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-outfit font-bold mb-4">Explore Collections</h2>
          <p className="text-gray-600">Find the perfect theme for your little artist</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {collections.map((col, idx) => (
            <Link key={idx} href={`/collections/${col.slug}`}>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm border border-orange-100 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all cursor-pointer h-full"
              >
                <span className="text-4xl mb-3">{col.emoji}</span>
                <h3 className="font-bold text-gray-900 mb-1">{col.name}</h3>
                <p className="text-xs text-gray-500">{col.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-[#FFF9F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-outfit font-bold mb-4">How It Works</h2>
            <p className="text-gray-600">Three simple steps to unleash creativity</p>
          </div>
          
          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-orange-200 via-purple-200 to-pink-200 -translate-y-1/2 z-0 rounded-full border-t border-dashed border-white"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              {[
                { step: 1, title: 'Choose Your Kit', desc: 'Pick from our wide range of fun themes and sizes.', icon: Gift, color: 'bg-orange-100 text-orange-600' },
                { step: 2, title: 'Paint & Create', desc: 'Use the included non-toxic paints and brush to bring it to life.', icon: Palette, color: 'bg-purple-100 text-purple-600' },
                { step: 3, title: 'Display & Gift', desc: 'Show off your masterpiece or give it as a handmade present!', icon: Sparkles, color: 'bg-pink-100 text-pink-600' }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className={`w-20 h-20 rounded-full ${item.color} flex items-center justify-center mb-6 shadow-lg border-4 border-white relative`}>
                    <item.icon className="w-10 h-10" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600 max-w-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Rangaroo (USP) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-outfit font-bold text-center mb-12">Why Parents Love Us</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {usps.map((usp, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center hover:border-orange-200 transition-colors">
              <usp.icon className={`w-8 h-8 mb-4 ${usp.color}`} />
              <h3 className="font-semibold text-sm md:text-base text-gray-900">{usp.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-b from-transparent to-orange-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-center mb-12">Happy Little Artists</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((test, idx) => (
              <div key={idx} className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl p-8 shadow-sm">
                <div className="flex text-amber-400 mb-4">
                  {[...Array(test.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-gray-700 italic mb-6">"{test.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{test.name}</p>
                  <p className="text-sm text-gray-500">{test.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden">
          {/* Decorative elements */}
          <PaintBucket className="absolute top-10 left-10 w-24 h-24 text-white/10 -rotate-12" />
          <Palette className="absolute bottom-10 right-10 w-32 h-32 text-white/10 rotate-12" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-outfit font-bold mb-6">Ready to Paint?</h2>
            <p className="text-lg md:text-xl text-orange-50 mb-10">Start your creative journey today with our premium DIY kits. Perfect for weekends, playdates, and gifts!</p>
            <Link href="/products" className="inline-block px-10 py-4 bg-white text-orange-600 rounded-full font-bold text-lg hover:bg-orange-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Shop All Kits
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
