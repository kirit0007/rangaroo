'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Settings, 
  ShoppingBag, 
  Ticket, 
  ClipboardList, 
  Users, 
  Star, 
  Lock 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function AdminSidebar() {
  const pathname = usePathname();
  const signOut = useAuthStore((state) => state.signOut);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Site CMS', href: '/admin/cms', icon: Settings },
    { name: 'Products Catalog', href: '/admin/products', icon: ShoppingBag },
    { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
    { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Reviews', href: '/admin/reviews', icon: Star },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 bg-gray-900 text-white md:min-h-screen flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold font-outfit text-white tracking-wide">
          Rangaroo<span className="text-orange-500">Admin</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">Management Portal</p>
      </div>

      <nav className="flex-1 px-4 py-4 md:space-y-2 flex overflow-x-auto md:flex-col md:overflow-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/admin' 
            ? pathname === '/admin' 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${
                isActive 
                  ? 'bg-orange-500 text-white font-semibold shadow-md' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 mt-auto">
        <button
          onClick={() => {
            signOut();
            toast.success('Admin session locked');
          }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-900/40 hover:bg-red-800 text-red-200 rounded-xl text-xs font-bold transition-colors border border-red-800/50 cursor-pointer"
        >
          <Lock size={14} />
          <span>Lock & Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
