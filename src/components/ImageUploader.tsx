'use client';

// ─────────────────────────────────────────────────────────────────
// ImageUploader.tsx
//
// Drop this component anywhere you need to upload/replace/remove
// an artwork image. It talks to /api/artworks/upload.
//
// Usage:
//   <ImageUploader artworkId="warm-light" currentImageUrl={artwork.image_url} />
// ─────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react';
import Image from 'next/image';
import styles from './ImageUploader.module.css';

interface Props {
  artworkId: string;
  artworkTitle?: string;
  currentImageUrl?: string | null;
  onSuccess?: (newUrl: string) => void;
}

export default function ImageUploader({
  artworkId,
  artworkTitle,
  currentImageUrl,
  onSuccess,
}: Props) {
  const [imageUrl, setImageUrl]     = useState<string | null>(currentImageUrl ?? null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [file, setFile]             = useState<File | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [status, setStatus]         = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg]     = useState('');
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── File selection ────────────────────────────────────────────
  const handleFile = (f: File) => {
    // Validate type
    if (!f.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (JPG, PNG, WebP).');
      return;
    }
    // Validate size — 8MB max
    if (f.size > 8 * 1024 * 1024) {
      setErrorMsg('File is too large. Maximum size is 8MB.');
      return;
    }
    setFile(f);
    setErrorMsg('');
    setStatus('idle');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // ── Drag and drop ─────────────────────────────────────────────
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()                    => setDragging(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ── Upload ────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('artworkId', artworkId);

      const res = await fetch('/api/artworks/upload', {
        method : 'POST',
        body   : formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? 'Upload failed');
      }

      setImageUrl(json.publicUrl);
      setUploadedFilename(json.filename);
      setPreview(null);
      setFile(null);
      setStatus('success');
      onSuccess?.(json.publicUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  // ── Remove ────────────────────────────────────────────────────
  const handleRemove = async () => {
    if (!uploadedFilename && !imageUrl) return;

    // Extract filename from URL if we don't have it stored
    const filename = uploadedFilename
      ?? imageUrl?.split('/').pop()
      ?? null;

    if (!filename) return;

    const confirmed = window.confirm(
      'Remove this image? The artwork will show its placeholder colour instead.'
    );
    if (!confirmed) return;

    setStatus('uploading');
    try {
      const res = await fetch('/api/artworks/upload', {
        method  : 'DELETE',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ artworkId, filename }),
      });
      if (!res.ok) throw new Error('Remove failed');
      setImageUrl(null);
      setUploadedFilename(null);
      setStatus('idle');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Remove failed';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  const cancelPreview = () => {
    setPreview(null);
    setFile(null);
    setStatus('idle');
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrap}>

      {/* Artwork label */}
      {artworkTitle && (
        <div className={styles.artworkLabel}>{artworkTitle}</div>
      )}

      {/* ── Preview of file chosen but not yet uploaded ── */}
      {preview && (
        <div className={styles.previewWrap}>
          <div className={styles.previewImg}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className={styles.img} />
            <div className={styles.previewBadge}>Preview — not yet saved</div>
          </div>
          <div className={styles.previewActions}>
            <button
              className={styles.btnUpload}
              onClick={handleUpload}
              disabled={status === 'uploading'}
            >
              {status === 'uploading' ? (
                <><span className={styles.spinner} /> Uploading…</>
              ) : (
                'Upload image →'
              )}
            </button>
            <button className={styles.btnCancel} onClick={cancelPreview}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Current saved image ── */}
      {!preview && imageUrl && (
        <div className={styles.currentWrap}>
          <div className={styles.currentImg}>
            <Image
              src={imageUrl}
              alt={artworkTitle ?? 'Artwork image'}
              fill
              sizes="400px"
              className={styles.img}
            />
            {status === 'success' && (
              <div className={styles.successBadge}>✓ Uploaded</div>
            )}
          </div>
          <div className={styles.currentActions}>
            <button
              className={styles.btnReplace}
              onClick={() => inputRef.current?.click()}
            >
              Replace image
            </button>
            <button
              className={styles.btnRemove}
              onClick={handleRemove}
              disabled={status === 'uploading'}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* ── Drop zone — shown when no image and no preview ── */}
      {!preview && !imageUrl && (
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className={styles.dropIcon}>↑</div>
          <p className={styles.dropText}>Drop image here or <span>browse</span></p>
          <p className={styles.dropHint}>JPG, PNG or WebP · max 8MB · ideal ratio 3:4</p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={styles.hiddenInput}
        onChange={onInputChange}
      />

      {/* Error message */}
      {errorMsg && (
        <p className={styles.error}>{errorMsg}</p>
      )}
    </div>
  );
}
