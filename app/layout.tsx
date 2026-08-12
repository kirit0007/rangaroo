import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ClientModals } from '@/components/shared/ClientModals';

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
  metadataBase: new URL('https://www.rangaroo.store'),
  title: {
    default: 'Rangaroo | DIY Paint Kits for Kids - Non-Toxic & Screen-Free Fun',
    template: '%s',
  },
  description: 'Premium DIY Paint Kits for Kids. Where Little Hands Create Big Smiles. Safe, non-toxic, and endlessly fun plaster figurines delivered across India.',
  authors: [{ name: 'Rangaroo' }],
  creator: 'Rangaroo',
  publisher: 'Rangaroo',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Rangaroo',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Rangaroo DIY Paint Kits',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Rangaroo',
    url: 'https://www.rangaroo.store',
    logo: 'https://www.rangaroo.store/logo.png',
    sameAs: ['https://wa.me/918793687379'],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-8793687379',
      contactType: 'customer support',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${outfit.variable} ${plusJakarta.variable} antialiased bg-[var(--brand-cream)] text-gray-900 font-body overflow-x-hidden min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-grow">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <Footer />
        <ClientModals />
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
