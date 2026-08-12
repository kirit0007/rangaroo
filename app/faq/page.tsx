import { Metadata } from 'next';
import FAQClient from './FAQClient';
import { faqs } from '@/data/faq';

export const metadata: Metadata = {
  title: 'FAQ | Rangaroo DIY Paint Kits',
  description: 'Frequently asked questions about Rangaroo DIY paint kits, shipping, safety, and return gifts.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'FAQ | Rangaroo DIY Paint Kits',
    description: 'Frequently asked questions about Rangaroo DIY paint kits, shipping, safety, and return gifts.',
    url: '/faq',
  },
};

export default function FAQPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.flatMap(cat =>
      cat.questions.map(q => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.a,
        },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FAQClient />
    </>
  );
}
