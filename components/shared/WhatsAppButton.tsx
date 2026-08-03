'use client';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/918793687379?text=Hi! I'd like to know more about Rangaroo DIY Paint Kits 🎨"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white animate-bounce-slow"
    >
      <span className="text-2xl">💬</span>
      <span className="font-heading text-sm font-bold pr-1 hidden sm:inline">
        Chat with Us
      </span>
      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-300 rounded-full animate-ping" />
    </a>
  );
}
