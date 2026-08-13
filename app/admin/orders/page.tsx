'use client';

import { useState } from 'react';
import { 
  ClipboardList, 
  ChevronDown, 
  ChevronUp, 
  Search 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';

export default function OrdersAdminPage() {
  const orders = useAdminStore((state) => state.orders);
  const updateOrderStatus = useAdminStore((state) => state.updateOrderStatus);

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const filteredOrders = orders.filter((order: any) => {
    const searchLower = orderSearch.toLowerCase();
    const matchesSearch = 
      (order.orderNumber || order.id).toLowerCase().includes(searchLower) ||
      (order.shippingAddress?.fullName || '').toLowerCase().includes(searchLower) ||
      (order.shippingAddress?.email || order.customerEmail || '').toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-gray-800">Orders Management</h1>
          <p className="text-sm text-gray-500">View customer orders, status updates, and financial breakdown.</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Order #, Customer name, or Email..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span className="text-xs text-gray-500 font-semibold uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order: any) => {
          const isExpanded = expandedOrders[order.id];

          return (
            <div key={order.id} className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden transition-all">
              
              {/* Order Header Summary Row */}
              <div 
                onClick={() => toggleOrderExpansion(order.id)}
                className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shrink-0">
                    <ClipboardList size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-900 text-base sm:text-lg">
                        {order.orderNumber || `#${order.id.slice(0, 8)}`}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.orderStatus === 'processing' ? 'bg-purple-100 text-purple-700' :
                        order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.shippingAddress?.fullName || 'Customer'} • {order.shippingAddress?.email || order.customerEmail || 'N/A'} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-gray-400 font-semibold uppercase">Total</div>
                    <div className="font-bold text-gray-900 text-lg">₹{order.total}</div>
                  </div>

                  <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => {
                        updateOrderStatus(order.id, e.target.value as any);
                        toast.success(`Order ${order.orderNumber || order.id} status updated to ${e.target.value}`);
                      }}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button 
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Expanded Details */}
              {isExpanded && (
                <div className="p-6 bg-gray-50/70 border-t border-gray-100 space-y-6">
                  
                  {/* Grid Layout: Items & Financial Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Order Items</h4>
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 space-y-3">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm border-b last:border-b-0 pb-3 last:pb-0 border-gray-100">
                            <div className="flex items-center space-x-3">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                              )}
                              <div>
                                <p className="font-bold text-gray-800">{item.name || item.product?.name}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                              </div>
                            </div>
                            <p className="font-bold text-gray-900">₹{item.quantity * item.price}</p>
                          </div>
                        ))}
                      </div>

                      {/* Shipping Address */}
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-4 mb-2">Shipping Information</h4>
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 text-sm text-gray-700 space-y-1">
                        <p className="font-bold text-gray-900">{order.shippingAddress?.fullName}</p>
                        <p>{order.shippingAddress?.streetAddress || order.shippingAddress?.address}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode || order.shippingAddress?.pincode}</p>
                        <p className="text-xs text-gray-500 pt-1">Phone: {order.shippingAddress?.phone}</p>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Financial Breakdown</h4>
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-3 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>₹{order.subtotal || order.total - (order.shippingFee || 0)}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-600">
                          <span>Shipping Fee</span>
                          <span>{order.shippingFee ? `₹${order.shippingFee}` : 'FREE'}</span>
                        </div>

                        {order.discountAmount > 0 && (
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Discount ({order.couponCode || 'Promo'})</span>
                            <span>-₹{order.discountAmount}</span>
                          </div>
                        )}

                        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base text-gray-900">
                          <span>Grand Total</span>
                          <span className="text-orange-600">₹{order.total}</span>
                        </div>

                        <div className="pt-3 border-t border-gray-100 space-y-1">
                          <div className="text-xs text-gray-500 flex justify-between">
                            <span>Payment Method:</span>
                            <span className="font-semibold text-gray-700 uppercase">{order.paymentMethod || 'Razorpay / Online'}</span>
                          </div>
                          <div className="text-xs text-gray-500 flex justify-between">
                            <span>Payment Status:</span>
                            <span className={`font-bold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {(order.paymentStatus || 'pending').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-gray-400">
            <ClipboardList size={36} className="mx-auto mb-2 opacity-50" />
            <p>No orders found matching your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
