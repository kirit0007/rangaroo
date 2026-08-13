'use client';

import { useEffect } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  // Fetch initial state once for all admin subroutes
  useEffect(() => {
    if (user?.role === 'admin') {
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
        .catch((err) => console.error('Error fetching system products:', err));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-100 shadow-xl text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 font-outfit">Admin Panel Access</h1>
          <p className="text-gray-600 text-sm mb-6">
            Access to this administrative area requires an authenticated Supabase account with assigned Admin privileges.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            Sign In with Supabase
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-100 shadow-xl text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 font-outfit">Access Denied</h1>
          <p className="text-gray-700 text-sm mb-1 font-medium">
            Logged in as <span className="font-bold text-gray-900">{user.email}</span>
          </p>
          <p className="text-xs text-red-600 font-medium mb-6">
            This account does not have Admin privileges in Supabase.
          </p>
          <button
            onClick={() => useAuthStore.getState().signOut()}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Sign Out & Switch Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-body">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gray-50/50">
        {children}
      </main>
    </div>
  );
}
