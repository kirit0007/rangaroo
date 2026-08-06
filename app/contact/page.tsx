import React from 'react';
import { MapPin, Send, PhoneCall } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | Rangaroo',
  description: 'Get in touch with the Rangaroo team for any questions about our DIY paint kits.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20 font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-outfit font-extrabold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question about our kits, shipping, or looking for bulk return gifts? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Info matching user image */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-2xl font-outfit font-bold text-gray-900 mb-6">Contact Information</h2>
            
            {/* WhatsApp */}
            <a 
              href="https://wa.me/918793687379" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.399.636-1.155 4.218 4.319-1.132.58.345zm11.758-5.748c-.296-.148-1.747-.862-2.017-.96-.27-.099-.467-.148-.665.149-.197.296-.764.96-.937 1.157-.173.198-.345.223-.641.074-.296-.149-1.252-.462-2.386-1.475-.882-.788-1.48-1.761-1.653-2.058-.173-.297-.018-.458.13-.606.134-.133.296-.347.444-.521.148-.173.197-.296.296-.495.099-.198.05-.371-.025-.52-.075-.148-.665-1.604-.911-2.198-.24-.579-.487-.501-.665-.51-.172-.009-.37-.01-.567-.01-.198 0-.52.074-.79.371-.27.296-1.035 1.013-1.035 2.471s1.06 2.866 1.207 3.064c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.271-.198-.567-.347z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">WhatsApp Support</h3>
                <p className="text-base font-extrabold text-gray-900 mt-0.5">+91 87936 87379</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Click for instant chat</p>
              </div>
            </a>

            {/* Instagram */}
            <a 
              href="https://www.instagram.com/ranga.roo/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-pink-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#fccc63] via-[#fba756] via-[#d62976] via-[#962fbf] to-[#4f5bd5] flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Instagram Handle</h3>
                <p className="text-base font-extrabold text-gray-900 mt-0.5">ranga.roo</p>
                <p className="text-xs text-pink-600 font-medium mt-0.5">Follow us on Instagram</p>
              </div>
            </a>

            {/* Email */}
            <a 
              href="mailto:hello@rangaroo.store" 
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-orange-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 6l-10 7L2 6"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Email Address</h3>
                <p className="text-base font-extrabold text-gray-900 mt-0.5">hello@rangaroo.store</p>
                <p className="text-xs text-orange-600 font-medium mt-0.5">Click to send an email</p>
              </div>
            </a>

            {/* Direct Phone Call */}
            <a 
              href="tel:+918793687379" 
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Direct Phone Line</h3>
                <p className="text-base font-extrabold text-gray-900 mt-0.5">+91 87936 87379</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">Mon-Sat, 10am - 7pm IST</p>
              </div>
            </a>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-outfit font-bold text-gray-900 mb-6">Send us a Message</h2>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Your Name *</label>
                    <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address *</label>
                    <input required type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" placeholder="john@example.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white">
                    <option>General Inquiry</option>
                    <option>Order Status</option>
                    <option>Bulk/Return Gifts</option>
                    <option>Feedback</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Message *</label>
                  <textarea required rows={5} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none" placeholder="How can we help you today?"></textarea>
                </div>

                <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-md">
                  <Send className="w-5 h-5" /> Send Message
                </button>
              </form>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
