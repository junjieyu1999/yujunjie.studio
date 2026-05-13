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
    label: 'On looking',
    heading: 'I see what most people miss.',
    body: `Everything starts with observation — sometimes for days before anything is made. I am not interested in surfaces. I am interested in what sits underneath them: the weight a person carries, the way a coastline holds its breath before a wave, the specific quality of light that makes an ordinary moment worth remembering.\n\nI wait for that thing to reveal itself. Some people call it inspiration. I call it patience with your eyes open.`,
  },
  {
    label: 'On people',
    heading: 'There is no good or evil. Only everything in between.',
    body: `When I paint people, I am not painting a likeness. I am painting the complexity that makes them who they are — the contradictions, the histories, the quiet forces that shape every decision they've ever made.\n\nI don't believe in clean moral lines. People are gray areas, and I want my portraits to hold that. When you look at a face in my work, I want you to feel like you still don't quite have the full story. Because you don't. Neither do I.`,
  },
  {
    label: 'On landscapes',
    heading: 'Peace inside chaos.',
    body: `The sea is never just the sea. There is always a stillness buried inside the violence of it — a moment of held breath between the chaos. That tension is what I am chasing in every landscape I make.\n\nI am not documenting geography. I am trying to freeze a feeling — the particular atmosphere of a place at a specific moment in time that will never exist again. Travel feeds this. Every new place shows me the world through a new set of eyes, and that is the closest thing I have to a creative practice outside the studio.`,
  },
  {
    label: 'On the shimmer',
    heading: 'There is always more than what you see.',
    body: `I use a translucent shimmer — gold or silver — as a signature throughout my work. `
  },
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
                {/* Replace with your name */}
                Your <em>Name</em>
              </h1>
              <p className={styles.heroSub}>
                Artist. Based in Singapore.
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
                  alt="Artist photo"
                  fill
                  sizes="420px"
                  className={styles.portraitImg}
                  priority
                />
              </div>
              <div className={styles.portraitCaption}>
                Studio, Singapore · 2026
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
                  I make art because I have to. It is how I process the world past, present, and
                  future. It is the only way I know to release what I see that others seem to
                  walk straight past. The layers underneath things. The tension inside stillness.
                  The gray area where most of the real human story lives.
                </p>
                <p className={styles.bioPara}>
                  Traveling is my primary fuel. Every new place puts me in front of people living
                  their day-to-day lives in ways I haven't seen before, and that recalibrates
                  everything. Singapore grounds me, but the work is shaped by everywhere I've moved
                  through.
                </p>
                <p className={styles.bioPara}>
                  I work in bursts. Periods of deep observation and waiting, followed by intense
                  focused making. I don't force the work. I wait until I have something to say,
                  and then I say it as honestly as I can. A piece is finished when I step back
                  and see the thing I originally felt. Not before.
                </p>
              </div>

              <div>
                <div className={styles.sectionLabel}>At a glance</div>
                <div className={styles.factList}>
                  {[
                    ['Based in', 'Singapore'],
                    ['Primary subjects', 'Portraits, landscapes'],
                    ['Signature', 'Translucent gold & silver shimmer'],
                    ['Commissions', 'Open — enquire below'],
                    ['Driven by', 'Travel, people, the sea'],
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
            <h2 className={styles.sectionHeading}>How I think about making work</h2>

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


        {/* ── Process ── */}
        <section className={styles.process}>
          <div className={styles.inner}>
            <div className={styles.sectionLabel}>Process</div>
            <h2 className={styles.sectionHeading}>How a piece gets made</h2>
            <div className={styles.processSteps}>
              {[
                {
                  n: '01',
                  title: 'Observation',
                  body: 'Everything starts outside the studio. I watch, absorb, and wait. I am looking for the specific thing that makes this subject worth making at all. The feeling underneath the surface.',
                },
                {
                  n: '02',
                  title: 'Atmosphere',
                  body: 'Before I make a mark I build the mood. Music that fits the emotional register of what I am trying to say. A mental map of where I want to go.',
                },
                {
                  n: '03',
                  title: 'Sketching and testing',
                  body: 'Ideas get tested before they reach the canvas. Rough sketches, quick studies — I need to know if something works before I commit to it. This is where most ideas either sharpen or fall away.',
                },
                {
                  n: '04',
                  title: 'The making',
                  body: 'Once I am working, I work. Failures on the canvas are not mistakes, they are occurences. I build around them, incorporate them, let them become part of the piece.',
                },
                {
                  n: '05',
                  title: 'Knowing when to stop',
                  body: 'A piece is finished when I step back and see my original vision looking back at me. Not when it is technically complete. Not when someone else says it is done. When I recognize what I felt at the beginning.',
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
                <h3 className={styles.ctaHeading}>Want a piece made for you?</h3>
                <p className={styles.ctaBody}>
                  Commissions start with a conversation. Fill out the questionnaire and tell me
                  what you have in mind — the more honest you are, the better the work will be.
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