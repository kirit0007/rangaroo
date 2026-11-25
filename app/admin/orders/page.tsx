'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Truck,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Gift,
  ExternalLink,
  Save,
  X,
  ShieldAlert,
  ArrowRight,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';
import { useAdminSession } from '@/lib/admin/useAdminSession';
import { Order, OrderStatus } from '@/types';

export default function OrdersAdminPage() {
  const orders = useAdminStore((state) => state.orders);
  const updateOrderStatus = useAdminStore((state) => state.updateOrderStatus);
  const updateOrderTracking = useAdminStore((state) => state.updateOrderTracking);
  const { user, effectiveRole, hasPermission } = useAdminSession();

  const canRefund = hasPermission('orders.refund');
  const canCancel = hasPermission('orders.cancel');
  const canFulfill = hasPermission('orders.fulfill');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fulfillment Dialog
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [courierName, setCourierName] = useState('Delhivery Express');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Refund Dialog
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Customer Return / Cancellation');

  // Cancel Dialog
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer Requested');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = search.toLowerCase().trim();
      const orderNum = (order.orderNumber || order.id).toLowerCase();
      const customer = (order.shippingAddress?.fullName || '').toLowerCase();
      const email = (order.customerEmail || order.shippingAddress?.email || '').toLowerCase();

      const matchesSearch = !q || orderNum.includes(q) || customer.includes(q) || email.includes(q);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleOpenCourier = (order: Order) => {
    if (!canFulfill) {
      toast.error(`Permission Denied: ${effectiveRole()} cannot fulfill orders.`);
      return;
    }
    setSelectedOrder(order);
    setCourierName(order.courierName || 'Delhivery Express');
    setTrackingNumber(order.trackingNumber || `AWB-${Date.now().toString().slice(-8)}`);
    setIsCourierModalOpen(true);
  };

  const handleSaveCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!trackingNumber.trim()) {
      toast.error('Tracking / AWB Number is required');
      return;
    }

    await updateOrderTracking(selectedOrder.id, 'shipped', trackingNumber, courierName);
    toast.success(`Order ${selectedOrder.orderNumber} marked Shipped via ${courierName}`);
    setIsCourierModalOpen(false);
    setSelectedOrder(null);
  };

  const handleOpenRefund = (order: Order) => {
    if (!canRefund) {
      toast.error(`Access Denied: Role ${effectiveRole()} lacks orders.refund permission.`);
      return;
    }
    setSelectedOrder(order);
    setRefundAmount(order.total);
    setRefundReason('Customer Satisfaction / Return');
    setIsRefundModalOpen(true);
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (refundAmount <= 0 || refundAmount > selectedOrder.total) {
      toast.error(`Refund amount must be between ₹1 and ₹${selectedOrder.total}`);
      return;
    }

    const isFull = refundAmount === selectedOrder.total;
    const newStatus: OrderStatus = isFull ? 'refunded' : selectedOrder.status;

    await updateOrderStatus(selectedOrder.id, newStatus);
    toast.success(`Processed ₹${refundAmount} refund via Razorpay`);
    setIsRefundModalOpen(false);
    setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus, paymentStatus: 'refunded' } : null));
  };

  const handleOpenCancel = (order: Order) => {
    if (!canCancel) {
      toast.error(`Access Denied: Role ${effectiveRole()} cannot cancel orders.`);
      return;
    }
    setSelectedOrder(order);
    setCancelReason('Customer Cancellation');
    setIsCancelModalOpen(true);
  };

  const handleProcessCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    await updateOrderStatus(selectedOrder.id, 'cancelled');
    toast.success(`Order ${selectedOrder.orderNumber} cancelled and inventory hold released.`);
    setIsCancelModalOpen(false);
    setSelectedOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Orders & Fulfillment
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track customer orders, manage courier dispatches, assign AWB numbers, and issue refunds.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 shadow-2xs">
            {orders.length} Total Orders
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order number, customer name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-stone-500 font-semibold uppercase font-outfit">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#FAF5EE] text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Placed At</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Fulfillment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => {
                const isPaid = order.paymentStatus === 'paid';
                const isRefunded = order.paymentStatus === 'refunded' || order.status === 'refunded';

                return (
                  <tr key={order.id} className="hover:bg-[#FAF5EE]/40 transition-colors">
                    {/* Order ID & Inventory Conflict Badge if any */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-stone-900 text-sm">
                        {order.orderNumber || order.id.slice(0, 8)}
                      </div>
                      {order.cancelRequested && (
                        <span className="inline-flex items-center text-[10px] text-red-600 font-semibold mt-0.5">
                          <BadgeAlert className="w-3 h-3 mr-0.5" /> Cancel Requested
                        </span>
                      )}
                    </td>

                    {/* Customer Info */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-stone-900">
                        {order.shippingAddress?.fullName || 'Customer'}
                      </div>
                      <div className="text-[11px] text-stone-400 truncate max-w-xs">
                        {order.customerEmail || order.shippingAddress?.email || 'guest@rangaroo.store'}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-stone-500 whitespace-nowrap" suppressHydrationWarning>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                    </td>

                    {/* Items Count */}
                    <td className="px-4 py-3.5 text-stone-700">
                      <span className="font-semibold">{order.items?.length || 1}</span> item(s)
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold font-outfit text-stone-900 text-sm">
                        ₹{order.total}
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          -₹{order.discountAmount} promo
                        </div>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isRefunded
                            ? 'bg-purple-100 text-purple-800'
                            : isPaid
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {order.paymentStatus || 'pending'}
                      </span>
                    </td>

                    {/* Fulfillment Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.status === 'shipped'
                            ? 'bg-blue-50 text-blue-700'
                            : order.status === 'cancelled'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {order.status || 'pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#FFF9F2] text-[#C85A32] border border-[#C85A32]/30 rounded-lg hover:bg-[#FAF5EE] transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleOpenCourier(order)}
                          disabled={order.status === 'delivered' || order.status === 'cancelled'}
                          className="p-1.5 text-stone-600 hover:text-[#C85A32] hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-30"
                          title="Assign Courier & AWB"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No orders matching criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF9F2] border border-[#C85A32]/20 text-[#C85A32] flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-stone-900 text-lg">
                    Order {selectedOrder.orderNumber || selectedOrder.id}
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5 text-xs">
              {/* Order Fulfillment Status & Timeline */}
              <div className="p-4 bg-[#FFF9F2] rounded-2xl border border-amber-900/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px] font-outfit">
                    Fulfillment Status
                  </span>
                  <span className="font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#C85A32] text-white text-[10px]">
                    {selectedOrder.status}
                  </span>
                </div>

                {selectedOrder.trackingNumber ? (
                  <div className="text-[11px] text-stone-700 flex items-center justify-between pt-1 border-t border-amber-900/10">
                    <span>
                      Courier: <strong>{selectedOrder.courierName || 'Delhivery Express'}</strong>
                    </span>
                    <span>
                      AWB Tracking: <strong className="font-mono text-[#C85A32]">{selectedOrder.trackingNumber}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-800">
                    Awaiting courier dispatch. Click &quot;Assign Courier&quot; below to generate AWB.
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-stone-800 mb-2 uppercase text-[10px] tracking-wider font-outfit">
                  Ordered Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 relative overflow-hidden shrink-0 border border-stone-200">
                          <Image src={item.productImage || '/logo.png'} alt={item.productName} fill unoptimized className="object-cover" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{item.productName}</div>
                          <div className="text-[11px] text-stone-400">Qty: {item.quantity} × ₹{item.unitPrice}</div>
                        </div>
                      </div>
                      <div className="font-bold font-outfit text-stone-900 text-sm">
                        ₹{item.totalPrice}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                  <div className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider font-outfit mb-2">
                    Shipping & Recipient
                  </div>
                  <div className="font-bold text-stone-900">{selectedOrder.shippingAddress?.fullName}</div>
                  <div className="text-stone-600">{selectedOrder.shippingAddress?.addressLine1}</div>
                  <div className="text-stone-600">
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                  </div>
                  <div className="text-stone-500 pt-1">Phone: {selectedOrder.shippingAddress?.phone}</div>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5 text-stone-600">
                  <div className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider font-outfit mb-2">
                    Payment Breakdown
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount ({selectedOrder.couponCode || 'Promo'}):</span>
                      <span>-₹{selectedOrder.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping Fee:</span>
                    <span>₹{selectedOrder.shippingFee}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 text-sm pt-2 border-t border-stone-200 font-outfit">
                    <span>Grand Total:</span>
                    <span className="text-[#C85A32]">₹{selectedOrder.total}</span>
                  </div>
                  {selectedOrder.razorpayPaymentId && (
                    <div className="text-[10px] text-stone-400 font-mono pt-1">
                      Payment ID: {selectedOrder.razorpayPaymentId}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-[#FAF5EE] border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {canRefund && selectedOrder.paymentStatus === 'paid' && (
                  <button
                    onClick={() => handleOpenRefund(selectedOrder)}
                    className="px-3 py-1.5 bg-white border border-stone-200 text-purple-700 hover:bg-purple-50 font-semibold rounded-xl text-xs flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Issue Refund</span>
                  </button>
                )}
                {canCancel && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => handleOpenCancel(selectedOrder)}
                    className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-xl text-xs flex items-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenCourier(selectedOrder)}
                  className="px-4 py-2 bg-[#C85A32] hover:bg-[#B84B24] text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs flex items-center space-x-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Assign Courier / AWB</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courier & AWB Assignment Dialog */}
      {isCourierModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsCourierModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 z-10 text-xs font-body animate-in fade-in-0 zoom-in-95">
            <h3 className="font-outfit font-bold text-stone-900 text-base mb-1">
              Fulfillment & Courier Assignment
            </h3>
            <p className="text-stone-500 mb-4">
              Enter shipping partner and airway bill tracking number for {selectedOrder.orderNumber}.
            </p>

            <form onSubmit={handleSaveCourier} className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Logistics Courier Partner</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                >
                  <option value="Delhivery Express">Delhivery Express</option>
                  <option value="Shiprocket Direct">Shiprocket Direct</option>
                  <option value="BlueDart Surface">BlueDart Surface</option>
                  <option value="DTDC Standard">DTDC Standard</option>
                  <option value="India Post SpeedPost">India Post SpeedPost</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">AWB Tracking Number</label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-mono font-bold"
                  placeholder="e.g. DLH-99281729"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCourierModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C85A32] text-white font-semibold rounded-xl hover:bg-[#B84B24]"
                >
                  Confirm Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Dialog */}
      {isRefundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsRefundModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 z-10 text-xs font-body animate-in fade-in-0 zoom-in-95">
            <h3 className="font-outfit font-bold text-stone-900 text-base mb-1">
              Issue Razorpay Refund
            </h3>
            <p className="text-stone-500 mb-4">
              Initiate a full or partial refund for order {selectedOrder.orderNumber}.
            </p>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedOrder.total}
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-purple-600 focus:outline-none font-bold text-sm"
                />
                <div className="text-[11px] text-stone-400 mt-1">
                  Max refundable: ₹{selectedOrder.total}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Refund Reason</label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800"
                >
                  Authorize Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {isCancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsCancelModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 z-10 text-xs font-body animate-in fade-in-0 zoom-in-95">
            <h3 className="font-outfit font-bold text-stone-900 text-base mb-1">
              Cancel Order
            </h3>
            <p className="text-stone-500 mb-4">
              Cancelling order {selectedOrder.orderNumber} will automatically release reserved stock holds in PostgreSQL.
            </p>

            <form onSubmit={handleProcessCancel} className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Cancellation Reason</label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-semibold rounded-xl"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
