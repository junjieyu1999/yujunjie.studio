'use client';

// ─────────────────────────────────────────────────────────────────
// ClientEnquiry.tsx
//
// A flexible communications component that adapts to different
// client contact scenarios. Rather than one generic form, each
// "enquiry type" has its own fields, copy, and AI context.
//
// HOW TO ADD A NEW ENQUIRY TYPE:
//   1. Add a new key to the ENQUIRY_TYPES object below
//   2. Define: label, description, fields[], aiContext (optional)
//   3. Use it: <ClientEnquiry type="your-new-key" />
//
// HOW TO USE IN A PAGE:
//   import ClientEnquiry from '@/components/ClientEnquiry';
//   <ClientEnquiry type="commission-followup" clientName="Sarah" />
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react';
import styles from './ClientEnquiry.module.css';

// ── Field definition ──────────────────────────────────────────────
type FieldType = 'text' | 'email' | 'textarea' | 'select' | 'date';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];       // for 'select' type
  required?: boolean;
  hint?: string;            // shown below the field in small text
}

// ── Enquiry type definition ───────────────────────────────────────
interface EnquiryType {
  label: string;            // shown in the modal header
  description: string;      // shown below the header
  submitLabel?: string;     // button text — defaults to "Send →"
  fields: FieldDef[];
  aiSummary?: boolean;      // if true, sends to /api/generate-brief for AI processing
}

// ─────────────────────────────────────────────────────────────────
// ENQUIRY TYPES — edit this object to customise all form types
//
// To duplicate / rename a type, just copy a block and change the key.
// ─────────────────────────────────────────────────────────────────
const ENQUIRY_TYPES: Record<string, EnquiryType> = {

  // ── 1. General contact ──────────────────────────────────────────
  general: {
    label: 'Get in touch',
    description: "Fill in the form and I'll get back to you within 48 hours.",
    fields: [
      { key: 'name',    label: 'Your name',  type: 'text',  placeholder: 'Jane Smith',           required: true },
      { key: 'email',   label: 'Email',       type: 'email', placeholder: 'jane@example.com',     required: true },
      { key: 'reason',  label: 'Reason',      type: 'select',
        options: ['Purchasing a work', 'Commission enquiry', 'Collaboration', 'Press / Media', 'Other'],
        required: false },
      { key: 'message', label: 'Message',     type: 'textarea', placeholder: 'Tell me more…',    required: false },
    ],
  },

  // ── 2. Purchase enquiry (for a specific artwork) ─────────────────
  'purchase-enquiry': {
    label: 'Enquire to purchase',
    description: 'Share your details and any questions. Pricing and shipping will be confirmed by email.',
    submitLabel: 'Send enquiry →',
    fields: [
      { key: 'name',     label: 'Your name',     type: 'text',  placeholder: 'Jane Smith',       required: true  },
      { key: 'email',    label: 'Email',          type: 'email', placeholder: 'jane@example.com', required: true  },
      { key: 'location', label: 'Your location',  type: 'text',  placeholder: 'Singapore, SG',
        hint: 'Helps with shipping estimate' },
      { key: 'message',  label: 'Any questions?', type: 'textarea', placeholder: 'e.g. Is a payment plan possible? Do you ship internationally?', required: false },
    ],
  },

  // ── 3. Commission follow-up (after the AI brief is generated) ────
  'commission-followup': {
    label: 'Confirm your commission',
    description: 'Your brief has been generated. Add any final notes before I begin.',
    submitLabel: 'Confirm commission →',
    fields: [
      { key: 'name',       label: 'Your name',       type: 'text',     placeholder: 'Jane Smith',         required: true },
      { key: 'email',      label: 'Email',            type: 'email',    placeholder: 'jane@example.com',   required: true },
      { key: 'phone',      label: 'WhatsApp / Phone', type: 'text',     placeholder: '+65 9000 0000',
        hint: 'Optional — for progress updates' },
      { key: 'deadline',   label: 'Do you need it by a specific date?', type: 'date',
        hint: 'Leave blank if there is no deadline' },
      { key: 'dedication', label: 'Dedication or inscription',          type: 'text',
        placeholder: 'e.g. "For Dad, with love"',
        hint: 'Optional — added to the back of the canvas' },
      { key: 'notes',      label: 'Any final notes?', type: 'textarea', placeholder: 'Anything not covered in the brief…' },
    ],
  },

  // ── 4. Collector / repeat client ─────────────────────────────────
  'collector': {
    label: 'Collector enquiry',
    description: 'For existing collectors — availability updates, upcoming work, and first-refusal requests.',
    submitLabel: 'Send →',
    fields: [
      { key: 'name',      label: 'Your name',   type: 'text',     placeholder: 'Jane Smith',         required: true },
      { key: 'email',     label: 'Email',        type: 'email',    placeholder: 'jane@example.com',   required: true },
      { key: 'interest',  label: "I'm interested in", type: 'select',
        options: ['First refusal on upcoming work', 'A specific subject (portrait/landscape)', 'Anything in a particular palette', 'Adding to an existing series'],
        required: false },
      { key: 'notes',     label: 'Details',     type: 'textarea', placeholder: 'Tell me what you are looking for…' },
    ],
  },

  // ── 5. Press / exhibition ─────────────────────────────────────────
  'press': {
    label: 'Press & exhibition',
    description: 'Media enquiries, exhibition proposals, and reproduction requests.',
    submitLabel: 'Send →',
    fields: [
      { key: 'name',         label: 'Your name',       type: 'text',     placeholder: 'Jane Smith',         required: true },
      { key: 'organisation', label: 'Organisation',    type: 'text',     placeholder: 'Publication / Gallery name' },
      { key: 'email',        label: 'Email',           type: 'email',    placeholder: 'jane@example.com',   required: true },
      { key: 'type',         label: 'Type of enquiry', type: 'select',
        options: ['Interview / Feature', 'Exhibition proposal', 'Reproduction / licensing', 'Other'],
        required: true },
      { key: 'message',      label: 'Details',         type: 'textarea', placeholder: 'Outline your proposal…', required: true },
    ],
  },

};

// ─────────────────────────────────────────────────────────────────
// Component props
// ─────────────────────────────────────────────────────────────────
interface Props {
  type?: keyof typeof ENQUIRY_TYPES;   // defaults to 'general'
  artworkTitle?: string;               // pre-fills context for purchase/commission
  clientName?: string;                 // pre-fills name field if known
  onSuccess?: () => void;
  onClose?: () => void;
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────
export default function ClientEnquiry({
  type = 'general',
  artworkTitle,
  clientName,
  onSuccess,
  onClose,
}: Props) {
  const config = ENQUIRY_TYPES[type] ?? ENQUIRY_TYPES['general'];

  // Build initial form state from field definitions
  const initialValues = Object.fromEntries(
    config.fields.map((f) => [f.key, f.key === 'name' ? (clientName ?? '') : ''])
  );

  const [values, setValues]   = useState<Record<string, string>>(initialValues);
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg]   = useState('');

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  const handleSubmit = async () => {
    // Validate required fields
    const missing = config.fields.filter((f) => f.required && !values[f.key]?.trim());
    if (missing.length > 0) {
      setErrMsg(`Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }

    setStatus('loading');
    setErrMsg('');

    try {
      const payload = {
        ...values,
        enquiry_type  : type,
        artwork_title : artworkTitle ?? null,
        reason        : values.reason ?? type,
        message       : values.message ?? values.notes ?? '',
      };

      const res = await fetch('/api/contacts', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Server error');

      setStatus('success');
      onSuccess?.();
    } catch {
      setStatus('error');
      setErrMsg('Something went wrong. Please try again or email directly.');
    }
  };

  // ── Success state ───────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>✓</div>
        <h3>Message sent</h3>
        <p>I'll get back to you within 48 hours.</p>
        {onClose && (
          <button className={styles.btnDone} onClick={onClose}>Done</button>
        )}
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────
  return (
    <div className={styles.form}>
      <div className={styles.header}>
        <h2 className={styles.title}>{config.label}</h2>
        {artworkTitle && (
          <div className={styles.artworkPill}>{artworkTitle}</div>
        )}
        <p className={styles.desc}>{config.description}</p>
      </div>

      <div className={styles.fields}>
        {config.fields.map((field) => (
          <div key={field.key} className={styles.field}>
            <label className={styles.label}>
              {field.label}
              {field.required && <span className={styles.req}>*</span>}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                className={styles.input}
                rows={4}
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onChange={set(field.key)}
              />
            ) : field.type === 'select' ? (
              <select
                className={styles.input}
                value={values[field.key] ?? ''}
                onChange={set(field.key)}
              >
                <option value="">Select…</option>
                {field.options?.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                className={styles.input}
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onChange={set(field.key)}
              />
            )}

            {field.hint && (
              <span className={styles.hint}>{field.hint}</span>
            )}
          </div>
        ))}
      </div>

      {errMsg && <p className={styles.error}>{errMsg}</p>}

      <button
        className={styles.submit}
        onClick={handleSubmit}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Sending…' : (config.submitLabel ?? 'Send →')}
      </button>
    </div>
  );
}
