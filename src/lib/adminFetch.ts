// Browser helper: fetch() that attaches the signed-in admin's access token.
// Use for every request to an admin-only API route.

import { supabase } from './supabase';

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, { cache: 'no-store', ...init, headers });
}

/**
 * JSON call to an admin API route. Resolves with the parsed JSON body,
 * or throws an Error whose message is safe to show to the admin.
 */
export async function adminApi(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<Record<string, unknown>> {
  const res = await authFetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(typeof json.error === 'string' ? json.error : 'Something went wrong. Please try again.');
  }
  return json;
}
