import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, Palette, Shield, Sparkles, Smile } from 'lucide-react';

export const metadata = {
  title: 'About Us | Rangaroo',
  description: 'The story behind Rangaroo, creating smiles with premium DIY paint kits for kids.',
};

export default function AboutPage() {
  const values = [
    { title: 'Creativity First', desc: 'We believe every child is an artist waiting for the right canvas.', icon: Palette, color: 'text-purple-500' },
    { title: 'Uncompromising Safety', desc: '100% non-toxic, child-safe paints and materials in every kit.', icon: Shield, color: 'text-green-500' },
    { title: 'Screen-Free Joy', desc: 'Engaging physical activities that pull kids away from digital devices.', icon: Smile, color: 'text-orange-500' },
    { title: 'Premium Quality', desc: 'Hand-poured plaster that absorbs paint perfectly for vibrant results.', icon: Star, color: 'text-amber-500' },
    { title: 'Made with Love', desc: 'Every kit is packed with care to ensure a magical unboxing experience.', icon: Heart, color: 'text-pink-500' },
    { title: 'Skill Building', desc: 'Developing fine motor skills and color recognition through play.', icon: Sparkles, color: 'text-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-sm border border-orange-100 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-50 to-transparent z-0"></div>
            
            <div className="flex-1 relative z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-outfit font-extrabold text-gray-900 mb-6">
                Our Story: Painting a <span className="text-orange-500">Brighter</span> Future
              </h1>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Rangaroo started with a simple observation: kids today spend too much time staring at screens and not enough time creating with their hands. As parents, we wanted to provide a fun, engaging alternative that wasn't just another plastic toy.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We discovered that painting 3D plaster figures offered the perfect blend of focus, creativity, and tangible reward. After months of testing to find the safest paints and the best plaster formulas, Rangaroo was born.
              </p>
            </div>
            
            <div className="flex-1 relative z-10 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 bg-orange-100 rounded-full flex items-center justify-center p-8 border-8 border-white shadow-xl">
                <Image 
                  src="/rangoo.png" 
                  alt="Rangoo Mascot" 
                  fill 
                  className="object-contain p-4" 
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-outfit font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-2xl font-medium text-gray-700 leading-relaxed italic">
            "To spark imagination, build confidence, and create lasting childhood memories through accessible, high-quality creative experiences."
          </p>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-center text-gray-900 mb-12">What Makes Rangaroo Special</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((val, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-orange-200 transition-colors">
                <div className={`w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 ${val.color} border border-gray-100`}>
                  <val.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{val.title}</h3>
                <p className="text-gray-600">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Founder */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-3xl p-8 md:p-12 border border-white shadow-sm flex flex-col md:flex-row items-center gap-10">
            <div className="w-40 h-40 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden border-4 border-white shadow-md">
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
                {/* Placeholder for founder image */}
                <Smile className="w-16 h-16 opacity-50" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-outfit font-bold text-gray-900 mb-2">A Note From the Founder</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                "When I saw the pure joy on my niece's face after finishing her first painted figurine, I knew I had to share this experience with more families. Rangaroo isn't just about painting; it's about giving kids the pride of saying 'I made this!'"
              </p>
              <p className="font-bold text-gray-900">- Team Rangaroo</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 mt-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-outfit font-bold text-gray-900 mb-6">Ready to join the fun?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Explore our collection of DIY kits and find the perfect creative project for your little one today.
          </p>
          <Link href="/products" className="inline-block px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg">
            Shop Our Collections
          </Link>
        </div>
      </section>
    </div>
  );
}
