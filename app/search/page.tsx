import { Suspense } from 'react';
import SearchClient from './SearchClient';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF9F2] pt-32 text-center">Loading search results...</div>}>
      <SearchClient />
    </Suspense>
  );
}
