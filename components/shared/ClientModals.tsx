'use client';

import dynamic from 'next/dynamic';

const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), { ssr: false });
const AuthModal = dynamic(() => import('@/components/auth/AuthModal'), { ssr: false });
const WhatsAppButton = dynamic(() => import('@/components/shared/WhatsAppButton'), { ssr: false });

export function ClientModals() {
  return (
    <>
      <CartDrawer />
      <AuthModal />
      <WhatsAppButton />
    </>
  );
}
