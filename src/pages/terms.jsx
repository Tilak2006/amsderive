import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/rules.module.css';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service | AMS Derive 2026</title>
        <meta
          name="description"
          content="Terms of Service for AMS Derive 2026. Read the conditions governing participation, intellectual property, liability, and conduct."
        />
      </Head>

      <Navbar />

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>AMS Derive 2026</p>
            <h1 className={styles.pageTitle}>Terms of Service</h1>
            <p className={styles.subtitle}>
              Last updated: April 2026. By registering for or participating in AMS Derive 2026, you agree to these terms in full.
            </p>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>01 — Acceptance of Terms</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                These Terms of Service govern your access to and participation in AMS Derive 2026, organized by the Algorithms and Mathematics Society (AMS). By completing registration, you confirm that you have read, understood, and agree to be bound by these terms.
              </li>
              <li className={styles.rulesListItem}>
                If you do not agree to any part of these terms, you must not register or participate.
              </li>
              <li className={styles.rulesListItem}>
                AMS reserves the right to update these terms at any time. Changes will be communicated via email to registered participants and posted on this page. Continued participation after an update constitutes acceptance.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>02 — Eligibility</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Participation is open to students currently enrolled in a B.Tech, M.Tech, B.S., M.S., Ph.D., or equivalent technical degree program at an Indian institution. Recent alumni who graduated within the last 12 months are also eligible.
              </li>
              <li className={styles.rulesListItem}>
                Full-time employed quants, traders, or financial professionals are not eligible, regardless of educational qualifications.
              </li>
              <li className={styles.rulesListItem}>
                You are responsible for ensuring your eligibility at the time of registration. AMS reserves the right to verify eligibility at any point and to disqualify participants who do not meet the criteria, including after results have been announced.
              </li>
              <li className={styles.rulesListItem}>
                Registration constitutes your representation that all information submitted is accurate and truthful.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>03 — Registration and Account</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Each individual may register only once. Duplicate registrations will be removed and may result in disqualification of both entries.
              </li>
              <li className={styles.rulesListItem}>
                You are responsible for the accuracy of all information provided during registration, including your name, institution, Codeforces handle, and contact details.
              </li>
              <li className={styles.rulesListItem}>
                Registration does not guarantee advancement beyond Round 1. Participation in subsequent rounds is subject to performance and compliance with all rules.
              </li>
              <li className={styles.rulesListItem}>
                Spots are limited to 1,000. Registration closes on 15 May 2026 or when capacity is reached, whichever comes first. No waitlist is maintained.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>04 — Competition Conduct</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Rounds 1 (PRIOR) and 2 (POSTERIOR) are individual assessments. All work submitted must be solely your own. Use of generative AI tools, collaboration with other participants, or any form of external assistance is prohibited and actively monitored.
              </li>
              <li className={styles.rulesListItem}>
                Mandatory full-screen OBS recording is required for all online rounds. Submissions without a valid recording are void. No exceptions or appeals will be entertained on this point.
              </li>
              <li className={styles.rulesListItem}>
                Selected participants will be required to attend a remote technical verification session following Rounds 1 and 2. Inability or refusal to participate in verification results in disqualification.
              </li>
              <li className={styles.rulesListItem}>
                Any attempt to gain unfair advantage, including reverse-engineering the contest infrastructure, accessing problems before the official start, or disrupting other participants, will result in permanent disqualification and may be reported to your institution.
              </li>
              <li className={styles.rulesListItem}>
                AMS decisions regarding disqualification, scoring, and advancement are final. No appeals will be considered except in cases of documented technical error on the part of AMS.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>05 — Intellectual Property</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                All problem statements, scoring rubrics, contest materials, and editorial content are the intellectual property of AMS and its contributing problem setters. You may not reproduce, distribute, or publish any contest material without prior written consent from AMS.
              </li>
              <li className={styles.rulesListItem}>
                Solutions submitted by participants remain the intellectual property of the participant. By submitting, you grant AMS a non-exclusive, royalty-free license to use anonymized or attributed versions of submitted solutions for educational, editorial, or promotional purposes.
              </li>
              <li className={styles.rulesListItem}>
                You may not share problem statements or your solutions publicly until the official editorial window announced by AMS.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>06 — Prizes and Recognition</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Prizes are awarded at the sole discretion of AMS following the completion of Round 3 (CONVERGENCE). Prize amounts and categories are subject to change based on final sponsor confirmation.
              </li>
              <li className={styles.rulesListItem}>
                Prize disbursement is contingent on the winner providing valid identity and bank details within the timeframe specified by AMS. Failure to respond within the given window forfeits the prize.
              </li>
              <li className={styles.rulesListItem}>
                Prizes are non-transferable. Tax obligations arising from prize receipt are the sole responsibility of the recipient.
              </li>
              <li className={styles.rulesListItem}>
                Firm interview invitations and shortlisting opportunities facilitated through AMS Derive are at the discretion of the respective firms. AMS does not guarantee any employment or internship outcome.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>07 — Limitation of Liability</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                AMS Derive is an educational competition. AMS is not liable for any direct, indirect, incidental, or consequential loss arising from participation, including but not limited to loss of opportunity, loss of data, or technical failures on the participant's end.
              </li>
              <li className={styles.rulesListItem}>
                AMS is not responsible for submission failures caused by the participant's internet connectivity, device issues, or failure to follow submission instructions.
              </li>
              <li className={styles.rulesListItem}>
                In the event of a platform outage or technical failure on AMS's infrastructure during a contest window, AMS will communicate remediation steps via email. This is the sole recourse available to affected participants.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>08 — Termination</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                AMS reserves the right to disqualify any participant, cancel any round, or terminate the competition entirely in response to widespread integrity violations, force majeure events, or other circumstances beyond reasonable control.
              </li>
              <li className={styles.rulesListItem}>
                In the event of cancellation before Round 3, AMS will make reasonable efforts to communicate outcomes and recognize participants who had already advanced.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>09 — Governing Law</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                These terms are governed by the laws of India. Any disputes arising from participation in AMS Derive 2026 shall be subject to the jurisdiction of courts in Mumbai, Maharashtra.
              </li>
              <li className={styles.rulesListItem}>
                For questions regarding these terms, contact{' '}
                <a href="mailto:admin@amsociety.in" style={{ color: '#D4AF37', textDecoration: 'none' }}>
                  admin@amsociety.in
                </a>.
              </li>
            </ul>
          </div>

          <Link href="/" className={styles.backLink}>
            &larr; Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
