'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhatsAppButton() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918793687379';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hi%20Rangaroo!%20I%20have%20a%20question%20about%20your%20paint%20kits.`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:bg-[#20bd5a] transition-all duration-300 flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2,
          repeatDelay: 3
        }}
      >
        <MessageCircle size={28} className="fill-current" />
      </motion.div>
      
      {/* Pulse rings */}
      <span className="absolute w-full h-full rounded-full border-2 border-[#25D366] opacity-0 animate-ping"></span>
    </motion.a>
  );
}
