'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';

export default function Footer() {
  const siteSettings = useAdminStore((state) => state.siteSettings);

  const rawPhone = siteSettings.whatsappNumber || siteSettings.contactPhone || '+91 87936 87379';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const instaHandle = siteSettings.instagramHandle || 'ranga.roo';
  const instaUrl = siteSettings.instagramUrl || `https://www.instagram.com/${instaHandle.replace('@', '')}/`;

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
            <p className="text-gray-400 italic text-sm">{siteSettings.footerTagline || '"Paint. Create. Imagine."'}</p>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              {siteSettings.footerDescription || 'Premium DIY Paint Kits for Kids. Sparking creativity and building fine motor skills one canvas at a time. Safe, non-toxic, and endlessly fun!'}
            </p>
            
            {/* Social Logos matching Image 1 */}
            <div className="flex items-center gap-3 pt-2">
              {/* WhatsApp */}
              <a 
                href={`https://wa.me/${cleanPhone}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md"
                title={`WhatsApp Support ${rawPhone}`}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.399.636-1.155 4.218 4.319-1.132.58.345zm11.758-5.748c-.296-.148-1.747-.862-2.017-.96-.27-.099-.467-.148-.665.149-.197.296-.764.96-.937 1.157-.173.198-.345.223-.641.074-.296-.149-1.252-.462-2.386-1.475-.882-.788-1.48-1.761-1.653-2.058-.173-.297-.018-.458.13-.606.134-.133.296-.347.444-.521.148-.173.197-.296.296-.495.099-.198.05-.371-.025-.52-.075-.148-.665-1.604-.911-2.198-.24-.579-.487-.501-.665-.51-.172-.009-.37-.01-.567-.01-.198 0-.52.074-.79.371-.27.296-1.035 1.013-1.035 2.471s1.06 2.866 1.207 3.064c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.271-.198-.567-.347z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href={instaUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#fccc63] via-[#fba756] via-[#d62976] via-[#962fbf] to-[#4f5bd5] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md"
                title={`Instagram ${instaHandle}`}
              >
                <svg className="w-5 h-5 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>

              {/* Email */}
              <a 
                href={`mailto:${siteSettings.contactEmail || 'hello@rangaroo.store'}`} 
                className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md"
                title={`Email ${siteSettings.contactEmail || 'hello@rangaroo.store'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 6l-10 7L2 6"/>
                </svg>
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
                { name: 'Track Order', path: '/orders' },
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

          {/* Contact Section matching Image 1 */}
          <div className="space-y-6">
            <div>
              <h4 className="font-heading font-semibold text-lg mb-6 text-white border-b border-white/20 pb-2 inline-block">Get in Touch</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <MapPin size={18} className="text-[var(--brand-orange)] shrink-0 mt-0.5" />
                  <span>{siteSettings.contactLocation || 'India IN (Shipping Nationwide)'}</span>
                </li>

                {/* WhatsApp / Phone */}
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-emerald-400 transition-colors group">
                    <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.399.636-1.155 4.218 4.319-1.132.58.345zm11.758-5.748c-.296-.148-1.747-.862-2.017-.96-.27-.099-.467-.148-.665.149-.197.296-.764.96-.937 1.157-.173.198-.345.223-.641.074-.296-.149-1.252-.462-2.386-1.475-.882-.788-1.48-1.761-1.653-2.058-.173-.297-.018-.458.13-.606.134-.133.296-.347.444-.521.148-.173.197-.296.296-.495.099-.198.05-.371-.025-.52-.075-.148-.665-1.604-.911-2.198-.24-.579-.487-.501-.665-.51-.172-.009-.37-.01-.567-.01-.198 0-.52.074-.79.371-.27.296-1.035 1.013-1.035 2.471s1.06 2.866 1.207 3.064c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.271-.198-.567-.347z"/>
                      </svg>
                    </div>
                    <span className="font-semibold text-white group-hover:text-emerald-400">{rawPhone}</span>
                  </a>
                </li>

                {/* Instagram Handle */}
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <a href={instaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-pink-400 transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#fccc63] via-[#fba756] via-[#d62976] via-[#962fbf] to-[#4f5bd5] flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                      </svg>
                    </div>
                    <span className="font-semibold text-white group-hover:text-pink-400">{instaHandle}</span>
                  </a>
                </li>

                {/* Email Address */}
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <a href={`mailto:${siteSettings.contactEmail || 'hello@rangaroo.store'}`} className="flex items-center gap-3 hover:text-orange-400 transition-colors group">
                    <div className="w-7 h-7 rounded-full bg-black border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="M22 6l-10 7L2 6"/>
                      </svg>
                    </div>
                    <span className="font-semibold text-white group-hover:text-orange-400">{siteSettings.contactEmail || 'hello@rangaroo.store'}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            {siteSettings.copyrightText || '© 2026 Rangaroo. Made with ❤️ in India.'}
          </p>
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-all duration-300">
            <div className="h-8 w-12 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white border border-white/10">UPI</div>
            <div className="h-8 w-12 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white border border-white/10">VISA</div>
            <div className="h-8 w-12 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white border border-white/10">RuPay</div>
            <div className="h-8 w-16 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white border border-white/10">Razorpay</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
