'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, ShoppingBag, Users, DollarSign, Package, 
  Tag, MessageSquare, AlertTriangle, ArrowUpRight, CheckCircle2, 
  Clock, Plus, Download, Search, ChevronRight 
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'leads'>('overview');

  const stats = [
    { title: 'Total Revenue', value: '₹1,48,900', change: '+24% this month', icon: DollarSign, color: 'from-orange-500 to-amber-500' },
    { title: 'Total Orders', value: '432 Orders', change: '+18% this month', icon: ShoppingBag, color: 'from-purple-600 to-pink-500' },
    { title: 'Store Conversion', value: '4.2%', change: '+0.8% benchmark', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
    { title: 'Bulk Party Leads', value: '12 Inquiries', change: '8 pending quotes', icon: Users, color: 'from-blue-500 to-indigo-600' },
  ];

  const recentOrders = [
    { id: 'RNG-20260803-089', customer: 'Ananya Sharma', items: 'Signature Collection Kit × 2', total: '₹998', status: 'PAID', date: 'Today, 8:45 PM' },
    { id: 'RNG-20260803-088', customer: 'Rahul Verma', items: 'Mini Kit Bulk (25 Kids Pack)', total: '₹3,165', status: 'DISPATCHED', date: 'Today, 6:30 PM' },
    { id: 'RNG-20260803-087', customer: 'Priya Mehta', items: 'Dinosaur DIY Kit + Space Kit', total: '₹598', status: 'PAID', date: 'Today, 4:15 PM' },
    { id: 'RNG-20260803-086', customer: 'Deepak Joshi', items: 'DIY Ganesha Special Kit', total: '₹299', status: 'DELIVERED', date: 'Yesterday' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body">
      
      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-xl font-bold text-white shadow-fun">
              🦘
            </div>
            <span className="font-heading text-xl text-white tracking-wide">RANGAROO ADMIN</span>
          </Link>
          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
            ● Live 2026 Platform
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
            View Live Storefront ↗
          </Link>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-orange-400 border border-slate-700">
            AD
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 mb-8 pb-3">
          {[
            { id: 'overview', label: 'Dashboard Overview' },
            { id: 'orders', label: 'Orders & Shipments' },
            { id: 'products', label: 'Inventory & Kits' },
            { id: 'leads', label: 'Bulk Birthday Leads' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white shadow-fun' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Executive Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((s, idx) => (
            <div key={idx} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.title}</span>
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${s.color} text-white flex items-center justify-center shadow-md`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="font-heading text-3xl text-white font-extrabold">{s.value}</div>
              <div className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{s.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Recent Orders Table */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-xl text-white">Recent Customer Orders</h3>
                <p className="text-xs text-slate-400 font-medium">Real-time Razorpay payments & order status</p>
              </div>
              <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 font-mono font-bold text-orange-400">{ord.id}</td>
                      <td className="py-4 font-bold text-white">{ord.customer}</td>
                      <td className="py-4">{ord.items}</td>
                      <td className="py-4 font-bold text-white">{ord.total}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          ord.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          ord.status === 'DISPATCHED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="space-y-6">
            
            {/* Quick Actions Card */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-heading text-lg text-white">Store Quick Actions</h3>
              
              <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-heading text-sm py-3 rounded-2xl shadow-fun flex items-center justify-center gap-2 transition-all">
                <Plus className="w-4 h-4" />
                <span>Add New DIY Paint Kit</span>
              </button>

              <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                <Tag className="w-4 h-4 text-yellow-400" />
                <span>Create Festival Coupon Code</span>
              </button>

              <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Send WhatsApp Order Broadcast</span>
              </button>
            </div>

            {/* Low Inventory Alert Card */}
            <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 rounded-3xl p-6 border border-amber-800/50 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Inventory Alert</span>
              </div>
              <h4 className="font-heading text-base text-white">DIY Ganesha Festival Kit</h4>
              <p className="text-xs text-slate-400 font-medium">Only 14 units remaining in stock. Restock recommended before Ganesh Chaturthi rush.</p>
              <button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-colors">
                Update Stock Quantity
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
