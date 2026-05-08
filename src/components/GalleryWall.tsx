'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Artwork, FilterValue } from '@/lib/types';
import styles from './GalleryWall.module.css';

// Vertical hang positions — paintings at slightly different heights
// like a real gallery curated wall hang
const HANG_OFFSETS = [0, -32, 16, -48, 8, -24, 40, -16, 24, -40];

const STATUS_LABEL: Record<string, string> = {
  available   : 'Available',
  sold        : 'Sold',
  'in-progress': 'In Progress',
};

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All works',   value: 'all' },
  { label: 'Portraits',   value: 'portrait' },
  { label: 'Landscapes',  value: 'landscape' },
  { label: 'Available',   value: 'available' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Sold',        value: 'sold' },
];

interface Props {
  artworks: Artwork[];
  onCommissionOpen: () => void;
  onContactOpen: (reason?: string) => void;
}

export default function GalleryWall({ artworks, onCommissionOpen, onContactOpen }: Props) {
  const router        = useRouter();
  const trackRef      = useRef<HTMLDivElement>(null);
  const [filter,      setFilter]      = useState<FilterValue>('all');
  const [dragging,    setDragging]    = useState(false);
  const [dragStart,   setDragStart]   = useState({ x: 0, scrollLeft: 0 });
  const [hasDragged,  setHasDragged]  = useState(false);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(true);

  // Tilt state per painting: { dx, dy } normalised -1..1
  const [tilts, setTilts] = useState<Record<string, { x: number; y: number }>>({});

  // Hide the drag hint after first interaction
  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const displayed = filter === 'all'
    ? artworks
    : artworks.filter((a) => a.status === filter || a.theme === filter);

  // ── Drag to scroll ──────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    setDragging(true);
    setHasDragged(false);
    setDragStart({ x: e.pageX, scrollLeft: trackRef.current.scrollLeft });
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !trackRef.current) return;
    const dx = e.pageX - dragStart.x;
    if (Math.abs(dx) > 4) setHasDragged(true);
    trackRef.current.scrollLeft = dragStart.scrollLeft - dx;
  }, [dragging, dragStart]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Touch drag
  const touchStart = useRef({ x: 0, scrollLeft: 0 });
  const onTouchStart = (e: React.TouchEvent) => {
    if (!trackRef.current) return;
    touchStart.current = { x: e.touches[0].clientX, scrollLeft: trackRef.current.scrollLeft };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!trackRef.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    trackRef.current.scrollLeft = touchStart.current.scrollLeft - dx;
  };

  // ── Painting tilt on mouse move ─────────────────────────────
  const onPaintingMouseMove = (e: React.MouseEvent, id: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    setTilts((prev) => ({ ...prev, [id]: { x, y } }));
  };

  const onPaintingMouseLeave = (id: string) => {
    setTilts((prev) => ({ ...prev, [id]: { x: 0, y: 0 } }));
  };

  // ── Click: expand then navigate ────────────────────────────
  const handleClick = (artwork: Artwork) => {
    if (hasDragged) return; // drag ≠ click
    setExpandingId(artwork.id);
    setTimeout(() => {
      router.push(`/art/${artwork.id}`);
    }, 480);
  };

  return (
    <div className={styles.wrap}>

      {/* ── Hero text ── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.eyebrow}>Oil on Canvas · Singapore</div>
          <h1 className={styles.heading}>
            Portraits<br />&amp;<br /><em>Landscapes</em>
          </h1>
        </div>
        <div className={styles.heroRight}>
          <p className={styles.heroDesc}>
            Every painting begins with observation — the quality of light on a face,
            the weight of a horizon. Walk through the gallery and find the work that stays with you.
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.btnPrimary} onClick={onCommissionOpen}>
              Commission a piece
            </button>
            <button className={styles.btnSecondary} onClick={() => onContactOpen('art-buy')}>
              Enquire to buy
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter strip ── */}
      <div className={styles.filterStrip}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${filter === f.value ? styles.filterOn : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}

        {/* Drag hint */}
        <div className={`${styles.dragHint} ${!hintVisible ? styles.dragHintHidden : ''}`}>
          <span className={styles.dragArrow}>←</span>
          drag to walk
          <span className={styles.dragArrow}>→</span>
        </div>
      </div>

      {/* ── Gallery room ── */}
      <div className={styles.room}>

        {/* Wall surface */}
        <div className={styles.wall}>

          {/* Scrollable track */}
          <div
            ref={trackRef}
            className={`${styles.track} ${dragging ? styles.trackDragging : ''}`}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
          >
            {/* Left padding sentinel */}
            <div className={styles.trackPad} />

            {displayed.map((artwork, i) => {
              const tilt     = tilts[artwork.id] ?? { x: 0, y: 0 };
              const hangOff  = HANG_OFFSETS[i % HANG_OFFSETS.length];
              const expanding = expandingId === artwork.id;

              return (
                <div
                  key={artwork.id}
                  className={`${styles.paintingWrap} ${expanding ? styles.expanding : ''}`}
                  style={{ marginTop: `${120 + hangOff}px` }}
                  onClick={() => handleClick(artwork)}
                  onMouseMove={(e) => onPaintingMouseMove(e, artwork.id)}
                  onMouseLeave={() => onPaintingMouseLeave(artwork.id)}
                >
                  {/* Hanging wire */}
                  <div className={styles.wire} />

                  {/* Frame + painting */}
                  <div
                    className={styles.frame}
                    style={{
                      transform: `
                        perspective(800px)
                        rotateY(${tilt.x * 6}deg)
                        rotateX(${-tilt.y * 4}deg)
                        scale(${expanding ? 1.08 : 1})
                      `,
                    }}
                  >
                    {/* Gold frame border */}
                    <div className={styles.frameBorder}>
                      <div className={styles.canvas}>
                        {artwork.image_url ? (
                          <Image
                            src={artwork.image_url}
                            alt={artwork.title}
                            fill
                            sizes="280px"
                            className={styles.canvasImg}
                            draggable={false}
                          />
                        ) : (
                          <div
                            className={styles.canvasPlaceholder}
                            style={{ background: artwork.gradient_bg ?? '#EDEAE2' }}
                          />
                        )}

                        {/* Varnish sheen overlay */}
                        <div
                          className={styles.varnish}
                          style={{
                            background: `radial-gradient(
                              ellipse at ${50 + tilt.x * 30}% ${50 + tilt.y * 30}%,
                              rgba(255,255,255,0.12) 0%,
                              transparent 65%
                            )`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={`${styles.statusBadge} ${styles[artwork.status.replace('-','_')]}`}>
                      {STATUS_LABEL[artwork.status]}
                    </div>
                  </div>

                  {/* Label below painting */}
                  <div className={styles.label}>
                    <div className={styles.labelTitle}>{artwork.title}</div>
                    <div className={styles.labelMeta}>
                      {artwork.year} · {artwork.medium}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Right padding sentinel */}
            <div className={styles.trackPad} />
          </div>

          {/* Floor */}
          <div className={styles.floor}>
            <div className={styles.floorLine} />
            <div className={styles.floorShadow} />
          </div>
        </div>

        {/* Edge fade gradients */}
        <div className={styles.fadeLeft}  />
        <div className={styles.fadeRight} />
      </div>

      {/* ── Bottom CTA ── */}
      <div className={styles.bottomCta}>
        <div>
          <h3 className={styles.ctaTitle}>Not sure what you want?</h3>
          <p className={styles.ctaBody}>
            Take the commission questionnaire — a short set of questions that helps you
            articulate your vision. I'll use your answers as a creative brief.
          </p>
        </div>
        <div className={styles.ctaBtns}>
          <button className={styles.btnPrimary} onClick={onCommissionOpen}>
            Start questionnaire
          </button>
          <button className={styles.btnSecondary} onClick={() => onContactOpen('art-buy')}>
            Enquire to buy
          </button>
        </div>
      </div>
    </div>
  );
}
