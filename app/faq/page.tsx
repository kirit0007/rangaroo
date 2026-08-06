'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    category: 'Product & Safety',
    questions: [
      {
        q: 'Are the paints safe for children?',
        a: 'Yes, absolutely! We use 100% non-toxic, water-based acrylic paints that are entirely safe for kids. However, adult supervision is recommended for children under 3 to prevent accidental ingestion.'
      },
      {
        q: 'What is the recommended age for these kits?',
        a: 'Our kits are generally suitable for ages 5 and up. We have specific collections designed with simpler shapes for younger kids (3-5 years with supervision) and more detailed figurines for older kids (8+ years).'
      },
      {
        q: 'Can the paint be washed out of clothes?',
        a: 'Since we use high-quality acrylic paints to ensure vibrant colors on plaster, they can stain clothing once dry. We recommend wearing an apron or old clothes while painting. If paint gets on clothes, wash it immediately with warm water and soap before it dries.'
      }
    ]
  },
  {
    category: 'Shipping & Delivery',
    questions: [
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery usually takes 4-7 business days across India. For metro cities, it typically arrives in 3-5 days. You will receive a tracking link via email/SMS once your order is dispatched.'
      },
      {
        q: 'Do you offer free shipping?',
        a: 'Yes, we offer free shipping on all orders above ₹499. For orders below that amount, a flat shipping fee of ₹60 is applied.'
      }
    ]
  },
  {
    category: 'Returns & Bulk Orders',
    questions: [
      {
        q: 'What if my kit arrives damaged?',
        a: 'We pack our plaster figurines with extreme care, but if something arrives broken, please email us a photo within 48 hours of delivery at hello@rangaroo.in. We will send a replacement figurine immediately at no extra cost.'
      },
      {
        q: 'Do you take bulk orders for birthday return gifts?',
        a: 'Yes, we specialize in return gifts! We offer special bulk pricing for orders of 15 kits or more. We can also customize the packaging with the birthday child\'s name. Please use our Contact Form or WhatsApp us for bulk inquiries.'
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>('0-0');

  const toggleAccordion = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-outfit font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600">
            Everything you need to know about our DIY paint kits and services.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqs.map((category, catIdx) => (
            <div key={catIdx}>
              <h2 className="text-2xl font-outfit font-bold text-gray-900 mb-6 flex items-center gap-2">
                {category.category}
              </h2>
              
              <div className="space-y-4">
                {category.questions.map((faq, qIdx) => {
                  const id = `${catIdx}-${qIdx}`;
                  const isOpen = openIndex === id;
                  
                  return (
                    <div 
                      key={qIdx} 
                      className={`bg-white rounded-2xl border transition-colors ${isOpen ? 'border-orange-300 shadow-md' : 'border-gray-200 shadow-sm hover:border-orange-200'}`}
                    >
                      <button
                        onClick={() => toggleAccordion(id)}
                        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                      >
                        <span className={`font-semibold text-lg pr-4 ${isOpen ? 'text-orange-600' : 'text-gray-900'}`}>
                          {faq.q}
                        </span>
                        <ChevronDown 
                          className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-600' : 'text-gray-400'}`} 
                        />
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-100 mt-2">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-16 bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
          <h3 className="text-2xl font-outfit font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-6">Can't find the answer you're looking for? Please chat to our friendly team.</p>
          <Link href="/contact" className="inline-block px-8 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors">
            Contact Us
          </Link>
        </div>

      </div>
    </div>
  );
}
