// app/about/page.tsx
// No data fetching needed — static content, renders instantly

import type { Metadata } from 'next';
import AboutPage from '@/components/AboutPage';

export const metadata: Metadata = {
  title: 'About — Yu JunJie',
  description: 'Philosophy, art style and background of Singapore oil painter Yu JunJie.',
};

export default function About() {
  return <AboutPage />;
}
