'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { getFeaturedProducts } from '@/data/products';
import { Product } from '@/types';

// Hardcoded collections
const collections = [
  { id: 'dinosaur', name: 'Dinosaur', emoji: '🦕', desc: 'Roar into creativity', color: '#4CAF50' },
  { id: 'space', name: 'Space', emoji: '🚀', desc: 'Out of this world fun', color: '#2196F3' },
  { id: 'vehicle', name: 'Vehicle', emoji: '🚗', desc: 'Vroom vroom paint', color: '#F44336' },
  { id: 'animal', name: 'Animal', emoji: '🐾', desc: 'Wildly creative', color: '#FF9800' },
  { id: 'food', name: 'Food', emoji: '🍕', desc: 'Deliciously fun', color: '#E91E63' },
  { id: 'princess', name: 'Princess', emoji: '👸', desc: 'Royal masterpieces', color: '#9C27B0' },
  { id: 'harry-potter', name: 'Harry Potter', emoji: '⚡', desc: 'Magical painting', color: '#795548' },
  { id: 'cartoon', name: 'Cartoon', emoji: '🎭', desc: 'Favorite characters', color: '#FFEB3B' },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    // In a real app this might be fetched from an API
    setFeaturedProducts(getFeaturedProducts());
  }, []);

  return (
    <div className="home-page">
      {/* 1. Hero Section */}
      <section className="hero bg-cream relative overflow-hidden py-16 md:py-24">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="hero-title text-5xl md:text-7xl font-bold text-dark mb-6 animate-fadeIn">
            Where Little Hands Create <span className="text-orange">Big Smiles</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto animate-fadeIn delay-100">
            DIY Paint Kits that spark creativity, imagination & joyful learning for kids & families
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 animate-fadeIn delay-200">
            <Link href="/products" className="btn-primary px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:scale-105 transition-transform inline-block">
              Shop Now
            </Link>
            <Link href="#collections" className="btn-outline px-8 py-3 rounded-full text-lg font-bold border-2 border-orange text-orange hover:bg-orange hover:text-white transition-colors inline-block">
              Explore Collections
            </Link>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm md:text-base font-semibold text-gray-600 animate-fadeIn delay-300">
            <span className="flex items-center gap-2">📵 Screen-Free Fun</span>
            <span className="flex items-center gap-2">🧠 Educational</span>
            <span className="flex items-center gap-2">🎁 Perfect Gift</span>
            <span className="flex items-center gap-2">🇮🇳 Made in India</span>
            <span className="flex items-center gap-2">📦 Pan India Shipping</span>
          </div>
        </div>
        
        {/* Paint Splatter Decorations */}
        <div className="absolute top-10 left-10 text-orange opacity-20 text-6xl">🎨</div>
        <div className="absolute bottom-10 right-10 text-purple opacity-20 text-6xl">🎨</div>
        <div className="absolute top-1/2 left-4 text-pink opacity-20 text-4xl transform -translate-y-1/2">🎨</div>
        <div className="absolute top-1/3 right-8 text-yellow opacity-20 text-5xl">🎨</div>
      </section>

      {/* 2. Kit Tiers Section */}
      <section className="section-padding bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-dark">Choose Your Kit</h2>
          <div className="grid-1 md:grid-2 lg:grid-4 gap-6">
            {/* Mini Paint Kit */}
            <Link href="/products?category=mini" className="card border-2 border-[#4CAF50] hover:border-[#4CAF50] rounded-2xl p-6 relative flex flex-col h-full transition-all hover:-translate-y-2 hover:shadow-xl group animate-fadeIn delay-100">
              <span className="absolute -top-3 right-4 bg-[#4CAF50] text-white text-xs font-bold px-3 py-1 rounded-full">Starter</span>
              <h3 className="text-xl font-bold text-dark mb-2">Mini Paint Kit</h3>
              <p className="text-2xl font-black text-[#4CAF50] mb-4">₹149</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6 flex-grow">
                <li>✨ 1-2 Figures</li>
                <li>🎨 4 Tempera Colors</li>
                <li>🖌️ 1 Brush</li>
              </ul>
              <span className="btn-outline border-[#4CAF50] text-[#4CAF50] group-hover:bg-[#4CAF50] group-hover:text-white mt-auto w-full text-center py-2 rounded-full inline-block">View Kits</span>
            </Link>

            {/* Fun Paint Kit */}
            <Link href="/products?category=fun" className="card border-2 border-orange hover:border-orange rounded-2xl p-6 relative flex flex-col h-full transition-all hover:-translate-y-2 hover:shadow-xl group animate-fadeIn delay-200">
              <span className="absolute -top-3 right-4 bg-orange text-white text-xs font-bold px-3 py-1 rounded-full">Popular</span>
              <h3 className="text-xl font-bold text-dark mb-2">Fun Paint Kit</h3>
              <p className="text-2xl font-black text-orange mb-4">₹199</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6 flex-grow">
                <li>✨ 2-3 Figures</li>
                <li>🎨 6 Tempera Colors</li>
                <li>🖌️ 1 Brush</li>
              </ul>
              <span className="btn-outline border-orange text-orange group-hover:bg-orange group-hover:text-white mt-auto w-full text-center py-2 rounded-full inline-block">View Kits</span>
            </Link>

            {/* Creative Paint Kit */}
            <Link href="/products?category=creative" className="card border-2 border-purple hover:border-purple rounded-2xl p-6 relative flex flex-col h-full transition-all hover:-translate-y-2 hover:shadow-xl group animate-fadeIn delay-300">
              <span className="absolute -top-3 right-4 bg-purple text-white text-xs font-bold px-3 py-1 rounded-full">Premium</span>
              <h3 className="text-xl font-bold text-dark mb-2">Creative Paint Kit</h3>
              <p className="text-2xl font-black text-purple mb-4">₹299</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6 flex-grow">
                <li>✨ 3 Figures</li>
                <li>🎨 6 Acrylic Colors</li>
                <li>🖌️ 2 Brushes</li>
                <li>🎁 Premium Box</li>
              </ul>
              <span className="btn-outline border-purple text-purple group-hover:bg-purple group-hover:text-white mt-auto w-full text-center py-2 rounded-full inline-block">View Kits</span>
            </Link>

            {/* Signature Collection */}
            <Link href="/products?category=signature" className="card border-2 border-pink hover:border-pink rounded-2xl p-6 relative flex flex-col h-full transition-all hover:-translate-y-2 hover:shadow-xl group animate-fadeIn delay-400">
              <span className="absolute -top-3 right-4 bg-pink text-white text-xs font-bold px-3 py-1 rounded-full">Best Value</span>
              <h3 className="text-xl font-bold text-dark mb-2">Signature Collection</h3>
              <p className="text-2xl font-black text-pink mb-4">₹499</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6 flex-grow">
                <li>✨ All 6 Figures</li>
                <li>🎨 8 Acrylic Colors</li>
                <li>🖌️ 2 Brushes</li>
                <li>🎁 Premium Gift Box</li>
              </ul>
              <span className="btn-outline border-pink text-pink group-hover:bg-pink group-hover:text-white mt-auto w-full text-center py-2 rounded-full inline-block">View Kits</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Featured Products Section */}
      <section className="section-padding bg-cream py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-dark">🌟 Our Bestsellers</h2>
          
          <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory hide-scrollbar">
            {featuredProducts.slice(0, 8).map(product => (
              <div key={product.id} className="min-w-[280px] md:min-w-[320px] snap-center">
                <ProductCard product={product} />
              </div>
            ))}
            {featuredProducts.length === 0 && (
              <div className="w-full text-center text-gray-500 py-10">Loading amazing products...</div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Collections Grid */}
      <section id="collections" className="section-padding bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-dark">🎨 Explore Collections</h2>
          
          <div className="grid-2 md:grid-3 lg:grid-4 gap-6">
            {collections.map(collection => (
              <Link 
                key={collection.id} 
                href={`/collections/${collection.id}`}
                className="card rounded-2xl p-6 text-center transition-transform hover:-translate-y-2 shadow-md hover:shadow-xl"
                style={{ backgroundColor: `${collection.color}15`, borderBottom: `4px solid ${collection.color}` }}
              >
                <div className="text-5xl mb-4">{collection.emoji}</div>
                <h3 className="text-xl font-bold mb-2 text-dark">{collection.name}</h3>
                <p className="text-sm text-gray-600">{collection.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="section-padding bg-cream py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-dark">✨ How It Works</h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative max-w-4xl mx-auto">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-1 border-t-4 border-dashed border-gray-300 -z-10"></div>
            
            <div className="text-center w-full md:w-1/3 animate-fadeIn delay-100">
              <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg border-4 border-orange">📦</div>
              <h3 className="text-2xl font-bold mb-3 text-dark">1. Unbox</h3>
              <p className="text-gray-600 px-4">Open your Rangaroo kit and discover everything inside</p>
            </div>
            
            <div className="text-center w-full md:w-1/3 animate-fadeIn delay-200">
              <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg border-4 border-yellow">🎨</div>
              <h3 className="text-2xl font-bold mb-3 text-dark">2. Paint</h3>
              <p className="text-gray-600 px-4">Follow the guide or let your imagination run wild!</p>
            </div>
            
            <div className="text-center w-full md:w-1/3 animate-fadeIn delay-300">
              <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg border-4 border-purple">🌟</div>
              <h3 className="text-2xl font-bold mb-3 text-dark">3. Display</h3>
              <p className="text-gray-600 px-4">Show off your colorful masterpiece to everyone!</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Why Rangaroo Section */}
      <section className="section-padding bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-dark">💛 Why Families Love Rangaroo</h2>
          
          <div className="grid-1 sm:grid-2 lg:grid-4 gap-6">
            {[
              { icon: '✨', title: 'Encourages Creativity', desc: 'Unleash artistic potential with every brushstroke' },
              { icon: '🧠', title: 'Learning Through Play', desc: 'Develop fine motor skills, focus & confidence' },
              { icon: '📵', title: 'Screen-Free Fun', desc: 'Quality creative time away from devices' },
              { icon: '🎁', title: 'Perfect for Gifts', desc: 'Birthdays, return gifts, festivals & more' },
              { icon: '👨‍👩‍👧', title: 'Family Bonding', desc: 'Paint together, create memories together' },
              { icon: '🎨', title: 'Beginner Friendly', desc: 'Easy to use, fun for all skill levels' },
              { icon: '🇮🇳', title: 'Made in India', desc: 'Proudly designed & crafted in India' },
              { icon: '🛡️', title: 'Safe & Non-Toxic', desc: 'EN71 certified colors, smooth edges, child-safe' },
            ].map((usp, i) => (
              <div key={i} className="card p-6 rounded-2xl bg-cream flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4 bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm">{usp.icon}</div>
                <h3 className="text-lg font-bold mb-2 text-dark">{usp.title}</h3>
                <p className="text-sm text-gray-600">{usp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Testimonials Section */}
      <section className="section-padding bg-purple/5 py-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-dark">💬 What Parents Are Saying</h2>
          
          <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory hide-scrollbar">
            {[
              { name: 'Priya M.', loc: 'Mumbai', stars: 5, comment: "My daughter loved painting the princess kit! She was engaged for hours. Best screen-free activity we've tried." },
              { name: 'Rahul S.', loc: 'Bangalore', stars: 5, comment: "Ordered 15 mini kits as return gifts for my son's birthday party. Every kid loved it! Will definitely order again." },
              { name: 'Ananya K.', loc: 'Delhi', stars: 5, comment: "The quality of figurines is amazing. Colors are vibrant and safe. Rangaroo is now our go-to gift choice!" },
              { name: 'Deepak J.', loc: 'Pune', stars: 4, comment: "Great product, my kids painted the dinosaur set and it looked beautiful. Fast delivery too!" },
              { name: 'Sneha R.', loc: 'Hyderabad', stars: 5, comment: "The Ganesha kit was perfect for Ganesh Chaturthi. Such a meaningful family activity. Loved it!" },
            ].map((test, i) => (
              <div key={i} className="min-w-[300px] md:min-w-[350px] snap-center bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-full">
                <div className="flex text-[#FFD23F] mb-4 text-xl">
                  {Array.from({length: 5}).map((_, j) => (
                    <span key={j} className={j < test.stars ? '' : 'opacity-30'}>⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 italic mb-6 flex-grow">"{test.comment}"</p>
                <div className="mt-auto">
                  <p className="font-bold text-dark">{test.name}</p>
                  <p className="text-sm text-gray-500">{test.loc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA Banner */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl bg-orange rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-[#FFD23F]/30 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Create? 🎨</h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">Start your child's creative journey today!</p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <Link href="/products" className="bg-white text-orange font-bold text-xl px-10 py-4 rounded-full shadow-lg hover:scale-105 transition-transform w-full sm:w-auto text-center inline-block">
                Shop Now
              </Link>
              
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:underline flex items-center gap-2">
                Have Questions? Chat with us! 💬
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
