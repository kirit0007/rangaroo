import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });

export const metadata: Metadata = {
  title: 'Rangaroo – Where Creativity Comes to Life! 🦘🎨',
  description: 'Rangaroo offers fun and creative DIY paint kits for kids. Shop from our Dinosaur, Space, Princess collections and more!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.variable}`}>
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
