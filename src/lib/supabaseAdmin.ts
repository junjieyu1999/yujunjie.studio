// Server-only Supabase client using the SERVICE ROLE key (bypasses Row Level Security).
// Never import this from a client component — the key must never reach the browser.
//
// It is created lazily so that a missing env var produces a clear error when a
// request actually needs it, instead of crashing the whole build at import time.
//
// IMPORTANT — caching: Next.js caches server-side fetch() GET requests by default,
// and supabase-js talks to Supabase over fetch(). Without the wrapper below the admin
// would be shown stale data, and the login check (auth.getUser) could even be cached.
//   'fresh'      (default) never cached. Use for every admin API route and the login check.
//   'revalidate' cached and refreshed every 60s. Use only for public ISR pages.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Mode = 'fresh' | 'revalidate';

const clients: Partial<Record<Mode, SupabaseClient>> = {};

export function getSupabaseAdmin(mode: Mode = 'fresh'): SupabaseClient {
  const existing = clients[mode];
  if (existing) return existing;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Server is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  const cachingFetch: typeof fetch = (input, init) =>
    mode === 'fresh'
      ? fetch(input, { ...init, cache: 'no-store' })
      : fetch(input, { ...init, next: { revalidate: 60 } } as RequestInit);

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: cachingFetch },
  });
  clients[mode] = client;
  return client;
}
