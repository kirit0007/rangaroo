'use client';

import Link from 'next/link';
import { 
  Package, 
  CreditCard, 
  ShoppingBag, 
  Ticket, 
  CheckCircle2, 
  AlertCircle, 
  Edit2 
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { products as initialProducts } from '@/data/products';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
  const coupons = useAdminStore((state) => state.coupons);
  const orders = useAdminStore((state) => state.orders);
  const storeProducts = useAdminStore((state) => state.products) || initialProducts;

  // Stats Calculations
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  // Revenue Chart Data (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  
  const chartData = last7Days.map(date => {
    const dayOrders = orders.filter(o => o.createdAt?.startsWith(date));
    const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      revenue
    };
  });

  // Low Stock Products (< 5 items)
  const lowStockProducts = storeProducts.filter(p => p.stockQuantity < 5).slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-outfit text-gray-800">Overview</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Products</p>
            <p className="text-3xl font-bold text-gray-800">{storeProducts.length}</p>
          </div>
          <div className="p-4 bg-orange-100 rounded-2xl text-orange-600">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-800">₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-green-100 rounded-2xl text-green-600">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
          </div>
          <div className="p-4 bg-blue-100 rounded-2xl text-blue-600">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Coupons</p>
            <p className="text-3xl font-bold text-gray-800">{coupons.length}</p>
          </div>
          <div className="p-4 bg-orange-100 rounded-2xl text-orange-600">
            <Ticket size={24} />
          </div>
        </div>
      </div>

      {/* Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 font-outfit">Revenue (Last 7 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `₹${value}`} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 font-outfit flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            Low Stock Alerts
          </h3>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-4">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <img src={product.images?.[0] || '/logo.png'} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                      <p className="text-xs text-red-600 font-medium">{product.stockQuantity} remaining</p>
                    </div>
                  </div>
                  <Link href="/admin/products" className="text-gray-400 hover:text-orange-500 transition-colors p-1 bg-white rounded-md shadow-sm border border-gray-100">
                    <Edit2 size={14} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <CheckCircle2 size={32} className="mb-2 text-green-400" />
              <p className="text-sm">All products are well stocked!</p>
            </div>
          )}
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 font-outfit">Recent Orders</h3>
            <Link href="/admin/orders" className="text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-xl">Order ID</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 5).map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 font-mono font-medium text-gray-900">{order.orderNumber || order.id}</td>
                    <td className="px-4 py-4 text-gray-600">{order.shippingAddress?.fullName || 'Guest'}</td>
                    <td className="px-4 py-4 text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-4 font-bold text-gray-900">₹{order.total}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {(order.paymentStatus || 'pending').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No orders placed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
