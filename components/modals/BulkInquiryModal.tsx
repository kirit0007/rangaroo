'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BulkInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkInquiryModal({ isOpen, onClose }: BulkInquiryModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState('20');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error('Please enter your name and phone number.');
      return;
    }

    setSubmitted(true);
    toast.success('Inquiry received! Opening WhatsApp chat for instant quotation...');

    // Pre-fill WhatsApp message
    const message = `Hi Rangaroo! I'd like to inquire about Bulk / Birthday Return Gifts:
- Name: ${name}
- Quantity: ${quantity} kits
- Expected Date: ${eventDate || 'Flexible'}
- Contact Phone: ${phone}
${notes ? `- Note: ${notes}` : ''}`;

    const waUrl = `https://wa.me/918793687379?text=${encodeURIComponent(message)}`;
    
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 800);
  };

  const handleReset = () => {
    setSubmitted(false);
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-orange-100 z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-extrabold text-xl text-gray-900 leading-tight">
                    Bulk Return Gifts Inquiry
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Special pricing & custom party boxes for 15+ kits
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 font-outfit">Inquiry Received!</h4>
                <p className="text-gray-600 text-sm max-w-xs mx-auto">
                  Thank you! We've generated your custom quote request. You can also chat directly with our team on WhatsApp.
                </p>
                <div className="pt-4 flex flex-col gap-3">
                  <a
                    href={`https://wa.me/918793687379?text=${encodeURIComponent(`Hi Rangaroo! Following up on bulk inquiry for ${quantity} kits.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-6 bg-[#25D366] text-white rounded-full font-bold text-base hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <MessageCircle className="w-5 h-5" /> Continue on WhatsApp
                  </a>
                  <button
                    onClick={handleReset}
                    className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Phone *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Quantity Needed</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                    >
                      <option value="15-20">15 - 20 Kits</option>
                      <option value="20-30">20 - 30 Kits</option>
                      <option value="30-50">30 - 50 Kits</option>
                      <option value="50+">50+ Kits (Custom Packaging)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Event / Birthday Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Special Requests / Themes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Dinosaur theme for 6th birthday, custom name tags needed..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-full font-bold text-base hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Request Bulk Quote
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
