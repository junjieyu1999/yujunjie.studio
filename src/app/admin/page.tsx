import type { Metadata } from 'next';
import AdminShell from '@/components/AdminShell';

// Private page: sign in with your Supabase admin account.
// Only the emails listed in the ADMIN_EMAILS environment variable are let in,
// and every write to the database is checked again on the server.

export const metadata: Metadata = {
  title: 'Admin — Yu JunJie',
  robots: { index: false, follow: false },
};

export default function Admin() {
  return <AdminShell />;
}
