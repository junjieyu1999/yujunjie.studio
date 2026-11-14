'use client';

// The /admin screen. One login protects everything:
//   Overview    — artwork pipeline + postcard pipeline side by side
//   Artworks    — the existing artwork manager (unchanged)
//   Snail mail  — monthly issues, subscribers and shipments

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch, adminApi } from '@/lib/adminFetch';
import type { Artwork } from '@/lib/types';
import type { MailData } from '@/lib/mail';
import AdminPage from './AdminPage';
import AdminOverview from './AdminOverview';
import AdminMail from './AdminMail';
import styles from './AdminShell.module.css';

type Tab  = 'overview' | 'artworks' | 'mail';
type Gate = 'checking' | 'signedOut' | 'denied' | 'ok';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'artworks', label: 'Artworks' },
  { id: 'mail',     label: 'Snail mail' },
];

export default function AdminShell() {
  const [gate,    setGate]    = useState<Gate>('checking');
  const [gateMsg, setGateMsg] = useState('');
  const [email,   setEmail]   = useState('');
  const [tab,     setTab]     = useState<Tab>('overview');

  // login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass,  setLoginPass]  = useState('');
  const [loggingIn,  setLoggingIn]  = useState(false);

  // shared data (used by Overview and Snail mail)
  const [artworks,    setArtworks]    = useState<Artwork[]>([]);
  const [mail,        setMail]        = useState<MailData | null>(null);
  const [mailError,   setMailError]   = useState('');
  const [mailLoading, setMailLoading] = useState(false);

  // ── Ask the server whether this login is an allowed admin ────────
  const verify = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setGate('signedOut'); return; }
    setEmail(data.session.user.email ?? '');

    try {
      const res = await authFetch('/api/admin/me');
      if (res.ok) { setGate('ok'); setGateMsg(''); return; }
      const json = await res.json().catch(() => ({}));
      setGateMsg(typeof json.error === 'string' ? json.error : 'Could not verify your login.');
      setGate(res.status === 401 ? 'signedOut' : 'denied');
    } catch {
      setGateMsg('Could not reach the server. Check your connection and refresh.');
      setGate('denied');
    }
  }, []);

  useEffect(() => {
    verify();
    // Only react to sign-out here; sign-in is handled by the login form.
    // (Supabase also fires SIGNED_IN when the tab regains focus, which must not reset the page.)
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { setGate('signedOut'); setMail(null); }
    });
    return () => sub.subscription.unsubscribe();
  }, [verify]);

  // ── Data loaders ─────────────────────────────────────────────────
  const loadMail = useCallback(async () => {
    setMailLoading(true);
    try {
      const json = await adminApi('GET', '/api/admin/mail/data');
      setMail(json as unknown as MailData);
      setMailError('');
    } catch (e) {
      setMailError(e instanceof Error ? e.message : 'Could not load snail mail data.');
    } finally {
      setMailLoading(false);
    }
  }, []);

  const loadArtworks = useCallback(async () => {
    try {
      const res = await fetch('/api/artworks');
      const json = await res.json();
      setArtworks(Array.isArray(json) ? json : []);
    } catch {
      /* the Overview simply shows no artworks */
    }
  }, []);

  // Refresh whenever the admin lands on a tab that shows this data
  // (so changes made in the Artworks tab are visible on Overview / Snail mail).
  useEffect(() => {
    if (gate !== 'ok') return;
    if (tab === 'overview' || tab === 'mail') { loadMail(); loadArtworks(); }
  }, [gate, tab, loadMail, loadArtworks]);

  // ── Actions ──────────────────────────────────────────────────────
  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setGateMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    if (error) {
      setGateMsg(error.message);
      setLoggingIn(false);
      return;
    }
    setLoginPass('');
    setGate('checking');
    await verify();
    setLoggingIn(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setGate('signedOut');
    setMail(null);
    setGateMsg('');
  };

  // ── Render ───────────────────────────────────────────────────────
  if (gate === 'checking') {
    return <div className={styles.center}><div className={styles.spinner} /></div>;
  }

  if (gate === 'signedOut') {
    return (
      <div className={styles.center}>
        <form className={styles.login} onSubmit={signIn}>
          <div className={styles.loginEyebrow}>Studio admin</div>
          <h1 className={styles.loginTitle}>Sign in</h1>
          <label className={styles.field}>
            Email
            <input type="email" autoComplete="username" required value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)} />
          </label>
          <label className={styles.field}>
            Password
            <input type="password" autoComplete="current-password" required value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)} />
          </label>
          {gateMsg && <p className={styles.err} role="alert">{gateMsg}</p>}
          <button className={styles.primary} disabled={loggingIn}>
            {loggingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  if (gate === 'denied') {
    return (
      <div className={styles.center}>
        <div className={styles.login}>
          <div className={styles.loginEyebrow}>Studio admin</div>
          <h1 className={styles.loginTitle}>No access</h1>
          <p className={styles.err} role="alert">{gateMsg}</p>
          <button className={styles.primary} onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell} style={{ '--admin-bar-h': '52px' } as React.CSSProperties}>
      <header className={styles.bar}>
        <div className={styles.barLeft}>
          <span className={styles.brand}>Studio admin</span>
          <nav className={styles.tabs} aria-label="Admin sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`${styles.tab} ${tab === t.id ? styles.tabOn : ''}`}
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className={styles.barRight}>
          {email && <span className={styles.who}>{email}</span>}
          <button className={styles.ghost} onClick={signOut}>Sign out</button>
        </div>
      </header>

      {tab === 'overview' && (
        <AdminOverview
          artworks={artworks}
          mail={mail}
          error={mailError}
          loading={mailLoading && !mail}
          onOpenMail={() => setTab('mail')}
          onOpenArtworks={() => setTab('artworks')}
        />
      )}
      {tab === 'artworks' && <AdminPage />}
      {tab === 'mail' && (
        <AdminMail
          data={mail}
          artworks={artworks}
          loading={mailLoading && !mail}
          error={mailError}
          onChanged={loadMail}
        />
      )}
    </div>
  );
}
