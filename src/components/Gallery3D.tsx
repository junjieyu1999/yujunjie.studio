'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Artwork, FilterValue } from '@/lib/types';
import styles from './Gallery3D.module.css';

// ── Room geometry constants ──────────────────────────────────────
const SPACING  = 680;   // Z gap between painting stations
const WALL_X   = 430;   // half-width of corridor (px)
const CANVAS_W = 250;   // painting canvas width (px)
const LERP     = 0.065; // camera smoothing — lower = more inertia

// Slight height variation per painting index
const Y_OFFSETS = [0, -25, 20, -35, 10, -18, 30, -8, -28, 15];

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All',         value: 'all' },
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

export default function Gallery3D({ artworks, onCommissionOpen, onContactOpen }: Props) {
  const router       = useRouter();
  const viewportRef  = useRef<HTMLDivElement>(null);
  const sceneRef     = useRef<HTMLDivElement>(null);
  const progressRef  = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);

  // Camera state (all in refs for RAF loop performance)
  const walkTarget   = useRef(0);
  const walkCurrent  = useRef(0);
  const lookTarget   = useRef(0);
  const lookCurrent  = useRef(0);

  const [filter,      setFilter]      = useState<FilterValue>('all');
  const [hoveredId,   setHoveredId]   = useState<string | null>(null);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [hint,        setHint]        = useState(true);

  const displayed = filter === 'all'
    ? artworks
    : artworks.filter(a => a.status === filter || a.theme === filter);

  const stations = Math.ceil(displayed.length / 2);
  const maxWalk  = Math.max(0, stations * SPACING - 200);

  const hoveredArtwork = hoveredId ? displayed.find(a => a.id === hoveredId) ?? null : null;

  // ── Hide hint after 5s ───────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // ── Reset walk on filter change ──────────────────────────────
  useEffect(() => {
    walkTarget.current  = 0;
    walkCurrent.current = 0;
    lookCurrent.current = 0;
    lookTarget.current  = 0;
  }, [filter]);

  // ── Scroll wheel to walk ─────────────────────────────────────
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      walkTarget.current = Math.max(0, Math.min(maxWalk, walkTarget.current + e.deltaY * 1.1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [maxWalk]);

  // ── Keyboard walk ────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const step = 160;
      if (['ArrowUp', 'ArrowRight', 'w', 'd'].includes(e.key))
        walkTarget.current = Math.min(maxWalk, walkTarget.current + step);
      if (['ArrowDown', 'ArrowLeft', 's', 'a'].includes(e.key))
        walkTarget.current = Math.max(0, walkTarget.current - step);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [maxWalk]);

  // ── Touch swipe to walk ──────────────────────────────────────
  const touchStartY = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dy = touchStartY.current - e.touches[0].clientY;
    walkTarget.current = Math.max(0, Math.min(maxWalk, walkTarget.current + dy * 1.8));
    touchStartY.current = e.touches[0].clientY;
  };

  // ── Mouse look (subtle head turn) ────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const cx = (e.currentTarget as HTMLElement).getBoundingClientRect().width / 2;
    lookTarget.current = ((e.clientX - cx) / cx) * 5; // ±5 degrees
  }, []);

  const onMouseLeave = useCallback(() => {
    lookTarget.current = 0;
  }, []);

  // ── RAF loop — smooth lerp camera ───────────────────────────
  useEffect(() => {
    const animate = () => {
      walkCurrent.current  += (walkTarget.current  - walkCurrent.current)  * LERP;
      lookCurrent.current  += (lookTarget.current  - lookCurrent.current)  * LERP;

      if (sceneRef.current) {
        sceneRef.current.style.transform =
          `translateZ(${walkCurrent.current}px) rotateY(${lookCurrent.current}deg)`;
      }
      if (progressRef.current && maxWalk > 0) {
        progressRef.current.style.width = `${(walkCurrent.current / maxWalk) * 100}%`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [maxWalk]);

  // ── Click painting → expand → navigate ──────────────────────
  const handleClick = (artwork: Artwork) => {
    if (expandingId) return;
    setExpandingId(artwork.id);
    setTimeout(() => router.push(`/art/${artwork.id}`), 520);
  };

  // ── 3D position for each painting ───────────────────────────
  const getPaintingTransform = (i: number) => {
    const station = Math.floor(i / 2);
    const isLeft  = i % 2 === 0;
    const depth   = -(station + 1) * SPACING;
    const xOffset = isLeft ? -WALL_X : WALL_X;
    const rotY    = isLeft ? 85 : -85;  // slightly less than 90 for readability
    const yOffset = Y_OFFSETS[i % Y_OFFSETS.length];
    return `translate3d(${xOffset}px, ${yOffset}px, ${depth}px) rotateY(${rotY}deg)`;
  };

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* ── Atmospheric room ── */}
      <div className={styles.room}>
        <div className={styles.floorGrid}  />
        <div className={styles.ceilingGlow} />
        <div className={styles.wallLeft}   />
        <div className={styles.wallRight}  />
        <div className={styles.fogFar}     />
        <div className={styles.fogNear}    />
        <div className={styles.centerLine} />
      </div>

      {/* ── 3D scene ── */}
      <div className={styles.sceneWrap}>
        <div ref={sceneRef} className={styles.scene}>
          {displayed.map((artwork, i) => (
            <div
              key={artwork.id}
              className={`${styles.anchor} ${expandingId === artwork.id ? styles.expanding : ''}`}
              style={{ transform: getPaintingTransform(i) }}
              onClick={() => handleClick(artwork)}
              onMouseEnter={() => setHoveredId(artwork.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Spot light cone above painting */}
              <div className={`${styles.spotCone} ${hoveredId === artwork.id ? styles.spotOn : ''}`} />

              {/* Gold frame */}
              <div className={`${styles.frame} ${hoveredId === artwork.id ? styles.frameHover : ''}`}>
                <div className={styles.canvas}>
                  {artwork.image_url ? (
                    <Image
                      src={artwork.image_url}
                      alt={artwork.title}
                      fill
                      sizes={`${CANVAS_W}px`}
                      className={styles.canvasImg}
                      draggable={false}
                    />
                  ) : (
                    <div
                      className={styles.canvasGrad}
                      style={{ background: artwork.gradient_bg ?? '#2A1E0E' }}
                    />
                  )}
                  {/* Varnish sheen */}
                  <div className={`${styles.varnish} ${hoveredId === artwork.id ? styles.varnishOn : ''}`} />
                </div>

                {/* Status dot */}
                <div className={`${styles.statusDot} ${styles[artwork.status.replace('-','_')]}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Artwork info panel — appears at bottom on hover ── */}
      <div className={`${styles.infoPanel} ${hoveredArtwork ? styles.infoPanelVisible : ''}`}>
        {hoveredArtwork && (
          <div className={styles.infoPanelInner}>
            <div className={styles.infoTitle}>{hoveredArtwork.title}</div>
            <div className={styles.infoMeta}>
              {hoveredArtwork.year} · {hoveredArtwork.medium} · {hoveredArtwork.dimensions}
            </div>
            <div className={`${styles.infoStatus} ${styles[hoveredArtwork.status.replace('-','_')]}`}>
              {hoveredArtwork.status === 'available' ? 'Available'
                : hoveredArtwork.status === 'sold' ? 'Sold'
                : 'In Progress'}
              {hoveredArtwork.status === 'available' && (
                <span className={styles.infoClick}>— click to enquire</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── UI overlay ── */}
      <div className={styles.ui}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.eyebrow}>Oil on Canvas · Singapore</div>
            <h1 className={styles.heading}>
              Portraits &amp; <em>Landscapes</em>
            </h1>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.btnPrimary} onClick={onCommissionOpen}>
              Commission a piece
            </button>
            <button className={styles.btnGhost} onClick={() => onContactOpen('art-buy')}>
              Enquire to buy
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`${styles.filterBtn} ${filter === f.value ? styles.filterOn : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
          <span className={styles.workCount}>{displayed.length} works</span>
        </div>

        {/* Walk hint */}
        <div className={`${styles.walkHint} ${!hint ? styles.walkHintHidden : ''}`}>
          <span className={styles.hintArrow}>↑</span>
          scroll to walk · hover to look · click to enter
          <span className={styles.hintArrow}>↓</span>
        </div>

        {/* Progress bar */}
        <div className={styles.progressTrack}>
          <div ref={progressRef} className={styles.progressBar} />
        </div>
      </div>
    </div>
  );
}
