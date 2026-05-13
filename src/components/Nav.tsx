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
        <nav className={styles.links}>
          <Link href="/" className={styles.navLink}>Work</Link>
          <Link href="/about" className={styles.navLink}>About</Link>
          <Link href="/contact" className={styles.navLink}>Contact</Link>
        </nav>
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
