'use client';

import { useState } from 'react';
import { 
  ClipboardList, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Gift,
  Truck,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';

export default function OrdersAdminPage() {
  const orders = useAdminStore((state) => state.orders);
  const updateOrderStatus = useAdminStore((state) => state.updateOrderStatus);
  const updateOrderTracking = useAdminStore((state) => state.updateOrderTracking);

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trackingData, setTrackingData] = useState<Record<string, { trackingNumber: string, courierName: string }>>({});

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const filteredOrders = orders.filter((order: any) => {
    const searchLower = orderSearch.toLowerCase();
    const matchesSearch = 
      (order.orderNumber || order.id).toLowerCase().includes(searchLower) ||
      (order.shippingAddress?.fullName || '').toLowerCase().includes(searchLower) ||
      (order.shippingAddress?.email || order.customerEmail || '').toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
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
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status || 'pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.shippingAddress?.fullName || 'Customer'} • {order.customerEmail || order.shippingAddress?.email || 'N/A'} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
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
                      value={order.status || 'pending'}
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
                      
                      {/* Tracking / Fulfillment Edit Box */}
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3 mb-4">
                        <div className="flex items-center gap-2 font-bold text-blue-800">
                          <Truck size={18} />
                          Fulfillment & Tracking
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            placeholder="Courier Name (e.g. Bluedart)"
                            className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={trackingData[order.id]?.courierName ?? (order.courierName || '')}
                            onChange={(e) => setTrackingData(prev => ({
                              ...prev, [order.id]: { trackingNumber: prev[order.id]?.trackingNumber ?? order.trackingNumber ?? '', courierName: e.target.value }
                            }))}
                          />
                          <input
                            type="text"
                            placeholder="Tracking AWB Number"
                            className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={trackingData[order.id]?.trackingNumber ?? (order.trackingNumber || '')}
                            onChange={(e) => setTrackingData(prev => ({
                              ...prev, [order.id]: { courierName: prev[order.id]?.courierName ?? order.courierName ?? '', trackingNumber: e.target.value }
                            }))}
                          />
                          <button
                            onClick={async () => {
                              const data = trackingData[order.id] || { trackingNumber: order.trackingNumber, courierName: order.courierName };
                              await updateOrderTracking(order.id, order.status, data.trackingNumber || '', data.courierName || '');
                              toast.success('Tracking information saved');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                          >
                            <Save size={16} /> Save
                          </button>
                        </div>
                      </div>

                      {/* Gift Wrap Banner */}
                      {((order.giftWrapFee && order.giftWrapFee > 0) || order.shippingAddress?.isGiftWrapped) && (
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-4">
                          <div className="flex items-center gap-2 font-bold text-orange-700 mb-2">
                            <Gift size={18} />
                            Gift Wrap Requested (+₹{order.giftWrapFee || 30})
                          </div>
                          {order.shippingAddress?.giftMessage && (
                            <div className="text-sm text-gray-700 bg-white p-3 rounded-xl border border-orange-100/50 italic shadow-sm">
                              "{order.shippingAddress.giftMessage}"
                            </div>
                          )}
                        </div>
                      )}

                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Order Items</h4>
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 space-y-3">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm border-b last:border-b-0 pb-3 last:pb-0 border-gray-100">
                            <div className="flex items-center space-x-3">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                              )}
                              <div>
                                <p className="font-bold text-gray-800">{item.productName || item.name || item.product?.name}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{Number(item.unitPrice || item.price || 0)}</p>
                              </div>
                            </div>
                            <p className="font-bold text-gray-900">₹{Number(item.quantity) * Number(item.unitPrice || item.price || 0)}</p>
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
                          <span>₹{order.subtotal || order.total - (order.shippingFee || 0) - (order.giftWrapFee || 0) + (order.discountAmount || 0)}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-600">
                          <span>Shipping Fee</span>
                          <span>{order.shippingFee ? `₹${order.shippingFee}` : 'FREE'}</span>
                        </div>

                        {((order.giftWrapFee && order.giftWrapFee > 0) || order.shippingAddress?.isGiftWrapped) && (
                          <div className="flex justify-between text-gray-600">
                            <span>Gift Wrap Fee</span>
                            <span>₹{order.giftWrapFee || 30}</span>
                          </div>
                        )}

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
