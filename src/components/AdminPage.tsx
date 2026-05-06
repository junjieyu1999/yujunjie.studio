'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Artwork, ArtworkImage, ArtworkStatus } from '@/lib/types';
import styles from './AdminPage.module.css';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
type Tab  = 'details' | 'images';
type Mode = 'edit' | 'new';

type FormFields = {
  id          : string;
  title       : string;
  year        : string;
  medium      : string;
  dimensions  : string;
  status      : ArtworkStatus;
  theme       : 'portrait' | 'landscape';
  description : string;
  inspiration : string;
  process     : string;
  gradient_bg : string;
  sort_order  : string;
};

const BLANK: FormFields = {
  id: '', title: '', year: new Date().getFullYear().toString(),
  medium: 'Oil on canvas', dimensions: '',
  status: 'available', theme: 'portrait',
  description: '', inspiration: '', process: '',
  gradient_bg: 'linear-gradient(145deg,#C4A87A 0%,#8B6842 60%,#5C3D1E 100%)',
  sort_order: '0',
};

// The 3 named image slots
const IMAGE_SLOTS = [
  { key: 0, label: 'Cover photo',   hint: 'Main image shown on gallery grid' },
  { key: 1, label: 'Detail shot 1', hint: 'Close-up, texture, or process detail' },
  { key: 2, label: 'Detail shot 2', hint: 'Second detail or alternate angle' },
];

// ─────────────────────────────────────────────────────────────────
// Single image slot component
// ─────────────────────────────────────────────────────────────────
function ImageSlot({
  slot, image, artworkId, onUploaded, onDeleted,
}: {
  slot: typeof IMAGE_SLOTS[0];
  image: ArtworkImage | null;
  artworkId: string;
  onUploaded: (img: ArtworkImage) => void;
  onDeleted:  () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging,   setDragging]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState('');
  const [deleting,   setDeleting]   = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Image files only'); return; }
    if (file.size > 8 * 1024 * 1024)    { setError('Max 8 MB');           return; }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file',       file);
      fd.append('artworkId',  artworkId);
      fd.append('sortOrder',  String(slot.key));
      const res  = await fetch('/api/artworks/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      // Fetch the new artwork_images row to get the id/filename
      const imgsRes = await fetch(`/api/artworks/${artworkId}/images`);
      const data = await imgsRes.json();
      const imgs: ArtworkImage[] = Array.isArray(data) ? data : [];
      const match = imgs.find((i) => i.url === json.publicUrl) ?? imgs[imgs.length - 1];
      if (match) onUploaded(match);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!image) return;
    if (!window.confirm('Remove this image?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/artworks/${artworkId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: image.id, filename: image.filename }),
      });
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.slot}>
      <div className={styles.slotHeader}>
        <span className={styles.slotLabel}>{slot.label}</span>
        {slot.key === 0 && <span className={styles.slotCoverTag}>gallery cover</span>}
      </div>
      <span className={styles.slotHint}>{slot.hint}</span>

      {image ? (
        /* ── Filled slot ── */
        <div className={styles.slotFilled}>
          <div className={styles.slotImg}>
            <Image src={image.url} alt={slot.label} fill sizes="240px" className={styles.slotImgEl} />
          </div>
          <div className={styles.slotActions}>
            <button className={styles.slotReplace} onClick={() => inputRef.current?.click()}>
              Replace
            </button>
            <button className={styles.slotDelete} onClick={handleDelete} disabled={deleting}>
              {deleting ? '…' : 'Remove'}
            </button>
          </div>
        </div>
      ) : (
        /* ── Empty drop zone ── */
        <div
          className={`${styles.slotZone} ${dragging ? styles.slotZoneDrag : ''} ${uploading ? styles.slotZoneUploading : ''}`}
          onDragOver={(e)  => { e.preventDefault(); setDragging(true); }}
          onDragLeave={()  => setDragging(false)}
          onDrop={(e)      => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
          onClick={()      => !uploading && inputRef.current?.click()}
        >
          {uploading
            ? <><div className={styles.slotSpinner} /><span>Uploading…</span></>
            : <><span className={styles.slotZoneIcon}>↑</span><span>Drop or click to upload</span><span className={styles.slotZoneHint}>JPG · PNG · WebP · max 8MB</span></>
          }
        </div>
      )}

      {error && <p className={styles.slotError}>{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className={styles.hiddenInput}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main AdminPage
// ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [artworks,    setArtworks]    = useState<Artwork[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<Artwork | null>(null);
  const [images,      setImages]      = useState<ArtworkImage[]>([]);
  const [tab,         setTab]         = useState<Tab>('details');
  const [mode,        setMode]        = useState<Mode>('edit');
  const [form,        setForm]        = useState<FormFields>(BLANK);
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState('');
  const [saveErr,     setSaveErr]     = useState('');

  // ── Load artworks ──────────────────────────────────────────
  useEffect(() => {
    fetch('/api/artworks')
      .then((r) => r.json())
      .then((d) => { setArtworks(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Load images when artwork selected ─────────────────────
  useEffect(() => {
    if (!selected || mode === 'new') return;
    fetch(`/api/artworks/${selected.id}/images`)
      .then((r) => r.json())
      .then((d) => setImages(Array.isArray(d) ? d : []))
      .catch(() => setImages([]));
  }, [selected, mode]);

  // ── Select an artwork → populate form ─────────────────────
  const selectArtwork = (a: Artwork) => {
    setSelected(a);
    setMode('edit');
    setTab('details');
    setImages([]);
    setSaveMsg('');
    setSaveErr('');
    setForm({
      id          : a.id,
      title       : a.title,
      year        : a.year,
      medium      : a.medium,
      dimensions  : a.dimensions,
      status      : a.status,
      theme       : a.theme,
      description : a.description  ?? '',
      inspiration : a.inspiration  ?? '',
      process     : a.process      ?? '',
      gradient_bg : a.gradient_bg  ?? '',
      sort_order  : String(a.sort_order),
    });
  };

  const startNew = () => {
    setSelected(null);
    setMode('new');
    setTab('details');
    setImages([]);
    setForm(BLANK);
    setSaveMsg('');
    setSaveErr('');
  };

  const setField = (k: keyof FormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Save (create or update) ────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    setSaveErr('');
    try {
      if (mode === 'new') {
        const res  = await fetch('/api/artworks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) || 0 }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setArtworks((prev) => [...prev, json.artwork].sort((a,b) => a.sort_order - b.sort_order));
        setSelected(json.artwork);
        setMode('edit');
        setForm((f) => ({ ...f, id: json.artwork.id }));
        setSaveMsg('Artwork created — you can now add images.');
        setTab('images');
      } else if (selected) {
        const res  = await fetch('/api/artworks/upload', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selected.id,
            fields: {
              title: form.title, year: form.year, medium: form.medium,
              dimensions: form.dimensions, status: form.status, theme: form.theme,
              description: form.description || null, inspiration: form.inspiration || null,
              process: form.process || null, gradient_bg: form.gradient_bg || null,
              sort_order: Number(form.sort_order) || 0,
            },
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setArtworks((prev) => prev.map((a) => a.id === selected.id ? json.artwork : a));
        setSelected(json.artwork);
        setSaveMsg('Changes saved.');
      }
    } catch (e: unknown) {
      setSaveErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  // ── Image slot helpers ─────────────────────────────────────
  const imageAtSlot = (slotKey: number) =>
    images.find((img) => img.sort_order === slotKey) ?? null;

  const handleSlotUploaded = (img: ArtworkImage) => {
    setImages((prev) => {
      const next = prev.filter((i) => i.sort_order !== img.sort_order);
      return [...next, img].sort((a, b) => a.sort_order - b.sort_order);
    });
    if (img.sort_order === 0 && selected) {
      setArtworks((prev) => prev.map((a) => a.id === selected.id ? { ...a, image_url: img.url } : a));
    }
  };

  const handleSlotDeleted = (slotKey: number) => {
    setImages((prev) => prev.filter((i) => i.sort_order !== slotKey));
    if (slotKey === 0 && selected) {
      setArtworks((prev) => prev.map((a) => a.id === selected.id ? { ...a, image_url: null } : a));
    }
  };

  if (loading) return (
    <div className={styles.loading}><div className={styles.spinner} /><p>Loading…</p></div>
  );

  const showPanel = mode === 'new' || selected !== null;

  return (
    <div className={styles.root}>

      {/* ── Left sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <span className={styles.sidebarTitle}>Artworks</span>
          <button className={styles.newBtn} onClick={startNew}>+ New</button>
        </div>

        <div className={styles.artworkList}>
          {artworks.map((a) => (
            <button
              key={a.id}
              className={`${styles.artworkRow} ${selected?.id === a.id && mode === 'edit' ? styles.artworkRowActive : ''}`}
              onClick={() => selectArtwork(a)}
            >
              <div className={styles.rowThumb}>
                {a.image_url
                  ? <Image src={a.image_url} alt={a.title} fill sizes="40px" className={styles.rowThumbImg} />
                  : <div className={styles.rowThumbGrad} style={{ background: a.gradient_bg ?? '#EDEAE2' }} />
                }
              </div>
              <div className={styles.rowInfo}>
                <div className={styles.rowTitle}>{a.title}</div>
                <div className={styles.rowMeta}>{a.year} · <span className={`${styles.statusDot} ${styles[a.status.replace('-','_')]}`}>{a.status}</span></div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main panel ── */}
      <main className={styles.panel}>
        {!showPanel ? (
          <div className={styles.panelEmpty}>
            <p>Select an artwork or create a new one</p>
            <button className={styles.bigNewBtn} onClick={startNew}>+ Add new artwork</button>
          </div>
        ) : (
          <>
            {/* Panel header */}
            <div className={styles.panelHeader}>
              <div>
                <h1 className={styles.panelTitle}>
                  {mode === 'new' ? 'New artwork' : form.title || 'Untitled'}
                </h1>
                {mode === 'edit' && selected && (
                  <span className={styles.panelId}>/{selected.id}</span>
                )}
              </div>
              <div className={styles.panelHeaderActions}>
                {saveMsg && <span className={styles.saveMsg}>{saveMsg}</span>}
                {saveErr && <span className={styles.saveErr}>{saveErr}</span>}
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : mode === 'new' ? 'Create artwork →' : 'Save changes'}
                </button>
              </div>
            </div>

            {/* Tabs — only show Images tab after artwork exists */}
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${tab === 'details' ? styles.tabActive : ''}`} onClick={() => setTab('details')}>
                Details
              </button>
              <button
                className={`${styles.tab} ${tab === 'images' ? styles.tabActive : ''} ${mode === 'new' ? styles.tabDisabled : ''}`}
                onClick={() => mode !== 'new' && setTab('images')}
                title={mode === 'new' ? 'Save the artwork first to unlock images' : undefined}
              >
                Images {mode !== 'new' && images.length > 0 && <span className={styles.tabBadge}>{images.length}</span>}
                {mode === 'new' && <span className={styles.tabLock}>— save first</span>}
              </button>
            </div>

            {/* ── DETAILS TAB ── */}
            {tab === 'details' && (
              <div className={styles.detailsForm}>

                <div className={styles.formSection}>
                  <div className={styles.formSectionLabel}>Identity</div>
                  <div className={styles.formGrid2}>
                    <div className={styles.field}>
                      <label>
                        ID / slug <span className={styles.req}>*</span>
                        <span className={styles.fieldHint}>{mode === 'edit' ? 'Read-only after creation' : 'e.g. "warm-light-2024" — becomes the URL'}</span>
                      </label>
                      <input
                        type="text" value={form.id} onChange={setField('id')}
                        placeholder="warm-light-2024"
                        readOnly={mode === 'edit'}
                        className={mode === 'edit' ? styles.inputReadOnly : ''}
                      />
                    </div>
                    <div className={styles.field}>
                      <label>Title <span className={styles.req}>*</span></label>
                      <input type="text" value={form.title} onChange={setField('title')} placeholder="Study in Warm Light" />
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formSectionLabel}>Artwork details</div>
                  <div className={styles.formGrid3}>
                    <div className={styles.field}>
                      <label>Year <span className={styles.req}>*</span></label>
                      <input type="text" value={form.year} onChange={setField('year')} placeholder="2024" />
                    </div>
                    <div className={styles.field}>
                      <label>Medium <span className={styles.req}>*</span></label>
                      <input type="text" value={form.medium} onChange={setField('medium')} placeholder="Oil on canvas" />
                    </div>
                    <div className={styles.field}>
                      <label>Dimensions <span className={styles.req}>*</span></label>
                      <input type="text" value={form.dimensions} onChange={setField('dimensions')} placeholder="60×80cm" />
                    </div>
                  </div>
                  <div className={styles.formGrid3}>
                    <div className={styles.field}>
                      <label>Status</label>
                      <select value={form.status} onChange={setField('status')}>
                        <option value="available">Available</option>
                        <option value="in-progress">In Progress</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label>Theme</label>
                      <select value={form.theme} onChange={setField('theme')}>
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label>
                        Sort order
                        <span className={styles.fieldHint}>Lower = appears earlier in gallery</span>
                      </label>
                      <input type="number" value={form.sort_order} onChange={setField('sort_order')} min="0" />
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formSectionLabel}>Written content</div>
                  <div className={styles.field}>
                    <label>
                      About this piece
                      <span className={styles.fieldHint}>Shown on the artwork detail page</span>
                    </label>
                    <textarea rows={4} value={form.description} onChange={setField('description')}
                      placeholder="This piece began with a single observation…" />
                  </div>
                  <div className={styles.field}>
                    <label>
                      Inspiration
                      <span className={styles.fieldHint}>What prompted or influenced the work</span>
                    </label>
                    <textarea rows={4} value={form.inspiration} onChange={setField('inspiration')}
                      placeholder="Inspired by Singapore's late afternoon light…" />
                  </div>
                  <div className={styles.field}>
                    <label>
                      Process
                      <span className={styles.fieldHint}>How this painting was made</span>
                    </label>
                    <textarea rows={4} value={form.process} onChange={setField('process')}
                      placeholder="Started with a burnt sienna ground…" />
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formSectionLabel}>Appearance</div>
                  <div className={styles.field}>
                    <label>
                      Placeholder gradient
                      <span className={styles.fieldHint}>CSS gradient shown while image loads or if no image is uploaded</span>
                    </label>
                    <div className={styles.gradientRow}>
                      <input type="text" value={form.gradient_bg} onChange={setField('gradient_bg')}
                        placeholder="linear-gradient(145deg,#C4A87A 0%,#8B6842 60%,#5C3D1E 100%)" />
                      {form.gradient_bg && (
                        <div className={styles.gradientPreview} style={{ background: form.gradient_bg }} />
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ── IMAGES TAB ── */}
            {tab === 'images' && selected && (
              <div className={styles.imagesTab}>
                <p className={styles.imagesIntro}>
                  Upload up to 3 images per artwork. The <strong>Cover photo</strong> appears on the gallery grid. All three appear as thumbnails on the artwork detail page.
                </p>
                <div className={styles.slotsGrid}>
                  {IMAGE_SLOTS.map((slot) => (
                    <ImageSlot
                      key={slot.key}
                      slot={slot}
                      image={imageAtSlot(slot.key)}
                      artworkId={selected.id}
                      onUploaded={handleSlotUploaded}
                      onDeleted={() => handleSlotDeleted(slot.key)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
