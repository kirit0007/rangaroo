import Link from 'next/link';
import { Heart, Mail, Phone, MapPin, Sparkles, Camera } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t-4 border-orange-500 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-yellow-400 p-0.5 shadow-fun">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-2xl">
                  🦘
                </div>
              </div>
              <span className="font-heading text-3xl text-white tracking-wide">
                RANGAROO
              </span>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
              India's favorite DIY art & craft brand inspiring creativity, hands-on learning, and screen-free fun for children and families.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://instagram.com/ranga.roo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-md"
                aria-label="Instagram"
              >
                <Camera className="w-5 h-5" />
              </a>
              <a 
                href="https://wa.me/918793687379" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-md"
                aria-label="WhatsApp"
              >
                <span className="text-lg">💬</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Explore Kits</span>
            </h4>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li><Link href="/products" className="hover:text-orange-400 transition-colors">Shop All Kits</Link></li>
              <li><Link href="/#collections" className="hover:text-orange-400 transition-colors">Dinosaur Collection 🦕</Link></li>
              <li><Link href="/#collections" className="hover:text-orange-400 transition-colors">Space Collection 🚀</Link></li>
              <li><Link href="/#collections" className="hover:text-orange-400 transition-colors">Princess Collection 👸</Link></li>
              <li><Link href="/#collections" className="hover:text-orange-400 transition-colors">Harry Potter Kit ⚡</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-heading text-lg text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Help & Support</span>
            </h4>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li><Link href="/about" className="hover:text-orange-400 transition-colors">About Rangaroo</Link></li>
              <li><Link href="/faq" className="hover:text-orange-400 transition-colors">Frequently Asked Questions</Link></li>
              <li><Link href="/contact" className="hover:text-orange-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-orange-400 transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/refund-policy" className="hover:text-orange-400 transition-colors">Refund & Returns</Link></li>
            </ul>
          </div>

          {/* Legal Pages */}
          <div>
            <h4 className="font-heading text-lg text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Legal</span>
            </h4>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li><Link href="/privacy-policy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-orange-400 transition-colors">Grievance Redressal</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>in India 🇮🇳</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 font-bold">UPI</span>
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 font-bold">Google Pay</span>
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 font-bold">PhonePe</span>
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 font-bold">Cards & Netbanking</span>
          </div>

          <div>
            © {new Date().getFullYear()} Rangaroo. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
