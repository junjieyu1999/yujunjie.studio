'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Artwork, FilterValue } from '@/lib/types';
import styles from './Gallery3D.module.css';

const SPACING  = 680;
const WALL_X   = 430;
const CANVAS_W = 340;
const LERP     = 0.065;

const Y_OFFSETS = [0, -25, 20, -35, 10, -18, 30, -8, -28, 15];

const TESTIMONIALS = [
  {
    quote: "the work is genuinely so beautiful — you’re very talented and thoughtful, and the attention to detail is actually crazy. you can really feel the care and intention behind it, which makes it feel super personal and meaningful. honestly, you have such a good eye 🥹✨ and i’m always left wanting more of your art",
    name: "Estefanía Fernández Pokou",
    context: "Commission · Watercolour · 2025",
  },
  {
    quote: "Add your second review here. Perhaps share how the piece has transformed your space or the reactions it draws from guests.",
    name: "Collector Name",
    context: "Collected · Landscape · 2023",
  },
  {
    quote: "Add your third review here. You might speak to the artist's process, communication style, or the final result.",
    name: "Collector Name",
    context: "Commission · Portrait · 2025",
  },
];

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
  const roomRef      = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);

  const walkTarget   = useRef(0);
  const walkCurrent  = useRef(0);
  const lookTarget   = useRef(0);
  const lookCurrent  = useRef(0);

  const [filter,        setFilter]        = useState<FilterValue>('all');
  const [hoveredId,     setHoveredId]     = useState<string | null>(null);
  const [hoveredIsLeft, setHoveredIsLeft] = useState<boolean>(true);
  const [autoId,        setAutoId]        = useState<string | null>(null);
  const [autoIsLeft,    setAutoIsLeft]    = useState<boolean>(true);
  const [expandingId,   setExpandingId]   = useState<string | null>(null);
  const [hint,          setHint]          = useState(true);
  const [atEnd,         setAtEnd]         = useState(false);
  const [reviewIdx,     setReviewIdx]     = useState(0);
  const atEndRef  = useRef(false);
  const autoIdRef = useRef<string | null>(null);

  const displayed = filter === 'all'
    ? artworks
    : artworks.filter(a => a.status === filter || a.theme === filter);

  const stations = Math.ceil(displayed.length / 2);
  const maxWalk  = Math.max(0, stations * SPACING - 200);

  const panelId      = hoveredId ?? autoId;
  const panelIsLeft  = hoveredId ? hoveredIsLeft : autoIsLeft;
  const hoveredArtwork = panelId ? displayed.find(a => a.id === panelId) ?? null : null;

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    walkTarget.current  = 0;
    walkCurrent.current = 0;
    lookCurrent.current = 0;
    lookTarget.current  = 0;
    autoIdRef.current   = null;
    setAutoId(null);
  }, [filter]);

  // Scroll to walk
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

  // Keyboard walk
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

  // Touch walk
  const touchStartY = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchMove  = (e: React.TouchEvent) => {
    const dy = touchStartY.current - e.touches[0].clientY;
    walkTarget.current = Math.max(0, Math.min(maxWalk, walkTarget.current + dy * 1.8));
    touchStartY.current = e.touches[0].clientY;
  };

  // Mouse look
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const cx = (e.currentTarget as HTMLElement).getBoundingClientRect().width / 2;
    lookTarget.current = ((e.clientX - cx) / cx) * 5;
  }, []);
  const onMouseLeave = useCallback(() => { lookTarget.current = 0; }, []);

  const PROXIMITY = 460;

  // RAF loop
  useEffect(() => {
    const animate = () => {
      walkCurrent.current += (walkTarget.current - walkCurrent.current) * LERP;
      lookCurrent.current += (lookTarget.current - lookCurrent.current) * LERP;
      if (sceneRef.current) {
        sceneRef.current.style.transform =
          `translateZ(${walkCurrent.current}px) rotateY(${lookCurrent.current}deg)`;
      }
      if (progressRef.current && maxWalk > 0) {
        progressRef.current.style.width = `${(walkCurrent.current / maxWalk) * 100}%`;
      }
      if (roomRef.current && maxWalk > 0) {
        const progress = Math.min(walkCurrent.current / maxWalk, 1);
        const scale = 1 + progress * 1.8;
        roomRef.current.style.transform = `scale(${scale})`;
      }
      const nearEnd = maxWalk > 0 && walkCurrent.current >= maxWalk - 60;
      if (nearEnd !== atEndRef.current) {
        atEndRef.current = nearEnd;
        setAtEnd(nearEnd);
      }

      // Proximity-based popup: find the nearest painting within threshold
      let nearestId: string | null = null;
      let nearestIsLeft = true;
      let nearestDist = Infinity;
      displayed.forEach((artwork, i) => {
        const station = Math.floor(i / 2);
        const depth = -(station + 1) * SPACING;
        const effectiveZ = depth + walkCurrent.current;
        if (effectiveZ < 80 && effectiveZ > -PROXIMITY) {
          const dist = Math.abs(effectiveZ);
          if (dist < nearestDist) {
            nearestId = artwork.id;
            nearestDist = dist;
            nearestIsLeft = i % 2 === 0;
          }
        }
      });
      if (nearestId !== autoIdRef.current) {
        autoIdRef.current = nearestId;
        setAutoId(nearestId);
        if (nearestId !== null) setAutoIsLeft(nearestIsLeft);
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [maxWalk, displayed]);

  // Auto-advance carousel when reviews are visible
  useEffect(() => {
    if (!atEnd) return;
    const id = setInterval(() => {
      setReviewIdx(i => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [atEnd]);

  const handleClick = (artwork: Artwork) => {
    if (expandingId) return;
    setExpandingId(artwork.id);
    setTimeout(() => router.push(`/art/${artwork.id}`), 520);
  };

  // Position transform — places painting in the corridor
  const getPositionTransform = (i: number) => {
    const station = Math.floor(i / 2);
    const isLeft  = i % 2 === 0;
    const depth   = -(station + 1) * SPACING;
    const xOffset = isLeft ? -WALL_X : WALL_X;
    const yOffset = Y_OFFSETS[i % Y_OFFSETS.length];
    return { pos: `translate3d(${xOffset}px, ${yOffset}px, ${depth}px)`, isLeft };
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
      {/* Atmospheric room */}
      <div ref={roomRef} className={styles.room}>
        <div className={styles.ceilingShape}  />
        <div className={styles.floorShape}    />
        <div className={styles.wallLeft}      />
        <div className={styles.wallRight}     />
        <div className={styles.backWall}      />
        <div className={styles.ceilingGlow}   />
        <div className={styles.corridorLight} />
        <div className={styles.fogFar}        />
        <div className={styles.fogNear}       />
        <div className={styles.backWallCard}>
          <span className={styles.backWallQuote}>&ldquo;</span>
          <div className={styles.backWallLabel}>Collector<br />Reviews</div>
        </div>
      </div>

      {/* 3D scene */}
      <div className={styles.sceneWrap}>
        <div ref={sceneRef} className={styles.scene}>
          {displayed.map((artwork, i) => {
            const { pos, isLeft } = getPositionTransform(i);
            const isHovered   = hoveredId === artwork.id;
            const isExpanding = expandingId === artwork.id;

            return (
              <div
                key={artwork.id}
                className={styles.anchor}
                style={{ transform: pos }}
                onMouseEnter={() => { setHoveredId(artwork.id); setHoveredIsLeft(isLeft); }}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className={styles.hitTarget} />
                {/*
                  Rotator — this is the element that swings flat on hover.
                  Resting:  rotateY(85deg) or rotateY(-85deg) — nearly edge-on to viewer
                  Hovered:  rotateY(0deg) — fully flat, facing the viewer

                  The transition-origin is the edge touching the wall so it
                  swings out naturally like a door opening toward you.
                */}
                <div
                  className={`
                    ${styles.rotator}
                    ${isLeft  ? styles.rotatorLeft  : styles.rotatorRight}
                    ${isHovered   ? styles.rotatorFlat : ''}
                    ${isExpanding ? styles.expanding   : ''}
                  `}
                  onClick={() => handleClick(artwork)}
                >
                  <div className={`${styles.spotCone} ${isHovered ? styles.spotOn : ''}`} />

                  <div className={`${styles.frame} ${isHovered ? styles.frameHover : ''}`}>
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
                      <div className={`${styles.varnish} ${isHovered ? styles.varnishOn : ''}`} />
                    </div>
                    <div className={`${styles.statusDot} ${styles[artwork.status.replace('-','_')]}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info panel — appears on opposite side from the painting */}
      <div className={`
        ${styles.infoPanel}
        ${hoveredArtwork ? styles.infoPanelVisible : ''}
        ${panelIsLeft ? styles.infoPanelRight : styles.infoPanelLeft}
      `}>
        {hoveredArtwork && (
          <div className={styles.infoPanelInner}>
            <div className={styles.infoEyebrow}>{hoveredArtwork.theme}</div>
            <div className={styles.infoTitle}>{hoveredArtwork.title}</div>
            <div className={styles.infoDivider} />
            <div className={styles.infoMeta}>
              {hoveredArtwork.year} · {hoveredArtwork.medium}
            </div>
            <div className={styles.infoMeta}>{hoveredArtwork.dimensions}</div>
            <div className={`${styles.infoStatus} ${styles[hoveredArtwork.status.replace('-','_')]}`}>
              {hoveredArtwork.status === 'available' ? 'Available'
                : hoveredArtwork.status === 'sold' ? 'Sold' : 'In Progress'}
            </div>
            <div className={styles.infoCta}>Click to explore →</div>
          </div>
        )}
      </div>

      {/* Reviews overlay — appears when reaching end of gallery */}
      <div className={`${styles.reviewsOverlay} ${atEnd && filter === 'all' ? styles.reviewsVisible : ''}`}>
        <div className={styles.reviewsWrap}>
          <div className={styles.reviewsEyebrow}>What collectors say</div>
          <div key={reviewIdx} className={styles.reviewCard}>
            <div className={styles.reviewQuote}>
              &ldquo;{TESTIMONIALS[reviewIdx].quote}&rdquo;
            </div>
            <div className={styles.reviewAuthor}>{TESTIMONIALS[reviewIdx].name}</div>
            <div className={styles.reviewContext}>{TESTIMONIALS[reviewIdx].context}</div>
          </div>
          <div className={styles.reviewDots}>
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`${styles.reviewDot} ${i === reviewIdx ? styles.reviewDotActive : ''}`}
                onClick={() => setReviewIdx(i)}
              />
            ))}
          </div>
        </div>
        <div className={styles.reviewsBack}>↑ scroll back to explore</div>
      </div>

      {/* UI overlay */}
      <div className={styles.ui}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.eyebrow}>Oil on Canvas · Singapore</div>
            <h1 className={styles.heading}>Portraits &amp; <em>Landscapes</em></h1>
          </div>
        </div>

        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`${styles.filterBtn} ${filter === f.value ? styles.filterOn : ''}`}
              onClick={() => setFilter(f.value)}
            >{f.label}</button>
          ))}
          <span className={styles.workCount}>{displayed.length} works</span>
        </div>

        <div className={`${styles.walkHint} ${!hint ? styles.walkHintHidden : ''}`}>
          <span className={styles.hintArrow}>↑</span>
          scroll to walk · hover painting to reveal · click to enter
          <span className={styles.hintArrow}>↓</span>
        </div>

        {/* Reviews teaser — visible after initial hint fades, until user reaches end */}
        <div className={`${styles.reviewsTeaser} ${!hint && !atEnd && filter === 'all' ? styles.reviewsTeaserVisible : ''}`}>
          <span className={styles.reviewsTeaserQuote}>&ldquo;</span>
          <span className={styles.reviewsTeaserLabel}>Collector Reviews</span>
          <span className={styles.reviewsTeaserDivider}>·</span>
          <span className={styles.reviewsTeaserArrow}>scroll to end →</span>
        </div>

        <div className={styles.progressTrack}>
          <div ref={progressRef} className={styles.progressBar} />
          <div className={styles.progressEndMarker} />
        </div>
      </div>
    </div>
  );
}
