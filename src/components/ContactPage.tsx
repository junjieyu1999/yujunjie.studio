'use client';

import { useState } from 'react';
import Nav from './Nav';
import CommissionQuestionnaire from './CommissionQuestionnaire';
import ContactModal from './ContactModal';
import styles from './ContactPage.module.css';
import pageStyles from './ArtPage.module.css';

const REASONS = [
  { value: '', label: 'Select one…' },
  { value: 'employer', label: 'Employment / Hiring' },
  { value: 'collab', label: 'Collaboration' },
  { value: 'art-commission', label: 'Art commission' },
  { value: 'art-buy', label: 'Purchase a painting' },
  { value: 'coaching', label: 'Coaching / Water polo' },
  { value: 'other', label: 'Other' },
];

const CHANNELS = [
  {
    label: 'Email',
    handle: 'yujunjiestudio@gmail.com',
    href: 'mailto:yujunjiestudio@gmail.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
  },
  {
    label: 'Instagram',
    handle: '@junjieyu.studio',
    href: 'https://instagram.com/junjieyu.studio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    handle: '@junjieyu.studio',
    href: 'https://tiktok.com/@junjieyu.studio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
      </svg>
    ),
  },
];

export default function ContactPage() {
  const [commissionOpen, setCommissionOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', reason: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const set = (k: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
      setForm({ name: '', email: '', reason: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={pageStyles.root}>
      <Nav
        onContactOpen={() => setContactOpen(true)}
        onCommissionOpen={() => setCommissionOpen(true)}
      />

      <main className={pageStyles.main}>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.eyebrow}>Contact</div>
            <h1 className={styles.heroHeading}>
              Let's <em>connect.</em>
            </h1>
            <p className={styles.heroSub}>
              Whether you have a commission in mind, want to collaborate,
              or simply want to say hello — I'd love to hear from you.
            </p>
          </div>
        </section>

        {/* ── Main layout ── */}
        <section className={styles.body}>
          <div className={styles.inner}>
            <div className={styles.grid}>

              {/* ── Left: channels ── */}
              <div className={styles.sidebar}>
                <div className={styles.sectionLabel}>Find me on</div>

                <div className={styles.channels}>
                  {CHANNELS.map((ch) => (
                    <a
                      key={ch.label}
                      href={ch.href}
                      className={styles.channel}
                      target={ch.href.startsWith('mailto') ? undefined : '_blank'}
                      rel="noreferrer"
                    >
                      <span className={styles.channelIcon}>{ch.icon}</span>
                      <div className={styles.channelText}>
                        <span className={styles.channelLabel}>{ch.label}</span>
                        <span className={styles.channelHandle}>{ch.handle}</span>
                      </div>
                      <svg className={styles.channelArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17 17 7M7 7h10v10"/>
                      </svg>
                    </a>
                  ))}
                </div>

                <div className={styles.divider} />

                <div className={styles.noteWrap}>
                  <div className={styles.sectionLabel}>Response time</div>
                  <p className={styles.note}>
                    I typically reply within 48 hours. For urgent commission enquiries,
                    email is fastest.
                  </p>
                </div>

                <div className={styles.noteWrap}>
                  <div className={styles.sectionLabel}>Based in</div>
                  <p className={styles.note}>Singapore · Available worldwide for commissions.</p>
                </div>
              </div>

              {/* ── Right: form ── */}
              <div className={styles.formWrap}>
                {status === 'success' ? (
                  <div className={styles.success}>
                    <div className={styles.successIcon}>✓</div>
                    <h3 className={styles.successHeading}>Message sent</h3>
                    <p className={styles.successBody}>
                      I'll get back to you within 48 hours.
                    </p>
                    <button
                      className={styles.btnGhost}
                      onClick={() => setStatus('idle')}
                    >
                      Send another
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.formHeader}>
                      <div className={styles.sectionLabel}>Send a message</div>
                      <h2 className={styles.formHeading}>Get in touch</h2>
                    </div>

                    <div className={styles.fields}>
                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.label}>Name</label>
                          <input
                            className={styles.input}
                            type="text"
                            placeholder="Your name"
                            value={form.name}
                            onChange={set('name')}
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Email</label>
                          <input
                            className={styles.input}
                            type="email"
                            placeholder="your@email.com"
                            value={form.email}
                            onChange={set('email')}
                          />
                        </div>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>Reason</label>
                        <select
                          className={styles.select}
                          value={form.reason}
                          onChange={set('reason')}
                        >
                          {REASONS.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>Message</label>
                        <textarea
                          className={styles.textarea}
                          rows={6}
                          placeholder="Tell me more…"
                          value={form.message}
                          onChange={set('message')}
                        />
                      </div>
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
          </div>
        </section>
      </main>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <CommissionQuestionnaire open={commissionOpen} onClose={() => setCommissionOpen(false)} />
    </div>
  );
}
