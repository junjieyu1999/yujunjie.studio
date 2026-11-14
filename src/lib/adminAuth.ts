// Server-side admin gate for API routes.
//
// How it works:
//   1. The admin page signs in with Supabase Auth and sends the user's access
//      token as `Authorization: Bearer <token>` on every admin request.
//   2. requireAdmin() asks Supabase to verify that token, then checks the
//      user's email against the ADMIN_EMAILS env var (comma-separated).
//
// The email allow-list matters: it means that even if someone else manages to
// create a Supabase account in this project, they still cannot use the admin.
//
// Fails CLOSED: if ADMIN_EMAILS is not set, every admin request is refused.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';

function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns null when the request is from an allowed admin,
 * otherwise a ready-to-return error response.
 *
 *   const denied = await requireAdmin(req);
 *   if (denied) return denied;
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const allowed = allowedEmails();
  if (allowed.length === 0) {
    return NextResponse.json(
      { error: 'Admin is not configured. Set ADMIN_EMAILS on the server.' },
      { status: 503 }
    );
  }

  const match = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '');
  if (!match) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(match[1]);
    const user = data?.user;
    if (error || !user?.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
    }
    if (!allowed.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'This account is not allowed to use the admin.' }, { status: 403 });
    }
    return null;
  } catch (err) {
    console.error('requireAdmin error:', err);
    return NextResponse.json({ error: 'Could not verify your login.' }, { status: 500 });
  }
}
