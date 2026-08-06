'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#FFF9F2]">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl max-w-md w-full flex flex-col items-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-2">Oops! Something went wrong</h1>
        <p className="text-gray-600 text-sm mb-6">
          We encountered a temporary error loading this section.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 btn-primary py-2.5 px-4 text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="flex-1 btn-outline py-2.5 px-4 text-sm flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
