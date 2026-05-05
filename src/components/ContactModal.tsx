'use client';

import { useState, useEffect } from 'react';
import styles from './Modal.module.css';

const REASONS = [
  { value: '', label: 'Select one…' },
  { value: 'employer', label: 'Employment / Hiring' },
  { value: 'collab', label: 'Collaboration' },
  { value: 'art-commission', label: 'Art commission' },
  { value: 'art-buy', label: 'Purchase a painting' },
  { value: 'coaching', label: 'Coaching / Water polo' },
  { value: 'other', label: 'Other' },
];

interface Props {
  open: boolean;
  defaultReason?: string;
  onClose: () => void;
}

export default function ContactModal({ open, defaultReason, onClose }: Props) {
  const [form, setForm] = useState({ name: '', email: '', reason: defaultReason ?? '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, reason: defaultReason ?? '' }));
  }, [open, defaultReason]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.dark}`}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>

        {status === 'success' ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h2>Message sent</h2>
            <p>I'll get back to you within 48 hours.</p>
            <button className={styles.btnPrimary} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h2>Let's talk</h2>
            <p className={styles.sub}>Fill in the form and I'll get back to you within 48 hours.</p>

            <div className={styles.field}>
              <label>Your name</label>
              <input type="text" placeholder="Jane Smith" value={form.name} onChange={set('name')} />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" placeholder="jane@company.com" value={form.email} onChange={set('email')} />
            </div>
            <div className={styles.field}>
              <label>Reason</label>
              <select value={form.reason} onChange={set('reason')}>
                {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Message</label>
              <textarea rows={4} placeholder="Tell me more…" value={form.message} onChange={set('message')} />
            </div>

            {status === 'error' && (
              <p className={styles.errorMsg}>Something went wrong. Please try again.</p>
            )}

            <button
              className={styles.submit}
              onClick={handleSubmit}
              disabled={status === 'loading' || !form.name || !form.email}
            >
              {status === 'loading' ? 'Sending…' : 'Send message →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
