import type { Metadata } from 'next';
import DevGuide from '@/components/DevGuide';

export const metadata: Metadata = {
  title: 'Developer Guide — Yu JunJie',
  description: 'Internal reference for editing and extending the site.',
};

// Remove this page before going live, or protect it behind auth
export default function DevGuidePage() {
  return <DevGuide />;
}
