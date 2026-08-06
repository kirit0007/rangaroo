'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global root error caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#FFF9F2] text-gray-900 min-h-screen flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl max-w-md w-full">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500 font-bold text-2xl">
            🦘
          </div>
          <h1 className="font-bold text-2xl text-gray-900 mb-2">Rangaroo Store</h1>
          <p className="text-gray-600 text-sm mb-6">
            An unexpected error occurred. Click below to reload the application.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-[#FF5722] text-white rounded-xl font-bold shadow-md hover:bg-[#e64a19] transition-colors"
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
