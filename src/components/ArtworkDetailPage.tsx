'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Artwork, ArtworkImage } from '@/lib/types';
import Nav from './Nav';
import ContactModal from './ContactModal';
import CommissionQuestionnaire from './CommissionQuestionnaire';
import styles from './ArtworkDetail.module.css';
import pageStyles from './ArtPage.module.css';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  available     : { label: 'Available for sale', cls: styles.available },
  sold          : { label: 'Sold',               cls: styles.sold },
  'in-progress' : { label: 'Work in progress',   cls: styles.inProgress },
};

interface Props { artwork: Artwork; }

export default function ArtworkDetailPage({ artwork }: Props) {
  const [contactOpen,    setContactOpen]    = useState(false);
  const [commissionOpen, setCommissionOpen] = useState(false);
  const [images,         setImages]         = useState<ArtworkImage[]>([]);
  const [activeIdx,      setActiveIdx]      = useState(0);
  const [imgsLoading,    setImgsLoading]    = useState(true);

  const statusInfo = STATUS_MAP[artwork.status];

  useEffect(() => {
    fetch(`/api/artworks/${artwork.id}/images`)
      .then((r) => r.json())
      .then((data: ArtworkImage[]) => {
        setImages(data);
        setImgsLoading(false);
      })
      .catch(() => setImgsLoading(false));
  }, [artwork.id]);

  const activeImage = images[activeIdx] ?? null;
  const mainSrc     = activeImage?.url ?? artwork.image_url ?? null;

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
            {/* Left: image viewer */}
            <div className={styles.imageCol}>
              <div className={styles.mainImg}>
                {mainSrc ? (
                  <Image
                    key={mainSrc}
                    src={mainSrc}
                    alt={activeImage?.caption ?? artwork.title}
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
                {images.length > 1 && (
                  <div className={styles.counter}>{activeIdx + 1} / {images.length}</div>
                )}
                {activeImage?.caption && (
                  <div className={styles.caption}>{activeImage.caption}</div>
                )}
              </div>

              {/* Thumbnails */}
              {!imgsLoading && (
                <div className={styles.thumbs}>
                  {images.length > 0
                    ? images.map((img, i) => (
                        <button
                          key={img.id}
                          className={`${styles.thumb} ${activeIdx === i ? styles.thumbActive : ''}`}
                          onClick={() => setActiveIdx(i)}
                          aria-label={img.caption ?? `View image ${i + 1}`}
                        >
                          <Image
                            src={img.url}
                            alt={img.caption ?? `${artwork.title} ${i + 1}`}
                            fill
                            sizes="120px"
                            className={styles.thumbImg}
                          />
                        </button>
                      ))
                    : [0, 1, 2].map((i) => (
                        <div key={i} className={`${styles.thumb} ${styles.thumbPlaceholderWrap}`}>
                          <div
                            className={styles.thumbPlaceholder}
                            style={{ background: artwork.gradient_bg ?? '#EDEAE2' }}
                          />
                        </div>
                      ))
                  }
                </div>
              )}
            </div>

            {/* Right: details */}
            <div className={styles.detailCol}>
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
                    <button className={styles.btnPrimary} onClick={() => setContactOpen(true)}>
                      Enquire to buy
                    </button>
                    <button className={styles.btnSecondary} onClick={() => setCommissionOpen(true)}>
                      Commission similar
                    </button>
                  </>
                ) : (
                  <button className={styles.btnPrimary} onClick={() => setCommissionOpen(true)}>
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
