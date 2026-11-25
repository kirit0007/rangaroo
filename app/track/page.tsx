'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Truck, Package, CheckCircle2, Clock, AlertTriangle, ArrowRight, Lock, MapPin, Phone, Mail, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface TrackedOrder {
  orderNumber: string;
  status: string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city?: string;
  state?: string;
  pinCode?: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  items: Array<{
    productId?: string;
    productName?: string;
    name?: string;
    productImage?: string;
    image?: string;
    quantity: number;
    unitPrice: number;
    price?: number;
    totalPrice?: number;
  }>;
}

function OrderTrackerContent() {
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get('orderNumber') || '';
  const initialToken = searchParams.get('token') || '';

  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber);
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performTracking = async (orderNum: string, token: string) => {
    if (!orderNum.trim() || !token.trim()) {
      toast.error('Both Order Number and Secret Tracking Token are required');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNum.trim())}&token=${encodeURIComponent(token.trim())}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 429) {
          setErrorMessage('Too many lookup requests. Please wait 1 minute before trying again.');
        } else if (res.status === 410) {
          setErrorMessage('This guest order tracking link has expired (past 30 days). Please contact support.');
        } else {
          setErrorMessage('Order not found or tracking token is invalid. Please verify your order number and token.');
        }
        setOrder(null);
        return;
      }

      setOrder(data.order);
      toast.success('Order status retrieved successfully! 📦');
    } catch (err: any) {
      console.error('Track order error:', err);
      setErrorMessage('Network error while checking order status. Please check your connection.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber && initialToken) {
      performTracking(initialOrderNumber, initialToken);
    }
  }, [initialOrderNumber, initialToken]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performTracking(orderNumberInput, tokenInput);
  };

  // Determine stage on timeline
  const getStageIndex = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'DELIVERED') return 3;
    if (s === 'SHIPPED' || s === 'DISPATCHED') return 2;
    if (s === 'PROCESSING' || s === 'PAID') return 1;
    return 0; // PENDING or default
  };

  const currentStage = order ? getStageIndex(order.orderStatus || order.status) : 0;

  const stages = [
    { label: 'Order Confirmed', desc: 'Payment verified & craft box queued' },
    { label: 'Handcrafted & Packed', desc: 'Plaster inspected & paints bundled' },
    { label: 'Courier Dispatched', desc: 'Handed to express courier partner' },
    { label: 'Delivered', desc: 'Safely arrived for creative smiles' },
  ];

  return (
    <div className="space-y-8">
      {/* Lookup Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE8DE] shadow-xs">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="orderNumberField" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                Order Number *
              </label>
              <input
                id="orderNumberField"
                type="text"
                required
                placeholder="e.g., #1001 or #123456"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-[#FFFDF9] font-mono"
              />
            </div>
            <div>
              <label htmlFor="tokenField" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                Secret Guest Tracking Token *
              </label>
              <input
                id="tokenField"
                type="text"
                required
                placeholder="Paste the 64-char token received upon checkout"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5722] text-sm bg-[#FFFDF9] font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Masked PII & Cryptographic HMAC Token verification for your privacy
            </p>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto min-h-[44px] px-8 py-2.5 bg-[#FF5722] hover:bg-[#E64A19] text-white font-heading font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Track My Order
                </>
              )}
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Tracking Notice</p>
              <p className="mt-0.5 text-amber-800">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tracked Order Details */}
      {order && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EFE8DE] shadow-xs space-y-8"
        >
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFE8DE]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {order.paymentStatus === 'PAID' ? '✔ Payment Confirmed' : 'Payment Processing'}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-900">
                Order {order.orderNumber}
              </h2>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Value</p>
              <p className="text-2xl font-black text-[#FF5722] font-mono">
                ₹{Number(order.total).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* 4-Step Interactive Timeline */}
          <div>
            <h3 className="font-heading font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#FF5722]" /> Delivery Journey
            </h3>

            <div className="relative">
              {/* Progress Line */}
              <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-[#EFE8DE] -translate-y-1/2 z-0">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#FF5722] transition-all duration-700"
                  style={{ width: `${(currentStage / (stages.length - 1)) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-4 relative z-10">
                {stages.map((stage, idx) => {
                  const isCompleted = idx <= currentStage;
                  const isCurrent = idx === currentStage;
                  return (
                    <div
                      key={idx}
                      className={`flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2 p-3 sm:p-2 rounded-2xl ${
                        isCurrent ? 'bg-orange-50/70 border border-orange-200/80 sm:bg-transparent sm:border-0' : ''
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <div>
                        <p className={`font-heading font-bold text-sm ${isCurrent ? 'text-[#FF5722]' : 'text-gray-900'}`}>
                          {stage.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Masked Customer PII & Shipping Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#EFE8DE]">
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EFE8DE] space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Customer Information (Masked PII)
              </p>
              <div className="text-xs sm:text-sm text-gray-800 space-y-1">
                <p className="font-bold">{order.customerName}</p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> {order.customerEmail}
                </p>
                <p className="flex items-center gap-2 text-gray-600 font-mono">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {order.customerPhone}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EFE8DE] space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#FF5722]" /> Delivery Destination
              </p>
              <div className="text-xs sm:text-sm text-gray-800 space-y-1">
                <p className="font-bold">
                  {order.city ? `${order.city}, ${order.state || ''}` : 'Dispatched via Courier Partner'}
                </p>
                {order.pinCode && <p className="text-gray-600 font-mono">PIN: {order.pinCode}</p>}
                <p className="text-xs text-gray-500">Fast Express Delivery across India</p>
              </div>
            </div>
          </div>

          {/* Order Items Snapshot */}
          {order.items && order.items.length > 0 && (
            <div className="pt-6 border-t border-[#EFE8DE] space-y-3">
              <h4 className="font-heading font-bold text-base text-gray-900">
                Craft Kit Line Items
              </h4>
              <div className="divide-y divide-[#EFE8DE]/60">
                {order.items.map((item, idx) => {
                  const name = item.productName || item.name || 'DIY Plaster Paint Kit';
                  const img = item.productImage || item.image || '/logo.png';
                  const price = item.unitPrice || item.price || 0;
                  const qty = item.quantity || 1;
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-[#FFFDF9] border border-[#EFE8DE] overflow-hidden shrink-0">
                          <Image src={img} alt={name} fill className="object-cover" unoptimized />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900 line-clamp-1">{name}</p>
                          <p className="text-xs text-gray-500 font-mono">Qty: {qty}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-sm text-[#FF5722] font-mono">
                        ₹{(price * qty).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Need Help CTA */}
          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="text-gray-700 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#FF5722]" /> Have a question about this shipment?
            </span>
            <a
              href={`https://wa.me/918793687379?text=${encodeURIComponent(`Hi Rangaroo Support, I am inquiring about Order ${order.orderNumber}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#25D366] text-white rounded-full font-bold shadow-xs hover:bg-[#20bd5a] transition-all shrink-0"
            >
              WhatsApp Support (+91 87936 87379)
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function OrderTrackPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Courier & Fulfillment Tracking
          </span>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-gray-900">
            Track Your Craft Order
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-lg mx-auto">
            Enter your order number and secret guest token to check your kit&apos;s real-time journey.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-12 text-center text-gray-500">
              <Clock className="w-8 h-8 animate-spin mx-auto text-[#FF5722] mb-2" />
              Loading tracking information...
            </div>
          }
        >
          <OrderTrackerContent />
        </Suspense>
      </div>
    </div>
  );
}
