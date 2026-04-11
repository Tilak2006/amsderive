import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/rules.module.css';

const ROUNDS = [
  {
    num: '01',
    name: 'PRIOR',
    tag: 'Mathematical Modeling · Online · 3 Hours · 23 May 2026',
    body: 'Problems are drawn from probability, stochastic processes, expected value, and distribution theory. No templates are provided. Participants are expected to build models from first principles and show their reasoning in full.',
    evaluated: 'Correctness · Clarity of reasoning · Rigour of derivation',
  },
  {
    num: '02',
    name: 'POSTERIOR',
    tag: 'Algorithmic + Quant Thinking · Online · 3 Hours · 21 June 2026',
    body: 'Competitive-programming style problems with a quantitative layer. Correct answers are not enough — solutions must be efficient, well-structured, and handle edge cases under constraints. Problems combine algorithmic thinking with probabilistic reasoning.',
    evaluated: 'Efficiency · Correctness under constraints · Approach clarity',
  },
  {
    num: '03',
    name: 'CONVERGENCE',
    tag: 'Final Round · In-Person, Offline Finals · Top Participants · 11 July 2026',
    body: 'Selected participants are invited to the offline finals. Teams are formed on-site. Problems are open-ended, real-world, and deliberately ambiguous — co-designed with partner firms. There is no single correct answer. Evaluation is based on how the problem is structured, reasoned through, and communicated.',
    evaluated: 'Problem framing · Reasoning depth · Execution · Communication',
  },
];

export default function CompetitionPage() {
  return (
    <>
      <Head>
        <title>Competition Structure | AMS Derive 2026</title>
        <meta
          name="description"
          content="AMS Derive 2026 competition structure — three rounds: PRIOR, POSTERIOR, and CONVERGENCE. Evaluation philosophy, round formats, and how advancement works."
        />
      </Head>

      <Navbar />

      <main className={styles.page}>
        <div className={styles.container}>

          {/* Header */}
          <div className={styles.header}>
            <p className={styles.eyebrow}>AMS Derive 2026</p>
            <h1 className={styles.pageTitle}>Competition Structure</h1>
            <p className={styles.subtitle}>
              Three rounds. Each stage tests a distinct layer of thinking ability — from mathematical precision to open-ended system reasoning.
              Progression is not guaranteed. Selection at each stage is based on signal quality, not volume.
            </p>
          </div>

          {/* Round cards */}
          {ROUNDS.map((round) => (
            <div key={round.num} className={styles.rulesCard}>
              <p className={styles.rulesSectionTitle}>
                Round {round.num} — {round.name}
              </p>
              <p style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                color: 'rgba(212,175,55,0.55)',
                marginBottom: 16,
              }}>
                {round.tag}
              </p>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.92rem',
                color: '#b8b8b8',
                lineHeight: 1.85,
                marginBottom: 16,
              }}>
                {round.body}
              </p>
              <p style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.65rem',
                letterSpacing: '0.06em',
                color: '#555',
              }}>
                <span style={{ color: '#D4AF37', opacity: 0.7 }}>Evaluated on:</span> {round.evaluated}
              </p>
            </div>
          ))}

          {/* Evaluation Philosophy */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>Evaluation Philosophy</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Reasoning Over Recall.</strong> Problems are designed so that memorised solutions do not transfer directly. Participants are expected to reason through unfamiliar configurations, not apply known patterns. Partial derivations with sound logic are valued over complete answers with no visible reasoning.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Modeling Ability Over Speed.</strong> Time pressure exists, but it is not the primary filter. The evaluation prioritises the quality of a participant's model — how well they decompose a problem, identify the relevant variables, and structure their approach. A clean, well-reasoned partial solution outranks a fast but shallow complete one.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Structured Thinking Under Uncertainty.</strong> Especially in Rounds 2 and 3, problems are deliberately underspecified. Participants must identify what is unknown, make explicit assumptions, and reason forward. This mirrors how problems are encountered in quantitative and research environments — ambiguous inputs, no guarantee of a closed-form answer.
              </li>
            </ul>
            <p style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
              color: '#555',
              marginTop: 20,
            }}>
              <span style={{ color: '#D4AF37', opacity: 0.7 }}>What is rewarded:</span> Logical decomposition · Explicit assumptions · Derivation clarity · Structured communication
            </p>
            <p style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
              color: '#555',
              marginTop: 8,
            }}>
              <span style={{ color: '#555' }}>What is not rewarded:</span> Pattern matching · Speed without rigour · Memorised templates
            </p>
          </div>

          {/* Timeline */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>Full Timeline</p>
            <ul className={styles.rulesList}>
              {[
                { date: '25 March 2026', event: 'Pre-Registration Opens' },
                { date: '20 April 2026', event: 'Registration Opens' },
                { date: '15 May 2026', event: 'Registration Closes' },
                { date: '23 May 2026', event: 'PRIOR — Round 1 (Online, 3 Hours)' },
                { date: '21 June 2026', event: 'POSTERIOR — Round 2 (Online, 3 Hours)' },
                { date: '1 July 2026', event: 'Finalists Announced' },
                { date: '11 July 2026', event: 'CONVERGENCE — Final Round (In-Person, Offline)' },
              ].map(({ date, event }) => (
                <li key={date} className={styles.rulesListItem}>
                  <strong style={{ color: '#D4AF37' }}>{date}</strong> — {event}
                </li>
              ))}
            </ul>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              color: '#444',
              marginTop: 16,
              lineHeight: 1.6,
            }}>
              All dates are tentative and subject to confirmation. Registered participants will be notified directly via email at each stage transition. Participants are also advised to join the{' '}
              <a
                href="https://chat.whatsapp.com/D3OxCs0L1V8IodpRVzG6cw"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#D4AF37', textDecoration: 'none' }}
              >
                AMS Derive community group
              </a>
              {' '}for live updates and announcements.
            </p>
          </div>

          {/* Final Round Detail */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>Final Round — Beyond the Evaluation</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                The offline finals are not just an evaluation. The format is designed to bring together a concentrated group of strong analytical minds — and that itself is valuable.
              </li>
              <li className={styles.rulesListItem}>
                Alongside the main event, finalists can expect structured chess and poker sessions — natural extensions of the probabilistic and strategic reasoning AMS Derive selects for.
              </li>
              <li className={styles.rulesListItem}>
                Dedicated networking time with peers, the AMS team, and representatives from partner firms including Jane Street.
              </li>
              <li className={styles.rulesListItem}>
                The top 3 teams emerge victorious and win the title of AMS Derive Champions.
              </li>
            </ul>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                color: '#0a0a0a',
                background: '#D4AF37',
                padding: '12px 28px',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Register Now
            </Link>
            <Link
              href="/rules"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                color: '#D4AF37',
                border: '1px solid rgba(212,175,55,0.4)',
                padding: '12px 28px',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Read Rules
            </Link>
            <Link
              href="/syllabus"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                color: '#666',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '12px 28px',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              View Syllabus
            </Link>
          </div>

          <Link href="/" className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
