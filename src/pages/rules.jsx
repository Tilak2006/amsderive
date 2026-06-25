import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/rules.module.css';

export default function RulesPage() {
  return (
    <>
      <Head>
        <title>Rules & Guidelines | AMS Derive 2026</title>
        <meta
          name="description"
          content="Official rules and guidelines for AMS Derive 2026 — eligibility, OBS recording requirements, technical verification, code of conduct, and data policy."
        />
      </Head>

      <Navbar />

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>AMS Derive 2026</p>
            <h1 className={styles.pageTitle}>Rules & Guidelines</h1>
            <p className={styles.subtitle}>
              These rules are non-negotiable. Violations at any stage result in immediate disqualification.
              AMS reserves the right to verify, investigate, and nullify results at its discretion.
            </p>
          </div>

          {/* Eligibility */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>01 — Eligibility</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Open to students currently enrolled in B.Tech, M.Tech, B.S., M.S., Ph.D., or equivalent technical degree programs across India. No restrictions on college tier, branch, or year of study.
              </li>
              <li className={styles.rulesListItem}>
                Recent alumni who graduated within the last 12 months are also eligible. Individuals who graduated 2 or more years ago are strictly disqualified.
              </li>
              <li className={styles.rulesListItem}>
                Full-time quants or traders are not eligible. This circuit is designed for students and recent graduates only.
              </li>
              <li className={styles.rulesListItem}>
                Rounds 1 (PRIOR), 2 (POSTERIOR), and 3 (CONVERGENCE) are strictly individual. Round 3 is solved on-site at the finals.
              </li>
              <li className={styles.rulesListItem}>
                Registration closes on 23 May 2026 at 2:00 PM IST or when 10,000 spots are filled, whichever comes first.
              </li>
            </ul>
          </div>

          {/* OBS Recording */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>02 — OBS Recording (Mandatory, No Exceptions)</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                All participants must record their <strong style={{ color: '#e0e0e0' }}>entire screen</strong> for the full duration of all online rounds — not a specific window, not a browser tab, not a cropped view. The recording must capture everything visible on your display at all times.
              </li>
              <li className={styles.rulesListItem}>
                Recording must begin before the problem set is accessed and run continuously until submission. Any gap, crop, or window-only capture is treated as a missing recording.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Round 1 (PRIOR):</strong> OBS Studio (or equivalent) · Full-screen capture only.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Round 2 (POSTERIOR):</strong> OBS Studio · Full-screen capture <em>and</em> continuous webcam feed. Both are mandatory from Round 2 onwards.
              </li>
              <li className={styles.rulesListItem}>
                The recording file must be uploaded with your solution before the deadline. Submissions without a valid full-screen recording are disqualified immediately — no exceptions, no appeals.
              </li>
            </ul>
          </div>

          {/* Technical Verification */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>03 — Technical Verification</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Following Round 1 and Round 2, top candidates from each round will undergo a mandatory technical verification session conducted remotely by the AMS team.
              </li>
              <li className={styles.rulesListItem}>
                Participants will be asked to walk through their submitted solutions, explain their reasoning, and respond to follow-up questions. This is a short remote session.
              </li>
              <li className={styles.rulesListItem}>
                Solutions that cannot be defended are disqualified — irrespective of score. Advancement to the next round is contingent on passing verification.
              </li>
              <li className={styles.rulesListItem}>
                Applies to: Top X candidates post Round 1 · Top X candidates post Round 2. The specific cutoff X will be announced after each round.
              </li>
            </ul>
          </div>

          {/* Integrity */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>04 — Integrity & Code of Conduct</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Rounds 1 and 2 are individual assessments. Discussion with other participants, use of generative AI tools (ChatGPT, Copilot, etc.), pre-written solution templates, or any external assistance is strictly prohibited and actively monitored.
              </li>
              <li className={styles.rulesListItem}>
                Identical or structurally similar submissions will be flagged and investigated. Both parties in a plagiarism case are disqualified.
              </li>
              <li className={styles.rulesListItem}>
                Do not publicly discuss problems, approaches, or hints until the official editorial window is released by the organizing team.
              </li>
              <li className={styles.rulesListItem}>
                Disqualification conditions: Plagiarism · Missing OBS recording · AI-generated solutions · Late submission · Inability to defend solution in verification.
              </li>
              <li className={styles.rulesListItem}>
                AMS reserves the right to disqualify any participant, at its sole discretion, whose background check, prior cheating history, or use of unfair means in other contests is found or brought to its notice — before, during, or after the event.
              </li>
            </ul>
          </div>

          {/* Submissions */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>05 — Submissions</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Submissions must follow the specified format for each round. Late submissions will not be accepted under any circumstances.
              </li>
              <li className={styles.rulesListItem}>
                Incomplete submissions — missing reasoning, missing recording, or missing required files — will not be evaluated.
              </li>
              <li className={styles.rulesListItem}>
                It is the participant's sole responsibility to verify their submission is complete and uploaded before the deadline.
              </li>
            </ul>
          </div>

          {/* Final Round */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>06 — Final Round: CONVERGENCE</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Attendance at the offline finals is mandatory. Participants who do not confirm within the stipulated window or fail to attend will forfeit their spot. No remote participation.
              </li>
              <li className={styles.rulesListItem}>
                The finals syllabus covers puzzles, probability, the Kelly criterion, random walks, Monte Carlo simulation, expected value, and Bayesian questions.
              </li>
              <li className={styles.rulesListItem}>
                Problems are open-ended, real-world, and deliberately ambiguous — co-designed with partner firms. There is no single correct answer. Evaluation is based on problem framing, reasoning depth, execution, and communication.
              </li>
              <li className={styles.rulesListItem}>
                Alongside the main evaluation, finalists can expect structured chess and poker sessions and dedicated networking with peers, the AMS team, and partner firm representatives.
              </li>
            </ul>
          </div>

          {/* Data & Privacy */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>07 — Data & Privacy</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                By registering with data consent, participants agree to their name and institution being visible to sponsoring firms on the AMS Derive partner portal.
              </li>
              <li className={styles.rulesListItem}>
                Resume and LinkedIn are only shared with firms that have been granted the relevant access tier by the organizing team. Not all sponsors receive this access.
              </li>
              <li className={styles.rulesListItem}>
                Email address and phone number are never shared with any third party, including sponsors.
              </li>
              <li className={styles.rulesListItem}>
                Data deletion requests:{' '}
                <a href="mailto:admin@amsociety.in" style={{ color: '#D4AF37', textDecoration: 'none' }}>
                  admin@amsociety.in
                </a>
                . Requests processed within 7 business days.
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>08 — Contact & Queries</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                General:{' '}
                <a href="mailto:admin@amsociety.in" style={{ color: '#D4AF37', textDecoration: 'none' }}>
                  admin@amsociety.in
                </a>
              </li>
              <li className={styles.rulesListItem}>
                Partnerships:{' '}
                <a href="mailto:partnership@amsociety.in" style={{ color: '#D4AF37', textDecoration: 'none' }}>
                  partnership@amsociety.in
                </a>
              </li>
              <li className={styles.rulesListItem}>
                Registered participants will be notified directly via email at each stage transition.
              </li>
            </ul>
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
