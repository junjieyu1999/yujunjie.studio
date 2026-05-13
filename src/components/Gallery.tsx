'use client';

import { useState, useCallback } from 'react';
import type { Artwork, FilterValue } from '@/lib/types';
import ArtworkCard from './ArtworkCard';
import styles from './Gallery.module.css';

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All works', value: 'all' },
  { label: 'Portraits', value: 'portrait' },
  { label: 'Landscapes', value: 'landscape' },
  { label: 'Available', value: 'available' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Sold', value: 'sold' },
];

interface Props {
  artworks: Artwork[];
  onCommissionOpen: () => void;
  onContactOpen: (reason?: string) => void;
}

export default function Gallery({ artworks, onCommissionOpen, onContactOpen }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

  const filtered = useCallback(
    (f: FilterValue) =>
      f === 'all' ? artworks : artworks.filter((a) => a.status === f || a.theme === f),
    [artworks]
  );

  const displayed = filtered(activeFilter);

  return (
    <section className={styles.section}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.eyebrow}>Oil on Canvas · Singapore</div>
          <h1 className={styles.heading}>
            Portraits
            <br />&amp;
            <br /><em>Landscapes</em>
          </h1>
        </div>
        <div className={styles.heroRight}>
          <p className={styles.desc}>
            Every painting begins with observation — the quality of light on a face, the weight of a
            horizon. I work in oils, primarily in portraiture and landscape, each piece carrying its
            own narrative.
          </p>
          <div className={styles.ctaRow}>
            {/* <button className={styles.btnPrimary} onClick={onCommissionOpen}>
              Commission a piece
            </button>
            <button className={styles.btnSecondary} onClick={() => onContactOpen('art-buy')}>
              Enquire to buy
            </button> */}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filter} ${activeFilter === f.value ? styles.filterOn : ''}`}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {displayed.length === 0 ? (
        <div className={styles.empty}>No works match this filter.</div>
      ) : (
        <div className={styles.grid} key={activeFilter}>
          {displayed.map((artwork, i) => (
            <ArtworkCard key={artwork.id} artwork={artwork} index={i} />
          ))}
        </div>
      )}

      {/* ── Bottom CTA ── */}
      <div className={styles.bottomCta}>
        <div>
          <h3 className={styles.ctaTitle}>Not sure what you want?</h3>
          <p className={styles.ctaBody}>
            Take the commission questionnaire — a short set of questions that helps you articulate
            your vision. I'll use your answers as a creative brief.
          </p>
        </div>
        <div className={styles.ctaButtons}>
          <button className={styles.btnPrimary} onClick={onCommissionOpen}>
            Start questionnaire
          </button>
          <button className={styles.btnSecondary} onClick={() => onContactOpen('art-buy')}>
            Enquire to buy
          </button>
        </div>
      </div>
    </section>
  );
}
