import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/rules.module.css';

const FAQS = [
  {
    section: '01 — Eligibility',
    items: [
      {
        q: 'Who can participate in AMS Derive 2026?',
        a: 'AMS Derive is open to students currently enrolled in a B.Tech, M.Tech, B.S., M.S., Ph.D., or equivalent technical degree program at an Indian institution. Recent alumni who graduated within the last 12 months are also eligible.',
      },
      {
        q: 'Can working professionals participate?',
        a: 'Full-time employed quants, traders, or financial professionals are not eligible, regardless of educational qualifications.',
      },
      {
        q: 'Is there a team size requirement?',
        a: 'Rounds 1 (PRIOR) and 2 (POSTERIOR) are individual. Round 3 (CONVERGENCE) is team-based — teams of exactly 3 members. Team formation details will be communicated to qualifiers.',
      },
    ],
  },
  {
    section: '02 — Registration',
    items: [
      {
        q: 'When does registration open?',
        a: 'Registration opens on April 20, 2026 at 00:00 IST. Pre-register via the notify modal to get an email reminder when it goes live.',
      },
      {
        q: 'How many spots are available?',
        a: 'Registration is capped at 1,000 participants. Spots are allocated on a first-come, first-served basis. No waitlist is maintained after the cap is reached.',
      },
      {
        q: 'What documents do I need to register?',
        a: 'You will need to upload a resume (PDF, max 5 MB) and a transcript (PDF, max 5 MB) from your institution. Both documents are required to complete registration.',
      },
      {
        q: 'Can I update my information after registering?',
        a: 'Contact admin@amsociety.in for any corrections. Critical details such as your Codeforces handle and institution name must be accurate before Round 1 begins.',
      },
    ],
  },
  {
    section: '03 — Contest Format',
    items: [
      {
        q: 'What is the structure of AMS Derive?',
        a: 'The contest has three rounds: PRIOR (Round 1, May 23 — individual, Codeforces Gym, ICPC format), POSTERIOR (Round 2, June 21 — individual), and CONVERGENCE (Round 3, July 11 — teams of 3, offline at IIT Bombay).',
      },
      {
        q: 'What topics does the contest cover?',
        a: 'Problems span quantitative trading strategies, stochastic processes and SDEs, probability theory, Bayesian reasoning, market microstructure, and algorithmic problem solving. Check the Syllabus page for a detailed breakdown.',
      },
      {
        q: 'Is Round 1 hosted on Codeforces?',
        a: 'Yes. Round 1 (PRIOR) is hosted as a Codeforces Gym contest in ICPC format. You will need an active Codeforces account — ensure the handle you provide at registration matches exactly.',
      },
      {
        q: 'How many participants advance between rounds?',
        a: 'Advancement criteria and cutoffs will be announced after each round. AMS decisions on scoring and advancement are final.',
      },
    ],
  },
  {
    section: '04 — Online Round Rules',
    items: [
      {
        q: 'Is screen recording mandatory?',
        a: 'Yes. Mandatory full-screen OBS recording is required for all online rounds (PRIOR and POSTERIOR). Submissions without a valid recording are void, with no exceptions.',
      },
      {
        q: 'Can I use AI tools or collaborate with others?',
        a: 'No. All online rounds are strictly individual. Use of generative AI tools (e.g. ChatGPT, Copilot), collaboration with other participants, or any external assistance is prohibited and actively monitored.',
      },
      {
        q: 'What is the technical verification session?',
        a: 'Selected participants may be called for a remote technical verification session after online rounds to confirm their work is genuine. Refusal to participate results in disqualification.',
      },
    ],
  },
  {
    section: '05 — Prizes & Opportunities',
    items: [
      {
        q: 'What prizes are available?',
        a: 'Prizes are awarded following Round 3 (CONVERGENCE). Exact prize amounts and categories are confirmed after final sponsor commitments. Prize disbursement requires valid identity and bank details within the timeframe set by AMS.',
      },
      {
        q: 'Are there internship or job opportunities?',
        a: 'Partner firms may extend interview invitations or shortlisting opportunities to top performers. These are at the sole discretion of the respective firms. AMS does not guarantee any employment or internship outcome.',
      },
    ],
  },
  {
    section: '06 — Technical & Support',
    items: [
      {
        q: 'What should I do if I face a technical issue during a contest?',
        a: 'In case of a platform outage on AMS infrastructure, remediation steps will be communicated via email. Submission failures caused by your own connectivity or device issues are not grounds for an extension.',
      },
      {
        q: 'Who do I contact for general questions?',
        a: 'Reach us at admin@amsociety.in for general inquiries, or partnership@amsociety.in for sponsor and firm-related questions.',
      },
      {
        q: 'Where can I find the community?',
        a: 'Join the official Discord server and WhatsApp community — links are in the footer. These are the primary channels for announcements and participant discussion.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      <Head>
        <title>FAQ | AMS Derive 2026</title>
        <meta
          name="description"
          content="Frequently asked questions about AMS Derive 2026 — eligibility, registration, contest format, rules, prizes, and more."
        />
      </Head>

      <Navbar />

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>AMS Derive 2026</p>
            <h1 className={styles.pageTitle}>FAQ</h1>
            <p className={styles.subtitle}>
              Answers to common questions about eligibility, registration, contest format, and prizes.
              Still have a question? Email{' '}
              <a href="mailto:admin@amsociety.in" style={{ color: '#D4AF37' }}>
                admin@amsociety.in
              </a>
              .
            </p>
          </div>

          {FAQS.map(({ section, items }) => (
            <div key={section} className={styles.rulesCard}>
              <p className={styles.rulesSectionTitle}>{section}</p>
              <ul className={styles.rulesList}>
                {items.map(({ q, a }) => (
                  <li key={q} className={styles.rulesListItem}>
                    <strong style={{ color: '#e8e8e8', display: 'block', marginBottom: '4px' }}>
                      {q}
                    </strong>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <Link href="/" className={styles.backLink}>
            &larr; Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
