import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import s from '../styles/competitionPage.module.css';

const ROUNDS = [
  {
    num: '01',
    name: 'PRIOR',
    what: 'Qualifier',
    badges: ['Individual', 'Codeforces', 'ICPC Style', '23 May 2026'],
    body: 'Round 1 is the mass filter. Hosted on Codeforces in ICPC style, it focuses on probability theory, Bayesian inference, and market microstructure. The key idea is simple: no templates, pure first-principles solving.',
    evaluated: ['Probability theory', 'Bayesian inference', 'Market microstructure'],
  },
  {
    num: '02',
    name: 'POSTERIOR',
    what: 'Prelims',
    badges: ['Individual', 'Hard Online Round', '21 June 2026'],
    body: 'Round 2 is the true signal extraction layer. The difficulty spikes, external setters enter the picture, and problems focus on stochastic processes, options pricing, and combinatorics.',
    evaluated: ['Stochastic processes', 'Options pricing', 'Combinatorics'],
  },
  {
    num: '03',
    name: 'CONVERGENCE',
    what: 'Finals',
    badges: ['Invite-Only', 'IIT', '30–50 Finalists', '11 July 2026 Tentative'],
    body: 'Round 3 is the spectacle and prestige moment. Invite-only finalists meet at IIT, form teams on-site, solve a real derivation problem, and the top 2 advance to a live 1v1 Derivation Duel.',
    evaluated: ['Team formation on-site', 'Real derivation problem', 'Live 1v1 duel'],
  },
];

const TIMELINE = [
  { date: '25 Mar 2026', event: 'Pre-Registration Opens' },
  { date: '20 Apr 2026', event: 'Registration Opens' },
  { date: '22 May 2026', event: 'Registration Closes' },
  { date: '23 May 2026', event: 'PRIOR | Round 1 (Codeforces, ICPC Style)' },
  { date: '21 Jun 2026', event: 'POSTERIOR | Round 2 (Hard Online Round)' },
  { date: '1 Jul 2026', event: 'Finalists Announced' },
  { date: '11 Jul 2026', event: 'CONVERGENCE | Finals at IIT (Tentative)' },
];

const PHILOSOPHY = [
  {
    heading: 'Reasoning Over Recall.',
    body: 'Problems are designed so that memorised solutions do not transfer directly. Participants are expected to reason through unfamiliar configurations, not apply known patterns. Partial derivations with sound logic are valued over complete answers with no visible reasoning.',
  },
  {
    heading: 'Modeling Ability Over Speed.',
    body: 'Time pressure exists, but it is not the primary filter. The evaluation prioritises the quality of a participant\'s model — how well they decompose a problem, identify the relevant variables, and structure their approach. A clean, well-reasoned partial solution outranks a fast but shallow complete one.',
  },
  {
    heading: 'Structured Thinking Under Uncertainty.',
    body: 'Especially in Rounds 2 and 3, problems are deliberately underspecified. Participants must identify what is unknown, make explicit assumptions, and reason forward. This mirrors how problems are encountered in quantitative and research environments — ambiguous inputs, no guarantee of a closed-form answer.',
  },
];

const FINAL = [
  '30–50 finalists are invited to IIT for an on-site final built around a real derivation problem.',
  'Teams are formed on-site, so finalists are evaluated on adaptability, communication, and collaborative reasoning under uncertainty.',
  'The top 2 finalists enter a live 1v1 Derivation Duel — the final spectacle of AMS Derive 2026.',
  'The finals are designed as the prestige moment of the circuit, bringing together the strongest signal from PRIOR and POSTERIOR.',
];

export default function CompetitionPage() {
  return (
    <>
      <Head>
        <title>Competition Structure | AMS Derive 2026</title>
        <meta
          name="description"
          content="AMS Derive 2026 competition structure — PRIOR on Codeforces, POSTERIOR hard online prelims, and CONVERGENCE invite-only finals at IIT."
        />
      </Head>

      <Navbar />

      <main className={s.page}>
        <div className={s.container}>

          {/* Header */}
          <div className={s.header}>
            <p className={s.eyebrow}>AMS Derive 2026</p>
            <h1 className={s.pageTitle}>Competition Structure</h1>
            <p className={s.subtitle}>
              Three rounds. PRIOR filters for first-principles solving, POSTERIOR extracts deeper
              quantitative signal, and CONVERGENCE turns the strongest finalists into an on-site
              derivation spectacle at IIT.
            </p>
          </div>

          {/* Round cards */}
          <span className={s.sectionLabel}>The Rounds</span>
          {ROUNDS.map(({ num, name, what, badges, body, evaluated }) => (
            <div key={num} className={s.roundCard}>
              <div className={s.roundLeft}>
                <span className={s.roundNum}>{num}</span>
                <div className={s.roundName}>{name}</div>
                <div className={s.roundWhat}>{what}</div>
                <div className={s.badges}>
                  {badges.map(b => <span key={b} className={s.badge}>{b}</span>)}
                </div>
              </div>
              <div className={s.colDivider} />
              <div className={s.roundRight}>
                <p className={s.roundBody}>{body}</p>
                <div className={s.evaluatedRow}>
                  <span className={s.evaluatedLabel}>Evaluated on</span>
                  {evaluated.map(e => <span key={e} className={s.evalBadge}>{e}</span>)}
                </div>
              </div>
            </div>
          ))}

          {/* Evaluation Philosophy */}
          <div className={s.card} style={{ marginTop: 40 }}>
            <p className={s.cardTitle}>Evaluation Philosophy</p>
            <div className={s.philoList}>
              {PHILOSOPHY.map(({ heading, body }) => (
                <div key={heading} className={s.philoItem}>
                  <span className={s.philoBullet}>›</span>
                  <p className={s.philoText}>
                    <strong>{heading}</strong>{' '}{body}
                  </p>
                </div>
              ))}
            </div>
            <div className={s.rewardRow}>
              <span className={s.rewardLabel}>Rewarded</span>
              {['Logical decomposition', 'Explicit assumptions', 'Derivation clarity', 'Structured communication'].map(t => (
                <span key={t} className={s.rewardBadge}>{t}</span>
              ))}
            </div>
            <div className={s.rewardRow}>
              <span className={[s.rewardLabel, s.rewardLabelMuted].join(' ')}>Not rewarded</span>
              {['Pattern matching', 'Speed without rigour', 'Memorised templates'].map(t => (
                <span key={t} className={s.rewardBadge}>{t}</span>
              ))}
            </div>
          </div>

          {/* Full Timeline */}
          <div className={s.card} style={{ marginTop: 2 }}>
            <p className={s.cardTitle}>Full Timeline</p>
            <div className={s.timelineList}>
              {TIMELINE.map(({ date, event }) => (
                <div key={date} className={s.timelineRow}>
                  <span className={s.tlDate}>{date}</span>
                  <span className={s.tlEvent}>{event}</span>
                </div>
              ))}
            </div>
            <p className={s.timelineNote}>
              All dates are tentative and subject to confirmation. Registered participants will be
              notified directly via email at each stage transition. Join the{' '}
              <a href="https://chat.whatsapp.com/GSyVZSW3ZgZ1xfJMpzK5cS" target="_blank" rel="noopener noreferrer">
                AMS Derive community group
              </a>
              {' '}for live updates.
            </p>
          </div>

          {/* Final Round Detail */}
          <div className={s.card} style={{ marginTop: 2 }}>
            <p className={s.cardTitle}>Final Round — Beyond the Evaluation</p>
            <div className={s.finalList}>
              {FINAL.map((text, i) => (
                <div key={i} className={s.finalItem}>
                  <span className={s.finalBullet}>›</span>
                  <p className={s.finalText}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA block */}
          <div className={s.ctaBlock}>
            <span className={s.ctaLabel}>Ready to Compete?</span>
            <div className={s.ctaButtons}>
              <Link href="/register" className={s.ctaPrimary}>Register Now</Link>
              <Link href="/rules" className={s.ctaSecondary}>Read Rules</Link>
              <Link href="/syllabus" className={s.ctaTertiary}>View Syllabus</Link>
            </div>
          </div>

          <Link href="/" className={s.backLink}>← Back to Home</Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
