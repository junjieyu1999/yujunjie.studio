'use client';

import Link from 'next/link';
import styles from './Nav.module.css';

interface NavProps {
  onContactOpen: () => void;
  onCommissionOpen: () => void;
}

export default function Nav({ onContactOpen, onCommissionOpen }: NavProps) {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        Yu <em className={styles.acc}>JunJie</em>
      </Link>

      <div className={styles.centre}>
        <span className={styles.label}>Oil on Canvas · Singapore</span>
      </div>

      <div className={styles.actions}>
        <button className={styles.ghost} onClick={onCommissionOpen}>
          Commission a piece
        </button>
        <button className={styles.cta} onClick={onContactOpen}>
          <span className={styles.dot} />
          Enquire
        </button>
      </div>
    </nav>
  );
}
