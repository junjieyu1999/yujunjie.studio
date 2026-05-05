'use client';

import { useState, useEffect } from 'react';
import styles from './Modal.module.css';
import qStyles from './Questionnaire.module.css';
import type { QuestionnaireData } from '@/lib/types';

type StepType = 'p2' | 'p3' | 'textarea' | 'contact';

interface Step {
  label: string;
  key: keyof QuestionnaireData;
  type: StepType;
  options?: string[] | { label: string; sub: string }[];
  placeholder?: string;
}

const STEPS: Step[] = [
  {
    label: 'What kind of painting?',
    key: 'type',
    type: 'p2',
    options: ['Portrait', 'Landscape', 'Abstract / Mixed', "Custom — I'll describe"],
  },
  {
    label: 'What size are you thinking?',
    key: 'size',
    type: 'p3',
    options: [
      { label: 'Small', sub: 'up to 40cm' },
      { label: 'Medium', sub: '40–70cm' },
      { label: 'Large', sub: '70cm+' },
    ],
  },
  {
    label: "What's your budget?",
    key: 'budget',
    type: 'p2',
    options: ['Under S$500', 'S$500–S$1,500', 'S$1,500–S$3,000', 'S$3,000+'],
  },
  {
    label: 'Describe the theme or mood',
    key: 'theme',
    type: 'textarea',
    placeholder: 'e.g. A quiet interior, warm and contemplative. A seascape at first light, slightly melancholic…',
  },
  {
    label: "What's your inspiration?",
    key: 'insp',
    type: 'textarea',
    placeholder: 'Anything — a memory, song lyrics, a place, a feeling, a moment in time, a person…',
  },
  {
    label: 'Your contact details',
    key: 'name',
    type: 'contact',
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommissionQuestionnaire({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<QuestionnaireData>({});
  const [brief, setBrief] = useState('');
  const [phase, setPhase] = useState<'questions' | 'generating' | 'brief'>('questions');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setStep(0); setData({}); setBrief(''); setPhase('questions'); setError(''); }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const setField = (k: keyof QuestionnaireData, v: string) =>
    setData((d) => ({ ...d, [k]: v }));

  const handleNext = async () => {
    if (isLast) {
      await generateBrief();
    } else {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const generateBrief = async () => {
    setPhase('generating');
    try {
      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setBrief(json.brief);
      setPhase('brief');
    } catch {
      setError('Could not generate brief. Please contact directly with your details.');
      setPhase('brief');
      setBrief(
        `Summary:\n\nType: ${data.type ?? 'TBD'}\nSize: ${data.size ?? 'TBD'}\nBudget: ${data.budget ?? 'TBD'}\nTheme: ${data.theme ?? 'TBD'}\nInspiration: ${data.insp ?? 'TBD'}`
      );
    }
  };

  const renderStep = () => {
    if (current.type === 'p2') {
      const opts = current.options as string[];
      return (
        <div className={qStyles.grid2}>
          {opts.map((o) => (
            <button
              key={o}
              className={`${qStyles.pick} ${data[current.key] === o ? qStyles.selected : ''}`}
              onClick={() => setField(current.key, o)}
            >
              {o}
            </button>
          ))}
        </div>
      );
    }
    if (current.type === 'p3') {
      const opts = current.options as { label: string; sub: string }[];
      return (
        <div className={qStyles.grid3}>
          {opts.map((o) => (
            <button
              key={o.label}
              className={`${qStyles.pick} ${data[current.key] === o.label ? qStyles.selected : ''}`}
              onClick={() => setField(current.key, o.label)}
            >
              {o.label}
              <small>{o.sub}</small>
            </button>
          ))}
        </div>
      );
    }
    if (current.type === 'textarea') {
      return (
        <div className={styles.field}>
          <textarea
            rows={4}
            placeholder={current.placeholder}
            value={(data[current.key] as string) ?? ''}
            onChange={(e) => setField(current.key, e.target.value)}
          />
        </div>
      );
    }
    if (current.type === 'contact') {
      return (
        <>
          <div className={styles.field}>
            <input
              type="text"
              placeholder="Your name"
              value={data.name ?? ''}
              onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className={styles.field}>
            <input
              type="email"
              placeholder="your@email.com"
              value={data.email ?? ''}
              onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
            />
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.light}`} style={{ maxWidth: '540px' }}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>

        <h2>Commission brief</h2>

        {phase === 'questions' && (
          <>
            <p className={styles.sub}>Step {step + 1} of {STEPS.length}</p>

            {/* Dots */}
            <div className={qStyles.dots}>
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`${qStyles.dot} ${i < step ? qStyles.done : i === step ? qStyles.current : ''}`}
                />
              ))}
            </div>

            {/* Question */}
            <div className={qStyles.question}>
              <label className={qStyles.qLabel}>{current.label}</label>
              {renderStep()}
            </div>

            {/* Navigation */}
            <div className={qStyles.nav}>
              {step > 0 ? (
                <button className={qStyles.back} onClick={handleBack}>← Back</button>
              ) : (
                <span />
              )}
              <button className={qStyles.next} onClick={handleNext}>
                {isLast ? 'Generate brief →' : 'Next →'}
              </button>
            </div>
          </>
        )}

        {phase === 'generating' && (
          <div className={qStyles.generating}>
            <div className={qStyles.spinner} />
            <p>Crafting your creative brief with AI…</p>
          </div>
        )}

        {phase === 'brief' && (
          <div className={qStyles.briefWrap}>
            {error && <p className={styles.errorMsg}>{error}</p>}
            <div className={qStyles.briefLabel}>Your creative brief</div>
            <div className={qStyles.briefText}>{brief}</div>
            <div className={qStyles.briefActions}>
              <button className={qStyles.btnDone} onClick={onClose}>Done — I'll be in touch</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
