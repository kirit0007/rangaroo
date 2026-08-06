'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useAdminStore } from '@/store/adminStore';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Zustand stores
  const { user, openAuthModal, signOut } = useAuthStore((state: any) => ({
    user: state.user,
    openAuthModal: state.openAuthModal,
    signOut: state.signOut || state.logout,
  }));
  const { items, openCart } = useCartStore((state: any) => ({
    items: state.items || [],
    openCart: state.openCart,
  }));
  const siteSettings = useAdminStore((state: any) => state.siteSettings) || { announcementText: '🎉 Free shipping on all orders over ₹999! 🎉' };

  const cartItemCount = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);

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
        <div className="bg-gradient-to-r from-[var(--brand-orange)] to-[var(--brand-amber)] text-white text-center py-2 text-sm font-semibold tracking-wide">
          {siteSettings.announcementText}
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
          <Link href="/" className="flex items-center gap-2 z-50">
            <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Image 
                src="/logo.png" 
                alt="Rangaroo Logo" 
                width={40} 
                height={40} 
                className="w-10 h-10 object-contain"
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
                className={`hover:text-[var(--brand-orange)] transition-colors relative ${
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
                    className="absolute top-full left-0 mt-2 w-48 glass-panel py-2 shadow-xl z-50"
                  >
                    <Link href="/products?collection=animals" className="block px-4 py-2 hover:bg-white/50 hover:text-[var(--brand-orange)] transition-colors">Animals</Link>
                    <Link href="/products?collection=space" className="block px-4 py-2 hover:bg-white/50 hover:text-[var(--brand-orange)] transition-colors">Space</Link>
                    <Link href="/products?collection=nature" className="block px-4 py-2 hover:bg-white/50 hover:text-[var(--brand-orange)] transition-colors">Nature</Link>
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
                    {(user.fullName || user.name) ? (user.fullName || user.name).charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:block font-medium text-sm text-gray-700">{(user.fullName || user.name)?.split(' ')[0]}</span>
                </div>
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 glass-panel py-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link href="/profile" className="block px-4 py-2 hover:bg-white/50 text-gray-700">My Profile</Link>
                  <Link href="/orders" className="block px-4 py-2 hover:bg-white/50 text-gray-700">My Orders</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="block px-4 py-2 hover:bg-white/50 text-[var(--brand-purple)] font-medium">Admin Dashboard</Link>
                  )}
                  <button onClick={signOut} className="w-full text-left px-4 py-2 hover:bg-white/50 text-red-500">
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

            {/* Cart Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCart}
              className="relative p-2 rounded-full hover:bg-white/50 transition-colors"
            >
              <ShoppingBag size={24} className="text-gray-800" />
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
    </>
  );
}
