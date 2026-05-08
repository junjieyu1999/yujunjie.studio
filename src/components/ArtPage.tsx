'use client';

import { useState } from 'react';
import type { Artwork } from '@/lib/types';
import Nav from './Nav';
import GalleryWall from './Gallery3D';
import ContactModal from './ContactModal';
import CommissionQuestionnaire from './CommissionQuestionnaire';
import styles from './ArtPage.module.css';

interface Props { artworks: Artwork[]; }

export default function ArtPage({ artworks }: Props) {
  const [contactOpen,    setContactOpen]    = useState(false);
  const [contactReason,  setContactReason]  = useState('');
  const [commissionOpen, setCommissionOpen] = useState(false);

  const openContact = (reason = '') => {
    setContactReason(reason);
    setContactOpen(true);
  };

  return (
    <div className={styles.root}>
      <Nav
        onContactOpen={() => openContact()}
        onCommissionOpen={() => setCommissionOpen(true)}
      />
      <main className={styles.main}>
        <GalleryWall
          artworks={artworks}
          onCommissionOpen={() => setCommissionOpen(true)}
          onContactOpen={openContact}
        />
      </main>
      <ContactModal
        open={contactOpen}
        defaultReason={contactReason}
        onClose={() => setContactOpen(false)}
      />
      <CommissionQuestionnaire
        open={commissionOpen}
        onClose={() => setCommissionOpen(false)}
      />
    </div>
  );
}
