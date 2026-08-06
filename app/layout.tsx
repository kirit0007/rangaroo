import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import AuthModal from '@/components/auth/AuthModal';
import WhatsAppButton from '@/components/shared/WhatsAppButton';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Rangaroo | Paint. Create. Imagine.',
  description: 'Premium DIY Paint Kits for Kids. Where Little Hands Create Big Smiles. Safe, non-toxic, and endlessly fun!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${plusJakarta.variable} antialiased bg-[var(--brand-cream)] text-gray-900 font-body overflow-x-hidden min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <CartDrawer />
        <AuthModal />
        <WhatsAppButton />
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
