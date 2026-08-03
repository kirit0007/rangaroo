'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X, Sparkles, PhoneCall } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toggleCart, getItemCount } = useCartStore();
  const itemCount = getItemCount();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-white text-xs md:text-sm py-2 px-4 text-center font-bold tracking-wide shadow-inner flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
        <span>🎨 FREE Pan-India Shipping on orders above ₹499! Use Code: <span className="bg-white/20 px-2 py-0.5 rounded-full text-yellow-200">FIRST10</span></span>
        <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
      </div>

      {/* Main Sticky Navbar */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'glass-nav py-3 shadow-md' : 'bg-[#FFF9F2] py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-yellow-400 p-0.5 shadow-fun group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-2xl">
                🦘
              </div>
            </div>
            <div>
              <span className="font-heading text-2xl md:text-3xl text-slate-900 tracking-wide block leading-none group-hover:text-orange-500 transition-colors">
                RANGAROO
              </span>
              <span className="text-[10px] font-bold text-orange-500 tracking-wider uppercase block mt-0.5">
                DIY Art & Craft Kits
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="font-bold text-slate-700 hover:text-orange-500 transition-colors text-sm uppercase tracking-wider">
              Home
            </Link>
            <Link href="/products" className="font-bold text-slate-700 hover:text-orange-500 transition-colors text-sm uppercase tracking-wider">
              Shop All Kits
            </Link>
            <Link href="/#collections" className="font-bold text-slate-700 hover:text-orange-500 transition-colors text-sm uppercase tracking-wider">
              Collections
            </Link>
            <Link href="/about" className="font-bold text-slate-700 hover:text-orange-500 transition-colors text-sm uppercase tracking-wider">
              Our Story
            </Link>
            <Link href="/faq" className="font-bold text-slate-700 hover:text-orange-500 transition-colors text-sm uppercase tracking-wider">
              FAQ
            </Link>
          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            <a 
              href="https://wa.me/918793687379?text=Hi! I need help with an order on Rangaroo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-2xl text-xs font-bold hover:bg-emerald-100 transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Need Help?</span>
            </a>

            {/* Cart Icon Button */}
            <button 
              onClick={toggleCart} 
              className="relative p-3 rounded-2xl bg-white border border-orange-200 shadow-sm text-slate-800 hover:bg-orange-50 hover:border-orange-300 transition-all group"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-6 h-6 text-slate-800 group-hover:scale-110 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce-slow">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-3 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-6 shadow-xl animate-fadeIn">
            <div className="flex flex-col gap-4">
              <Link 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-heading text-lg text-slate-900 hover:text-orange-500 py-2 border-b border-slate-100"
              >
                🏠 Home
              </Link>
              <Link 
                href="/products" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-heading text-lg text-slate-900 hover:text-orange-500 py-2 border-b border-slate-100"
              >
                🎨 Shop All Kits
              </Link>
              <Link 
                href="/#collections" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-heading text-lg text-slate-900 hover:text-orange-500 py-2 border-b border-slate-100"
              >
                ✨ Collections
              </Link>
              <Link 
                href="/about" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-heading text-lg text-slate-900 hover:text-orange-500 py-2 border-b border-slate-100"
              >
                🦘 Our Story
              </Link>
              <Link 
                href="/faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-heading text-lg text-slate-900 hover:text-orange-500 py-2 border-b border-slate-100"
              >
                ❓ FAQ
              </Link>
              <Link 
                href="/contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-heading text-lg text-slate-900 hover:text-orange-500 py-2"
              >
                📞 Contact Us
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
