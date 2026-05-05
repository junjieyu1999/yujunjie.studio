'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Artwork } from '@/lib/types';
import styles from './ArtworkCard.module.css';

const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  sold: 'Sold',
  'in-progress': 'In Progress',
};

interface Props {
  artwork: Artwork;
  index: number;
}

export default function ArtworkCard({ artwork, index }: Props) {
  const offsetClass =
    index % 3 === 1 ? styles.offset1 : index % 3 === 2 ? styles.offset2 : '';

  return (
    <Link href={`/art/${artwork.id}`} className={`${styles.card} ${offsetClass}`}>
      <div className={styles.imageWrap}>
        {artwork.image_url ? (
          <Image
            src={artwork.image_url}
            alt={artwork.title}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className={styles.image}
          />
        ) : (
          <div
            className={styles.placeholder}
            style={{ background: artwork.gradient_bg ?? '#EDEAE2' }}
          />
        )}
        <span className={`${styles.badge} ${styles[artwork.status.replace('-', '_')]}`}>
          {STATUS_LABEL[artwork.status]}
        </span>
      </div>
      <div className={styles.meta}>
        <div className={styles.title}>{artwork.title}</div>
        <div className={styles.sub}>
          {artwork.theme.charAt(0).toUpperCase() + artwork.theme.slice(1)} · {artwork.medium} · {artwork.dimensions}
        </div>
      </div>
    </Link>
  );
}
