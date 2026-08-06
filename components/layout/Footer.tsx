'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, Heart, Play, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-white pt-16 pb-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--brand-orange)] to-[var(--brand-purple)] opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[var(--brand-amber)] to-[var(--brand-pink)] opacity-20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Rangaroo Logo" width={48} height={48} unoptimized />
              <span className="font-heading font-bold text-3xl text-white">Rangaroo</span>
            </Link>
            <p className="text-gray-400 italic text-sm">"Paint. Create. Imagine."</p>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              Premium DIY Paint Kits for Kids. Sparking creativity and building fine motor skills one canvas at a time. Safe, non-toxic, and endlessly fun!
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--brand-orange)] transition-colors">
                <Globe size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--brand-orange)] transition-colors">
                <Heart size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[var(--brand-orange)] transition-colors">
                <Play size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-6 text-white border-b border-white/20 pb-2 inline-block">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: 'Home', path: '/' },
                { name: 'Shop All', path: '/products' },
                { name: 'About Us', path: '/about' },
                { name: 'Contact', path: '/contact' },
                { name: 'FAQ', path: '/faq' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.path} className="text-gray-300 hover:text-[var(--brand-amber)] transition-colors text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-orange)]"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-6 text-white border-b border-white/20 pb-2 inline-block">Customer Care</h4>
            <ul className="space-y-3">
              {[
                { name: 'Shipping Policy', path: '/shipping-policy' },
                { name: 'Return Policy', path: '/refund-policy' },
                { name: 'Privacy Policy', path: '/privacy-policy' },
                { name: 'Terms of Service', path: '/terms' },
                { name: 'Track Order', path: '/checkout' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.path} className="text-gray-300 hover:text-[var(--brand-amber)] transition-colors text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-orange)]"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div className="space-y-6">
            <div>
              <h4 className="font-heading font-semibold text-lg mb-6 text-white border-b border-white/20 pb-2 inline-block">Get in Touch</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <MapPin size={18} className="text-[var(--brand-orange)] shrink-0 mt-0.5" />
                  <span>123 Creative Studio, Art District, Mumbai, India 400001</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Phone size={18} className="text-[var(--brand-orange)] shrink-0" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Mail size={18} className="text-[var(--brand-orange)] shrink-0" />
                  <span>hello@rangaroo.in</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-2">
              <p className="text-sm font-medium mb-3 text-white">Join our newsletter for 10% off!</p>
              <div className="flex items-center w-full max-w-sm rounded-full bg-white/10 p-1 border border-white/20 focus-within:border-[var(--brand-orange)] transition-colors">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="bg-transparent text-white px-4 py-2 w-full text-sm outline-none placeholder-gray-400"
                />
                <button className="bg-[var(--brand-orange)] hover:bg-[var(--brand-amber)] transition-colors text-white px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © 2026 Rangaroo. Made with <span className="text-red-500">❤️</span> in India.
          </p>
          <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            {/* Payment Method Badges placeholders */}
            <div className="h-8 w-12 bg-white rounded flex items-center justify-center text-[10px] font-bold text-black">UPI</div>
            <div className="h-8 w-12 bg-white rounded flex items-center justify-center text-[10px] font-bold text-black">VISA</div>
            <div className="h-8 w-12 bg-white rounded flex items-center justify-center text-[10px] font-bold text-blue-800">AMEX</div>
            <div className="h-8 w-16 bg-white rounded flex items-center justify-center text-[10px] font-bold text-blue-500 border">Razorpay</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
