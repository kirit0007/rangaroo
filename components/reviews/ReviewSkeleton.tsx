import React from 'react';

export default function ReviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((idx) => (
        <div key={idx} className="bg-white/60 backdrop-blur-md rounded-3xl p-7 border border-orange-100/60 shadow-sm h-48 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-24 h-4 bg-amber-200/60 rounded"></div>
              <div className="w-20 h-4 bg-green-200/60 rounded-full"></div>
            </div>
            <div className="w-3/4 h-5 bg-gray-200/70 rounded mb-3"></div>
            <div className="w-full h-4 bg-gray-200/50 rounded mb-2"></div>
            <div className="w-2/3 h-4 bg-gray-200/50 rounded"></div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="w-20 h-4 bg-gray-200/70 rounded"></div>
            <div className="w-16 h-3 bg-gray-200/50 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
