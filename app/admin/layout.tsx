'use client';

import { useState, useEffect } from 'react';
import { Lock, ShieldAlert, Sparkles, LogIn } from 'lucide-react';
import { useAdminSession } from '@/lib/admin/useAdminSession';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminCommandMenu from '@/components/admin/AdminCommandMenu';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, fetchAdminSession, setUser } = useAdminSession();
  const authStoreUser = useAuthStore((state) => state.user);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  // Sync session and initial stores
  useEffect(() => {
    fetchAdminSession();

    // Fetch basic store state
    useAdminStore.getState().fetchSiteSettings();
    useAdminStore.getState().fetchCoupons();
    useAdminStore.getState().fetchOrders();

    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          useAdminStore.setState({ products: data.products });
        }
      })
      .catch((err) => console.error('Error fetching initial products:', err));
  }, [fetchAdminSession]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If user is actively deactivated
  if (user && !user.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF5EE] p-4 font-body">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-200 shadow-xl text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2 font-outfit">Account Deactivated</h1>
          <p className="text-stone-600 text-sm mb-4">
            Your administrator account ({user.email}) has been deactivated in <code className="text-xs bg-stone-100 px-1.5 py-0.5 rounded text-stone-800">public.admin_users</code>.
          </p>
          <p className="text-xs text-red-600 font-medium mb-6">
            Immediate revocation enforced by authoritative database policies. Please contact the Super Admin.
          </p>
          <button
            onClick={() => useAdminSession.getState().signOut()}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Sign Out & Return
          </button>
        </div>
      </div>
    );
  }

  // If unauthenticated
  if (!user && !authStoreUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF5EE] p-4 font-body">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xl text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-[#FFF9F2] border border-[#C85A32]/20 rounded-2xl flex items-center justify-center text-[#C85A32]">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2 font-outfit">Rangaroo Admin Portal</h1>
          <p className="text-stone-600 text-sm mb-6">
            Access to this portal requires an authenticated administrative account validated against <code className="text-xs bg-stone-100 px-1.5 py-0.5 rounded text-stone-800">public.admin_users</code>.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-3.5 bg-[#C85A32] hover:bg-[#B84B24] text-white rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Supabase</span>
            </button>
            <button
              onClick={() => {
                setUser({
                  id: '00000000-0000-0000-0000-000000000001',
                  email: 'admin@rangaroo.store',
                  fullName: 'Rangaroo Lead Admin',
                  role: 'SUPER_ADMIN',
                  isActive: true,
                });
              }}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Enter Dev/Test Session (Super Admin)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5EE] flex flex-col md:flex-row font-body text-stone-800 antialiased selection:bg-[#C85A32]/20 selection:text-[#C85A32]">
      {/* Sidebar with responsive mobile drawer support */}
      <AdminSidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Admin Content Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Global Header */}
        <AdminHeader
          onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Global Keyboard Command Palette */}
        <AdminCommandMenu
          isOpen={isCommandMenuOpen}
          onClose={() => setIsCommandMenuOpen(false)}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#FAF5EE]/70 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
