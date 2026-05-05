'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Artwork } from '@/lib/types';
import Nav from './Nav';
import ContactModal from './ContactModal';
import CommissionQuestionnaire from './CommissionQuestionnaire';
import styles from './ArtworkDetail.module.css';
import pageStyles from './ArtPage.module.css';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  available:   { label: 'Available for sale', cls: styles.available },
  sold:        { label: 'Sold',               cls: styles.sold },
  'in-progress': { label: 'Work in progress', cls: styles.inProgress },
};

interface Props { artwork: Artwork; }

export default function ArtworkDetailPage({ artwork }: Props) {
  const [contactOpen, setContactOpen] = useState(false);
  const [commissionOpen, setCommissionOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const statusInfo = STATUS_MAP[artwork.status];

  // Use image_url if available, otherwise gradient placeholder (3 fake thumbnails)
  const hasRealImage = !!artwork.image_url;

  return (
    <div className={pageStyles.root}>
      <Nav
        onContactOpen={() => setContactOpen(true)}
        onCommissionOpen={() => setCommissionOpen(true)}
      />
      <main className={pageStyles.main}>
        <div className={styles.inner}>
          <Link href="/" className={styles.back}>← Back to gallery</Link>

          <div className={styles.layout}>
            {/* Left — image */}
            <div>
              <div className={styles.mainImg}>
                {hasRealImage ? (
                  <Image
                    src={artwork.image_url!}
                    alt={artwork.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={styles.img}
                    priority
                  />
                ) : (
                  <div
                    className={styles.imgPlaceholder}
                    style={{ background: artwork.gradient_bg ?? '#EDEAE2' }}
                  />
                )}
              </div>
              {/* Thumbnails — show real thumbs if available, else gradient swatches */}
              <div className={styles.thumbs}>
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${activeImg === i ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImg(i)}
                    aria-label={`View ${i === 0 ? 'main' : 'detail ' + i}`}
                  >
                    <div
                      className={styles.thumbInner}
                      style={{ background: artwork.gradient_bg ?? '#EDEAE2' }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right — details */}
            <div>
              <div className={styles.eyebrow}>
                {artwork.theme.charAt(0).toUpperCase() + artwork.theme.slice(1)} · {artwork.year}
              </div>
              <h1 className={styles.title}>{artwork.title}</h1>
              <p className={styles.meta}>{artwork.medium} · {artwork.dimensions}</p>

              <div className={styles.statusRow}>
                <span className={`${styles.badge} ${statusInfo.cls}`}>{statusInfo.label}</span>
              </div>

              {artwork.description && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>About this piece</div>
                  <p className={styles.sectionText}>{artwork.description}</p>
                </div>
              )}

              {artwork.inspiration && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>Inspiration</div>
                  <p className={styles.sectionText}>{artwork.inspiration}</p>
                </div>
              )}

              {artwork.process && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>Process</div>
                  <p className={styles.sectionText}>{artwork.process}</p>
                </div>
              )}

              <div className={styles.ctaRow}>
                {artwork.status === 'available' ? (
                  <>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => setContactOpen(true)}
                    >
                      Enquire to buy
                    </button>
                    <button
                      className={styles.btnSecondary}
                      onClick={() => setCommissionOpen(true)}
                    >
                      Commission similar
                    </button>
                  </>
                ) : (
                  <button
                    className={styles.btnPrimary}
                    onClick={() => setCommissionOpen(true)}
                  >
                    Commission a similar piece
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ContactModal
        open={contactOpen}
        defaultReason="art-buy"
        onClose={() => setContactOpen(false)}
      />
      <CommissionQuestionnaire
        open={commissionOpen}
        onClose={() => setCommissionOpen(false)}
      />
    </div>
  );
}
