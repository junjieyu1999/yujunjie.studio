import type { Metadata } from 'next';
import ContactPage from '@/components/ContactPage';

export const metadata: Metadata = {
  title: 'Contact — Yu JunJie',
  description: 'Get in touch with Yu JunJie — commissions, collaborations, or just to say hello.',
};

export default function Contact() {
  return <ContactPage />;
}
