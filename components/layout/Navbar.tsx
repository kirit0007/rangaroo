'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, ChevronDown, Search, Heart, Sparkles, Copy, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAdminStore } from '@/store/adminStore';
import { products as defaultProducts } from '@/data/products';
import { createClient } from '@/lib/supabase/client';
import BulkInquiryModal from '@/components/modals/BulkInquiryModal';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    // Sync live system CMS settings & coupons from API across sessions & devices
    useAdminStore.getState().fetchSiteSettings();
    useAdminStore.getState().fetchCoupons();

    const supabase = createClient();

    // Check current Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        useAuthStore.getState().setUser({
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          role: session.user.user_metadata?.role || 'customer',
        });
      }
    });

    // Listen for OAuth login returns, session refreshes, and auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        useAuthStore.getState().setUser({
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          role: session.user.user_metadata?.role || 'customer',
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const handleCopyCoupon = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      toast.success(`Coupon ${code} copied to clipboard! 🎉`, { duration: 3000 });
    } catch (_err) {
      toast.success(`Coupon ${code} ready at checkout! 🎉`);
    }
  };

  // Zustand stores with atomic selectors to prevent infinite re-renders
  const user = useAuthStore((state) => state.user);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const signOut = useAuthStore((state: any) => state.signOut || state.logout);

  const items = useCartStore((state) => state.items) || [];
  const openCart = useCartStore((state) => state.openCart);
  const wishlistItems = useWishlistStore((state) => state.items) || [];

  const siteSettings = useAdminStore((state) => state.siteSettings) || { announcementText: '🎨 Free shipping on all orders over ₹499!' };

  const cartItemCount = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
  const wishlistCount = wishlistItems.length;

  const adminProducts = useAdminStore((state) => state.products);
  const allProducts = adminProducts && adminProducts.length > 0 ? adminProducts : defaultProducts;

  const searchResults = searchQuery.trim().length > 0
    ? allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/products' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      {/* Announcement Bar */}
      {siteSettings.announcementText && (
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-center py-2 text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 px-4 shadow-2xs">
          <span>{siteSettings.announcementText}</span>
        </div>
      )}

      {/* Main Navbar */}
      <nav
        className={`sticky top-0 z-30 transition-all duration-300 ${
          isScrolled
            ? 'glass-panel mx-4 mt-2 mb-2 py-3 px-6 shadow-md'
            : 'bg-transparent py-5 px-6'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 z-50">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }} 
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-100 via-amber-50 to-pink-50 p-1 border border-orange-200/80 shadow-sm flex items-center justify-center overflow-hidden shrink-0"
            >
              <Image 
                src="/logo.png" 
                alt="Rangaroo Logo" 
                width={38} 
                height={38} 
                className="w-full h-full object-contain"
                unoptimized
              />
            </motion.div>
            <span className="font-heading font-bold text-2xl text-[var(--brand-dark)] hidden sm:block">
              Rangaroo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={`hover:text-[var(--brand-orange)] transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md px-1 ${
                  pathname === link.path ? 'text-[var(--brand-orange)]' : 'text-gray-700'
                }`}
              >
                {link.name}
                {pathname === link.path && (
                  <motion.div
                    layoutId="underline"
                    className="absolute -bottom-1 left-0 w-full h-0.5 bg-[var(--brand-orange)] rounded-full"
                  />
                )}
              </Link>
            ))}

            {/* Bulk / Return Gifts Inquiry CTA */}
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="hover:text-purple-800 transition-all flex items-center gap-1.5 text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 rounded-full text-xs border border-purple-200 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5 text-purple-600" /> Bulk Gifts
            </button>

            {/* Collections Dropdown */}
            <div 
              className="relative group cursor-pointer"
              onMouseEnter={() => setIsCollectionsOpen(true)}
              onMouseLeave={() => setIsCollectionsOpen(false)}
            >
              <div className="flex items-center gap-1 text-gray-700 hover:text-[var(--brand-orange)] transition-colors">
                Collections <ChevronDown size={16} />
              </div>
              <AnimatePresence>
                {isCollectionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-52 dropdown-panel py-2 shadow-2xl z-50 overflow-hidden"
                  >
                    <Link href="/collections/animal-collection" className="block px-4 py-2.5 hover:bg-orange-50 text-gray-800 font-medium text-sm transition-colors">Animals</Link>
                    <Link href="/collections/space-collection" className="block px-4 py-2.5 hover:bg-orange-50 text-gray-800 font-medium text-sm transition-colors">Space</Link>
                    <Link href="/collections/dinosaur-collection" className="block px-4 py-2.5 hover:bg-orange-50 text-gray-800 font-medium text-sm transition-colors">Dinosaurs</Link>
                    <Link href="/collections" className="block px-4 py-2.5 mt-1 border-t border-gray-100 font-bold hover:bg-orange-50 text-[var(--brand-orange)] text-sm transition-colors">View All &rarr;</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* User & Cart Area */}
          <div className="flex items-center gap-4 sm:gap-6 z-50">
            {mounted && user ? (
              <div className="group relative">
                <div className="flex items-center gap-2 cursor-pointer p-2 rounded-full hover:bg-white/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--brand-orange)] to-[var(--brand-amber)] flex items-center justify-center text-white font-bold text-sm">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:block font-medium text-sm text-gray-700">{user.fullName?.split(' ')[0]}</span>
                </div>
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-52 dropdown-panel py-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                  <Link href="/profile" className="block px-4 py-2.5 hover:bg-orange-50 text-gray-900 font-semibold text-sm transition-colors">My Profile</Link>
                  <Link href="/profile?tab=wishlist" className="block px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-semibold text-sm flex items-center justify-between transition-colors">
                    <span>My Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/orders" className="block px-4 py-2.5 hover:bg-orange-50 text-gray-900 font-semibold text-sm transition-colors">My Orders</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="block px-4 py-2.5 hover:bg-purple-50 text-purple-700 font-semibold text-sm transition-colors">Admin Dashboard</Link>
                  )}
                  <div className="my-1 border-t border-gray-100" />
                  <button onClick={signOut} className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 font-semibold text-sm transition-colors cursor-pointer">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="hidden sm:flex items-center gap-2 btn-secondary py-1.5 px-4 text-sm"
              >
                <User size={16} /> Login
              </button>
            )}

            {/* Search Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search products"
              className="p-2 rounded-full hover:bg-white/50 transition-colors text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <Search size={22} />
            </motion.button>

            {/* Wishlist Button */}
            {mounted && user ? (
              <Link
                href="/profile?tab=wishlist"
                className="relative p-2 rounded-full hover:bg-white/50 transition-colors text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span className="sr-only">Wishlist</span>
                <Heart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="relative p-2 rounded-full hover:bg-white/50 transition-colors text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span className="sr-only">Login to view wishlist</span>
                <Heart size={22} />
              </button>
            )}

            {/* Cart Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCart}
              aria-label="Shopping Cart"
              className="relative p-2 rounded-full hover:bg-white/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <ShoppingBag size={22} className="text-gray-800" />
              <AnimatePresence>
                {mounted && cartItemCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-[var(--brand-orange)] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md"
                  >
                    {cartItemCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-white/50 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} className="text-gray-800" /> : <Menu size={24} className="text-gray-800" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed inset-0 top-0 pt-24 bg-white/95 backdrop-blur-xl z-20 md:hidden overflow-hidden"
          >
            <div className="flex flex-col items-center gap-6 p-8 text-xl font-heading font-semibold text-gray-800">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className="w-full text-center py-3 border-b border-gray-100 hover:text-[var(--brand-orange)]"
                >
                  {link.name}
                </Link>
              ))}
              {!user && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="mt-6 w-full btn-primary justify-center"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instant Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-20 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-gray-100 relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-grow bg-gray-50 px-4 py-3 rounded-2xl border border-gray-200 focus-within:border-orange-500 transition-colors">
                  <button onClick={() => {
                      if (searchQuery.trim()) {
                        setIsSearchOpen(false);
                        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                      }
                    }}
                    className="focus:outline-none"
                  >
                    <Search className="w-5 h-5 text-gray-400 shrink-0 hover:text-orange-500 transition-colors" />
                  </button>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search DIY paint kits, dinosaurs, vehicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        setIsSearchOpen(false);
                        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                      }
                    }}
                    className="bg-transparent border-none outline-none text-sm w-full text-gray-900 font-medium placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Clear</button>
                  )}
                </div>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Instant Search Results */}
              <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3">
                {searchQuery.trim().length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-60" />
                    Type to search through all premium DIY craft kits...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-orange-50/70 border border-transparent hover:border-orange-100 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-100 relative overflow-hidden flex-shrink-0">
                        <Image src={product.images?.[0] || '/logo.png'} alt={product.name} fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-orange-600 transition-colors">{product.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{product.description}</p>
                      </div>
                      <span className="font-extrabold text-sm text-orange-600 shrink-0">₹{product.price}</span>
                    </Link>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    No craft kits found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Inquiry Modal */}
      <BulkInquiryModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />
    </>
  );
}
