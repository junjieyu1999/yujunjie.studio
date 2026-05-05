import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yu JunJie — Art',
  description: 'Oil paintings — portraits and landscapes — by Yu JunJie. Commission a piece or enquire about available works.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
