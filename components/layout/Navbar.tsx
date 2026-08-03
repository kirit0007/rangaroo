'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items, toggleCart } = useCartStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="navbar-container">
      <div className="announcement-bar">
        🎨 FREE Shipping on orders above ₹499! | Use code FIRST10 for 10% off your first order!
      </div>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link href="/" className="logo">
            Rangaroo 🦘
          </Link>
          
          <div className="desktop-links">
            <Link href="/shop" className="nav-link">Shop All</Link>
            <div className="dropdown nav-link">
              Collections
              <div className="dropdown-content">
                <Link href="/collections/dinosaur">Dinosaur</Link>
                <Link href="/collections/space">Space</Link>
                <Link href="/collections/vehicle">Vehicle</Link>
                <Link href="/collections/princess">Princess</Link>
              </div>
            </div>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
          </div>

          <div className="nav-actions">
            <button className="cart-button" onClick={toggleCart}>
              🛒
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
            <button className="hamburger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              ☰
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="mobile-nav">
          <Link href="/shop" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Shop All</Link>
          <Link href="/collections" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Collections</Link>
          <Link href="/about" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
        </div>
      )}
    </header>
  );
}
