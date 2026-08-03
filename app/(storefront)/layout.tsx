import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import CartDrawer from '@/components/cart/CartDrawer';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
    </>
  );
}
