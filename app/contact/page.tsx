import React from 'react';
import { Phone, Mail, MessageSquare, MapPin, Send } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | Rangaroo',
  description: 'Get in touch with the Rangaroo team for any questions about our DIY paint kits.',
};

export default function ContactPage() {
  const contactMethods = [
    { title: 'Email Us', info: 'hello@rangaroo.store', desc: 'We aim to reply within 24 hours.', icon: Mail, color: 'text-blue-500' },
    { title: 'Call Us', info: '+91 87936 87379', desc: 'Mon-Sat, 10am - 7pm IST', icon: Phone, color: 'text-green-500' },
    { title: 'WhatsApp Support', info: '+91 87936 87379', desc: 'Instant chat for quick queries & bulk orders.', icon: MessageSquare, color: 'text-emerald-500' },
    { title: 'Location', info: 'India', desc: 'Shipping nationwide across India 🇮🇳', icon: MapPin, color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-outfit font-extrabold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question about our kits, shipping, or looking for bulk return gifts? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-outfit font-bold text-gray-900 mb-6">Contact Information</h2>
            
            {contactMethods.map((method, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full bg-gray-50 flex flex-shrink-0 items-center justify-center border border-gray-100 ${method.color}`}>
                  <method.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{method.title}</h3>
                  <p className="text-lg font-medium text-gray-800 mt-1">{method.info}</p>
                  <p className="text-sm text-gray-500 mt-1">{method.desc}</p>
                </div>
              </div>
            ))}
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

                <button type="button" className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-md">
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
