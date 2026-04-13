import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/rules.module.css';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | AMS Derive 2026</title>
        <meta
          name="description"
          content="Privacy Policy for AMS Derive 2026. Understand what data we collect, how it is used, who it is shared with, and how to request deletion."
        />
      </Head>

      <Navbar />

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>AMS Derive 2026</p>
            <h1 className={styles.pageTitle}>Privacy Policy</h1>
            <p className={styles.subtitle}>
              Last updated: April 2026. This policy describes what personal data AMS collects, how it is used, and your rights regarding that data.
            </p>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>01 — Who We Are</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                AMS Derive 2026 is organized by the Algorithms and Mathematics Society (AMS), based in India. For privacy-related queries, contact us at{' '}
                <a href="mailto:admin@amsociety.in" style={{ color: '#D4AF37', textDecoration: 'none' }}>
                  admin@amsociety.in
                </a>.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>02 — Data We Collect</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Registration data:</strong> Full name, email address, phone number, institution name, year of study, degree program, and Codeforces handle.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Uploaded documents:</strong> Resume (PDF) and academic transcript (PDF), submitted voluntarily during registration.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Pre-registration data:</strong> Email address, submitted via the interest form before registration opens. Associated with a campus ambassador referral code if applicable.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Technical data:</strong> IP address (hashed, not stored in plaintext), used solely for rate-limiting duplicate or abusive submissions.
              </li>
              <li className={styles.rulesListItem}>
                We do not use cookies for tracking. We do not run advertising pixels, third-party analytics scripts, or behavioral tracking of any kind on this site.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>03 — How We Use Your Data</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                To process your registration, verify eligibility, and manage your participation across all three rounds of AMS Derive 2026.
              </li>
              <li className={styles.rulesListItem}>
                To send you contest-related communications: round schedules, result announcements, verification session invites, and prize coordination. These are operational emails, not marketing.
              </li>
              <li className={styles.rulesListItem}>
                To display your name and institution on internal leaderboards and on the partner firm portal, subject to the data-sharing consent you provide during registration.
              </li>
              <li className={styles.rulesListItem}>
                To attribute campus ambassador referrals for leaderboard tracking purposes.
              </li>
              <li className={styles.rulesListItem}>
                We do not use your data for any purpose unrelated to the administration of AMS Derive 2026 or AMS Society communications.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>04 — Data Sharing with Partner Firms</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Partner firms access participant data only through the AMS Derive firm portal. Access is tiered and controlled by the AMS organizing team.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Tier 1 access (all verified sponsors):</strong> Participant name and institution only. Visible on the leaderboard-style portal view.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Tier 2 access (select firms, granted explicitly):</strong> Resume and LinkedIn profile URL, if submitted and if the participant has consented to data sharing at registration. This tier is not granted to all sponsors.
              </li>
              <li className={styles.rulesListItem}>
                Email address and phone number are never shared with any firm or third party under any circumstances.
              </li>
              <li className={styles.rulesListItem}>
                If you did not consent to data sharing during registration, your profile will not be visible on the firm portal beyond what is publicly visible on the contest leaderboard.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>05 — Data Storage and Security</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                All participant data is stored in Google Firebase (Firestore and Firebase Storage), hosted in the US region. Firebase is operated by Google LLC and subject to Google's security and compliance infrastructure.
              </li>
              <li className={styles.rulesListItem}>
                Uploaded files (resume, transcript) are stored in Firebase Storage with access controlled via Firebase Security Rules. Direct public URLs are not generated. Files are accessible only through authenticated admin or firm-portal sessions.
              </li>
              <li className={styles.rulesListItem}>
                We enforce rate limiting on all form submissions to prevent abuse. IP addresses used for rate limiting are hashed using SHA-256 before storage and are not stored in plaintext.
              </li>
              <li className={styles.rulesListItem}>
                Access to the admin panel is protected by Firebase Authentication with email and password credentials. Admin sessions expire after 8 hours.
              </li>
              <li className={styles.rulesListItem}>
                We apply reasonable technical and organizational measures to protect your data. However, no system is entirely secure. In the event of a data breach affecting personal data, we will notify affected participants within 72 hours of becoming aware.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>06 — Data Retention</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                Registration data for participants who competed in AMS Derive 2026 is retained for a period of 12 months following the conclusion of Round 3 (CONVERGENCE), after which it is deleted from our systems.
              </li>
              <li className={styles.rulesListItem}>
                Pre-registration interest data (email only) is retained until 30 days after the close of registration, then deleted.
              </li>
              <li className={styles.rulesListItem}>
                You may request deletion of your data at any time before the retention period ends. See Section 07 for how to do this.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>07 — Your Rights</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                You have the right to request access to the personal data we hold about you, to request correction of inaccurate data, and to request deletion of your data.
              </li>
              <li className={styles.rulesListItem}>
                Deletion requests will be processed within 7 business days. Note that deleting your data before the competition concludes will result in your registration being voided and your removal from the contest.
              </li>
              <li className={styles.rulesListItem}>
                To exercise any of these rights, email{' '}
                <a href="mailto:admin@amsociety.in" style={{ color: '#D4AF37', textDecoration: 'none' }}>
                  admin@amsociety.in
                </a>{' '}
                with the subject line "Data Request" and your registered email address.
              </li>
              <li className={styles.rulesListItem}>
                We do not sell personal data to any third party, and we never will.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>08 — Third-Party Services</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Firebase (Google LLC):</strong> Database, file storage, and authentication. Subject to Google's Privacy Policy.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Resend:</strong> Transactional email delivery for registration confirmations and contest communications. Only your email address is passed to Resend for the purpose of sending these emails. Resend does not receive any other personal data.
              </li>
              <li className={styles.rulesListItem}>
                <strong style={{ color: '#e0e0e0' }}>Vercel:</strong> Hosting and serverless function execution. Vercel may log IP addresses transiently as part of standard request processing. These logs are not retained by AMS.
              </li>
              <li className={styles.rulesListItem}>
                We do not use Google Analytics, Meta Pixel, Hotjar, or any other behavioral analytics or advertising platform.
              </li>
            </ul>
          </div>

          <div className={styles.rulesCard}>
            <p className={styles.rulesSectionTitle}>09 — Changes to This Policy</p>
            <ul className={styles.rulesList}>
              <li className={styles.rulesListItem}>
                We may update this Privacy Policy as needed to reflect changes in our practices or applicable law. Updated versions will be posted on this page with a revised date at the top.
              </li>
              <li className={styles.rulesListItem}>
                Material changes will be communicated via email to all registered participants.
              </li>
              <li className={styles.rulesListItem}>
                Questions about this policy can be sent to{' '}
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
