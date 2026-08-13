'use client';

import { useState } from 'react';
import { Users, Search, ShoppingBag } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';

export default function CustomersAdminPage() {
  const orders = useAdminStore((state) => state.orders);
  const [searchQuery, setSearchQuery] = useState('');

  // Aggregate Customer Profiles from orders table dynamically
  const customerProfilesMap = orders.reduce((acc: Record<string, any>, order: any) => {
    const email = (order.shippingAddress?.email || order.customerEmail || order.userId || 'guest@rangaroo.store').toLowerCase();
    
    if (!acc[email]) {
      acc[email] = {
        email,
        name: order.shippingAddress?.fullName || 'Guest Customer',
        phone: order.shippingAddress?.phone || 'N/A',
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: order.createdAt,
        addresses: new Set<string>(),
      };
    }

    acc[email].totalOrders += 1;
    acc[email].totalSpent += order.total;
    if (new Date(order.createdAt) > new Date(acc[email].lastOrderDate)) {
      acc[email].lastOrderDate = order.createdAt;
    }
    if (order.shippingAddress?.city) {
      acc[email].addresses.add(`${order.shippingAddress.city}, ${order.shippingAddress.state || ''}`);
    }

    return acc;
  }, {});

  const customersList = Object.values(customerProfilesMap).filter((customer: any) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-gray-800">Customers CRM</h1>
          <p className="text-sm text-gray-500">Track customer profiles, lifetime spending, and order history.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="text-xs text-gray-500 font-semibold">
          Showing {customersList.length} unique customer profiles
        </div>
      </div>

      {/* Customer Profiles Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Total Orders</th>
                <th className="px-6 py-4">Lifetime Spent</th>
                <th className="px-6 py-4">Last Order</th>
                <th className="px-6 py-4">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customersList.map((customer: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{customer.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs font-medium">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100">
                      {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₹{customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {Array.from(customer.addresses).join(', ') || 'Online'}
                  </td>
                </tr>
              ))}

              {customersList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Users size={36} className="mx-auto mb-2 opacity-50" />
                    <p>No customer profiles found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
