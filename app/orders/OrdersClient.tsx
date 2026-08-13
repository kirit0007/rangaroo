'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useAdminStore } from '@/store/adminStore';
import { Order, OrderStatus } from '@/types';
import { 
  Package, ShoppingBag, Truck, CheckCircle2, Clock, XCircle, 
  RefreshCw, FileText, ChevronRight, Star, AlertCircle, ArrowLeft, Download, ExternalLink, CornerUpLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrdersClient() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const addItem = useCartStore((state) => state.addItem);
  const storeOrders = useAdminStore((state) => state.orders);

  const [mounted, setMounted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<Order | null>(null);
  const [showTrackModal, setShowTrackModal] = useState<Order | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<{ order: Order; item: any } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const allOrders = storeOrders;

  useEffect(() => {
    setMounted(true);
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
          data.orders.forEach((ord: any) => {
            useAdminStore.getState().addOrder(ord);
          });
        }
      })
      .catch((err) => console.error('Error syncing orders:', err));
  }, []);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold"><CheckCircle2 size={14} /> Delivered</span>;
      case 'shipped':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold"><Truck size={14} /> In Transit (Shipped)</span>;
      case 'processing':
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold"><Clock size={14} /> Processing</span>;
      case 'confirmed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold"><CheckCircle2 size={14} /> Order Confirmed</span>;
      case 'cancellation_requested':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold"><AlertCircle size={14} /> Cancellation Requested</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold"><XCircle size={14} /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-bold">{status}</span>;
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addItem({
        id: item.productId,
        name: item.productName,
        slug: item.productId,
        price: item.unitPrice,
        images: [item.productImage || '/logo.png'],
        shortDescription: item.productName,
        description: item.productName,
        categoryId: 'creative-paint-kit',
        collectionId: 'dinosaur',
        kitContents: ['Figurine', 'Paints', 'Brush'],
        ageGroup: '5+',
        difficulty: 'beginner',
        paintType: 'Washable Tempera',
        figureCount: 2,
        figureSize: 'medium',
        weightGrams: 400,
        stockQuantity: 100,
        isActive: true,
        isFeatured: false,
        tags: ['bestseller']
      }, item.quantity);
    });
    toast.success('Items added to cart!');
    useCartStore.getState().openCart();
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Thank you for your rating & review!');
    setShowReviewModal(null);
    setReviewText('');
    setReviewRating(5);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/" className="inline-flex items-center text-xs font-bold text-orange-600 hover:underline mb-2">
              <ArrowLeft size={14} className="mr-1" /> Back to Store
            </Link>
            <h1 className="text-3xl sm:text-4xl font-outfit font-extrabold text-gray-900 flex items-center gap-3">
              My Orders <Package className="text-orange-500" />
            </h1>
            <p className="text-sm text-gray-500 mt-1">View your order history, real-time tracking, and receipts</p>
          </div>
        </div>

        {!mounted ? (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm animate-pulse h-64"></div>
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm animate-pulse h-64"></div>
          </div>
        ) : allOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-orange-100 shadow-sm">
            <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={36} />
            </div>
            <h2 className="text-2xl font-outfit font-bold text-gray-900 mb-2">No Orders Placed Yet</h2>
            <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">Explore our range of DIY paint kits and create your first order!</p>
            <Link href="/products" className="btn-primary py-3 px-8 text-sm font-bold inline-block">
              Browse DIY Kits
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {allOrders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm hover:shadow-md transition-all"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between pb-6 border-b border-gray-100 gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Order ID</span>
                      <p className="font-outfit font-extrabold text-lg text-gray-900">{order.orderNumber || order.id}</p>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Date Placed</span>
                      <p className="text-sm font-semibold text-gray-700">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total</span>
                      <p className="font-outfit font-bold text-lg text-orange-600">₹{order.total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="py-6 space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 p-2 relative flex-shrink-0 flex items-center justify-center">
                          <Image 
                            src={item.productImage || '/logo.png'} 
                            alt={item.productName} 
                            width={50} 
                            height={50} 
                            className="object-contain max-h-12"
                          />
                        </div>
                        <div>
                          <h4 className="font-outfit font-bold text-gray-900 text-sm sm:text-base">{item.productName}</h4>
                          <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      
                      {order.status === 'delivered' && (
                        <button 
                          onClick={() => setShowReviewModal({ order, item })}
                          className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold flex items-center gap-1 hover:bg-amber-100 transition-colors shrink-0"
                        >
                          <Star size={14} className="fill-amber-400 text-amber-400" /> Review
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Order Actions Footer */}
                <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => setShowTrackModal(order)}
                      className="px-4 py-2.5 rounded-xl bg-orange-50 text-orange-600 font-bold text-xs hover:bg-orange-100 transition-colors flex items-center gap-1.5"
                    >
                      <Truck size={15} /> Track Delivery
                    </button>
                    <button 
                      onClick={() => setShowInvoiceModal(order)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                    >
                      <FileText size={15} /> View Invoice
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button 
                        onClick={() => setShowCancelModal(order)}
                        className="px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1"
                      >
                        <CornerUpLeft size={14} /> Cancel / Return
                      </button>
                    )}
                    <button 
                      onClick={() => handleReorder(order)}
                      className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
                    >
                      <RefreshCw size={14} /> Reorder
                    </button>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}

        {/* Tracking Modal */}
        <AnimatePresence>
          {showTrackModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-outfit font-extrabold text-xl text-gray-900 flex items-center gap-2">
                    <Truck className="text-orange-500" /> Delivery Tracking
                  </h3>
                  <button onClick={() => setShowTrackModal(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
                </div>

                <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-100 mb-6">
                  <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                    <span>Courier Partner: {showTrackModal.courierName || 'Pending Dispatch'}</span>
                    <span>AWB: {showTrackModal.trackingNumber || 'Not Generated Yet'}</span>
                  </div>
                  <p className="text-xs text-orange-700 font-bold mt-1">Expected Delivery: Within 2-3 Business Days</p>
                </div>

                {/* Timeline */}
                <div className="space-y-6 relative pl-6 border-l-2 border-orange-200 my-4 ml-3">
                  {[
                    { title: 'Order Confirmed & Paid', date: 'Order Received', done: ['confirmed', 'processing', 'shipped', 'delivered'].includes(showTrackModal.status) || true },
                    { title: 'Packed & Dispatched', date: 'Handed over to Courier', done: ['shipped', 'delivered'].includes(showTrackModal.status) },
                    { title: 'In Transit', date: 'Out for local delivery', done: ['shipped', 'delivered'].includes(showTrackModal.status) },
                    { title: 'Delivered', date: 'Package arrived at doorstep', done: showTrackModal.status === 'delivered' },
                  ].map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${step.done ? 'bg-orange-500 ring-4 ring-orange-100' : 'bg-gray-300'}`}></div>
                      <h5 className={`font-bold text-sm ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</h5>
                      <p className="text-xs text-gray-500">{step.date}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t flex justify-end">
                  <button onClick={() => setShowTrackModal(null)} className="btn-primary py-2.5 px-6 text-xs font-bold">Close</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invoice Modal */}
        <AnimatePresence>
          {showInvoiceModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div>
                    <h3 className="font-outfit font-extrabold text-2xl text-gray-900">Invoice</h3>
                    <p className="text-xs text-gray-500">Receipt #{showInvoiceModal.orderNumber}</p>
                  </div>
                  <button onClick={() => setShowInvoiceModal(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
                </div>

                <div className="space-y-6 text-sm text-gray-700">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400">Sold By</p>
                      <p className="font-bold text-gray-900">Rangaroo Crafts India</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400">Billed To</p>
                      <p className="font-bold text-gray-900">{showInvoiceModal.shippingAddress?.fullName}</p>
                      <p className="text-xs text-gray-500">{showInvoiceModal.shippingAddress?.city}, {showInvoiceModal.shippingAddress?.state}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Order Line Items</h4>
                    <div className="border rounded-xl divide-y">
                      {showInvoiceModal.items.map((it, i) => (
                        <div key={i} className="p-3 flex justify-between text-xs">
                          <div>
                            <span className="font-bold text-gray-800">{it.productName}</span> × {it.quantity}
                          </div>
                          <span className="font-bold text-gray-900">₹{it.totalPrice.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 pt-2">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{showInvoiceModal.subtotal.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Shipping Fee</span><span>{showInvoiceModal.shippingFee > 0 ? `₹${showInvoiceModal.shippingFee}` : 'FREE'}</span></div>
                    {showInvoiceModal.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{showInvoiceModal.discountAmount}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t"><span>Total Paid</span><span className="text-orange-600">₹{showInvoiceModal.total.toLocaleString('en-IN')}</span></div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex gap-3">
                  <button 
                    onClick={() => { window.print(); }} 
                    className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Print / Save Invoice PDF
                  </button>
                  <button onClick={() => setShowInvoiceModal(null)} className="px-5 py-2.5 border rounded-xl text-xs font-bold">Close</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review Modal */}
        <AnimatePresence>
          {showReviewModal && (
            <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="font-outfit font-extrabold text-xl mb-1 text-gray-900">Leave a Review</h3>
                <p className="text-xs text-gray-500 mb-4">{showReviewModal.item.productName}</p>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          type="button" 
                          onClick={() => setReviewRating(star)}
                          className="text-2xl focus:outline-none"
                        >
                          <Star className={star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Your Review</label>
                    <textarea 
                      rows={3} 
                      required 
                      placeholder="What did your little artist think of this kit?"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 btn-primary py-2.5 text-xs font-bold">Submit Review</button>
                    <button type="button" onClick={() => setShowReviewModal(null)} className="px-4 py-2.5 border rounded-xl text-xs font-bold">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel / Return Modal */}
        <AnimatePresence>
          {showCancelModal && (
            <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle size={28} />
                </div>
                <h3 className="font-outfit font-extrabold text-lg mb-1 text-gray-900">Request Cancellation / Return</h3>
                <p className="text-xs text-gray-500 mb-6">Are you sure you want to cancel or initiate a return for order #{showCancelModal.orderNumber}?</p>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      const targetOrder = showCancelModal;
                      useAdminStore.getState().updateOrderStatus(targetOrder.id, 'cancellation_requested');
                      try {
                        await fetch('/api/admin/orders', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            orderId: targetOrder.id, 
                            status: 'cancellation_requested',
                            order: { ...targetOrder, status: 'cancellation_requested' }
                          }),
                        });
                      } catch (err) {
                        console.error('Error sending cancellation request to server:', err);
                      }
                      toast.success('Cancellation request submitted to support!');
                      setShowCancelModal(null);
                    }} 
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold"
                  >
                    Submit Request
                  </button>
                  <button onClick={() => setShowCancelModal(null)} className="flex-1 py-2.5 border rounded-xl text-xs font-bold">Close</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
