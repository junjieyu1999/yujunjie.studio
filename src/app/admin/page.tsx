import AdminPage from '@/components/AdminPage';

// This page is NOT linked from the nav — access it at /admin
// Before going to production, protect this route with Supabase Auth

export default function Admin() {
  return <AdminPage />;
}
