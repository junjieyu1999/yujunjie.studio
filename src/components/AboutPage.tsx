'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Nav from './Nav';
import ContactModal from './ContactModal';
import CommissionQuestionnaire from './CommissionQuestionnaire';
import styles from './AboutPage.module.css';
import pageStyles from './ArtPage.module.css';

const PHILOSOPHY_SECTIONS = [
  {
    label: 'On observation',
    heading: 'Painting begins before the brush touches canvas.',
    body: `Every piece starts with a sustained act of looking — sometimes for days. I am less interested in what something looks like and more in what it feels like to be near it. The quality of light on a face at 4pm. The specific weight of a coastal horizon before rain. These are not decorative observations. They are the subject.\n\nI do not paint to record. I paint to ask why certain moments lodge themselves in memory and refuse to leave.`,
  },
  {
    label: 'On oil paint',
    heading: 'The medium is not neutral.',
    body: `Oil paint has a particular relationship with time — both in the making and in the looking. Layers dry slowly, which means decisions compound. A mistake from day one lives underneath everything that follows. I find this honest. It mirrors how a life actually accumulates.\n\nI work almost exclusively in oils, primarily on canvas and linen. I am drawn to its capacity for both transparency and opacity — to glazes so thin the canvas breathes through them, and to impasto marks left exactly as placed.`,
  },
  {
    label: 'On restraint',
    heading: 'Less, until it is enough.',
    body: `A painting is finished when removing anything would be a loss and adding anything would be noise. This is harder to reach than it sounds. The instinct is always to do more — to explain, to clarify, to fill. I try to resist this.\n\nMy palette rarely exceeds five or six colours on a given piece. Restricted palettes force coherence. They also force you to really understand what you are mixing and why, rather than reaching for a convenience.`,
  },
  {
    label: 'On subjects',
    heading: 'Portraits and landscapes are the same question.',
    body: `Both are fundamentally about interiority. A landscape, painted honestly, is not a description of geography — it is a mood made visible. A portrait, painted honestly, is not a likeness — it is a record of what it felt like to be in the presence of another person.\n\nThe subjects I return to most are faces that carry an interior life I find genuinely interesting, and places whose atmosphere is specific enough to feel like a personality. Singapore's late-afternoon light. Coastlines at the boundary between salt water and mangrove. The quality of a room where someone has been working alone for hours.`,
  },
];

const INFLUENCES = [
  { name: 'Vilhelm Hammershøi', note: 'Silence as a compositional element' },
  { name: 'Lucian Freud', note: 'The weight of physical presence' },
  { name: 'Andrew Wyeth', note: 'Restraint and emotional precision' },
  { name: 'Giorgio Morandi', note: 'How repetition becomes a form of depth' },
  { name: 'Rembrandt', note: 'Shadow as an active, not absent, thing' },
];

export default function AboutPage() {
  const [contactOpen, setContactOpen] = useState(false);
  const [commissionOpen, setCommissionOpen] = useState(false);
  const [activePhilosophy, setActivePhilosophy] = useState(0);

  return (
    <div className={pageStyles.root}>
      <Nav
        onContactOpen={() => setContactOpen(true)}
        onCommissionOpen={() => setCommissionOpen(true)}
      />

      <main className={pageStyles.main}>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <div className={styles.eyebrow}>About the artist</div>
              <h1 className={styles.heroHeading}>
                Yu <em>JunJie</em>
              </h1>
              <p className={styles.heroSub}>
                Oil painter. Singapore.
                <br />
                Portraits and landscapes.
              </p>
              <div className={styles.heroCtas}>
                <Link href="/" className={styles.btnSecondary}>
                  View the work →
                </Link>
                <button className={styles.btnGhost} onClick={() => setCommissionOpen(true)}>
                  Commission a piece
                </button>
              </div>
            </div>

            {/* ── Artist photo ── */}
            {/* Drop your photo into public/artist-photo.jpg (or .webp / .png)  */}
            {/* Recommended: portrait orientation, min 800px wide                */}
            <div className={styles.portraitWrap}>
              <div className={styles.portraitImgWrap}>
                <Image
                  src="/artist-photo.jpg"
                  alt="Yu JunJie"
                  fill
                  sizes="420px"
                  className={styles.portraitImg}
                  priority
                />
              </div>
              <div className={styles.portraitCaption}>
                Studio, Singapore · 2024
              </div>
            </div>
          </div>
        </section>

        {/* ── Short bio ── */}
        <section className={styles.bio}>
          <div className={styles.inner}>
            <div className={styles.bioGrid}>
              <div>
                <div className={styles.sectionLabel}>Background</div>
                <p className={styles.bioPara}>
                  I came to painting through a long detour. Years of competitive water polo — early
                  mornings, shared exhaustion, the discipline of a body in water — gave me an
                  intimacy with light on surfaces and the particular quality of attention that comes
                  from sustained physical practice.
                </p>
                <p className={styles.bioPara}>
                  I began painting seriously in my mid-twenties, working through the traditional
                  progression: cast drawing, still life, then figure. I have been working in oils
                  ever since, primarily in portraiture and landscape, with a growing interest in
                  interior scenes.
                </p>
                <p className={styles.bioPara}>
                  I am based in Singapore, which shapes the work in ways I am still discovering.
                  The light here is specific — high, direct, and relentless — and learning to paint
                  it honestly has been one of the longer preoccupations of my practice.
                </p>
              </div>

              <div>
                <div className={styles.sectionLabel}>At a glance</div>
                <div className={styles.factList}>
                  {[
                    ['Based in', 'Singapore'],
                    ['Medium', 'Oil on canvas, linen, board'],
                    ['Primary subjects', 'Portraits, landscapes, interiors'],
                    ['Commissions', 'Open — enquire below'],
                    ['Typical turnaround', '6–14 weeks depending on size'],
                  ].map(([k, v]) => (
                    <div key={k} className={styles.fact}>
                      <span className={styles.factKey}>{k}</span>
                      <span className={styles.factVal}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Philosophy ── */}
        <section className={styles.philosophy}>
          <div className={styles.inner}>
            <div className={styles.sectionLabel}>Philosophy</div>
            <h2 className={styles.sectionHeading}>How I think about painting</h2>

            <div className={styles.philoLayout}>
              {/* Tab nav */}
              <div className={styles.philoTabs}>
                {PHILOSOPHY_SECTIONS.map((s, i) => (
                  <button
                    key={s.label}
                    className={`${styles.philoTab} ${activePhilosophy === i ? styles.philoTabActive : ''}`}
                    onClick={() => setActivePhilosophy(i)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Content panel */}
              <div className={styles.philoPanel} key={activePhilosophy}>
                <h3 className={styles.philoHeading}>
                  {PHILOSOPHY_SECTIONS[activePhilosophy].heading}
                </h3>
                {PHILOSOPHY_SECTIONS[activePhilosophy].body.split('\n\n').map((para, i) => (
                  <p key={i} className={styles.philoPara}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Influences ── */}
        {/* <section className={styles.influences}>
          <div className={styles.inner}>
            <div className={styles.sectionLabel}>Influences</div>
            <h2 className={styles.sectionHeading}>Artists I keep returning to</h2>
            <div className={styles.influenceGrid}>
              {INFLUENCES.map((inf) => (
                <div key={inf.name} className={styles.influenceCard}>
                  <div className={styles.influenceName}>{inf.name}</div>
                  <div className={styles.influenceNote}>{inf.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* ── Process ── */}
        <section className={styles.process}>
          <div className={styles.inner}>
            <div className={styles.sectionLabel}>Process</div>
            <h2 className={styles.sectionHeading}>How a painting gets made</h2>
            <div className={styles.processSteps}>
              {[
                {
                  n: '01',
                  title: 'Observation',
                  body: 'Before any marks are made, I spend time with the subject — in person where possible, from reference where not. I am looking for the specific thing that makes this subject worth painting at all.',
                },
                {
                  n: '02',
                  title: 'Toned ground',
                  body: 'I rarely start on white. A burnt sienna or raw umber ground establishes a mid-tone and a warm temperature that influences every subsequent decision. It also makes the whites more luminous when they arrive.',
                },
                {
                  n: '03',
                  title: 'Massing',
                  body: 'The painting is blocked in broadly — large shapes of light and shadow, no detail yet. This is where most of the real compositional decisions happen. Everything else is refinement.',
                },
                {
                  n: '04',
                  title: 'Glazing and building',
                  body: 'Transparent layers are built up in shadow areas. Lighter passages are added in opaque paint. The balance between transparency and opacity gives the surface its internal complexity.',
                },
                {
                  n: '05',
                  title: 'The last marks',
                  body: 'The final touches — a highlight, a signature edge — are placed last and left alone. The instinct to keep working is usually wrong. I try to stop the moment the painting says what it needs to say.',
                },
              ].map((step) => (
                <div key={step.n} className={styles.processStep}>
                  <div className={styles.stepNum}>{step.n}</div>
                  <div>
                    <div className={styles.stepTitle}>{step.title}</div>
                    <p className={styles.stepBody}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.cta}>
          <div className={styles.inner}>
            <div className={styles.ctaBox}>
              <div>
                <h3 className={styles.ctaHeading}>Interested in a commission?</h3>
                <p className={styles.ctaBody}>
                  Take the questionnaire — a short set of questions that helps you articulate what
                  you want. I use your answers as the creative brief.
                </p>
              </div>
              <div className={styles.ctaButtons}>
                <button className={styles.btnPrimary} onClick={() => setCommissionOpen(true)}>
                  Start questionnaire
                </button>
                <button className={styles.btnGhost} onClick={() => setContactOpen(true)}>
                  Just get in touch
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <CommissionQuestionnaire open={commissionOpen} onClose={() => setCommissionOpen(false)} />
    </div>
  );
}
