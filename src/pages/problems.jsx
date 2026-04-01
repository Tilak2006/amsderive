import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/problems.module.css';

export default function ProblemsPage() {
  return (
    <>
      <Head>
        <title>Sample Problem | AMS Derive 2026</title>
        <meta
          name="description"
          content="A sample problem representative of Round I (PRIOR) of AMS Derive 2026 — Expected Inversions."
        />
      </Head>

      <Navbar />

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>Round I · PRIOR</p>
            <h1 className={styles.pageTitle}>Sample Problem</h1>
            <p className={styles.subtitle}>
              Representative of the style and difficulty you can expect in Round I.
            </p>
          </div>

          <div className={styles.problemCard}>
            {/* Meta row */}
            <div className={styles.problemMeta}>
              <span className={styles.problemRound}>Round I · PRIOR</span>
              <span className={styles.problemLimits}>2.0s &nbsp;·&nbsp; 256 MB</span>
            </div>

            {/* Title */}
            <h2 className={styles.problemTitle}>
              Expected Inversions&nbsp;
              <span className={styles.problemTag}>Dice DP</span>
            </h2>

            {/* Problem Statement */}
            <div className={styles.problemBlock}>
              <p className={styles.problemBlockTitle}>Problem Statement</p>
              <div className={styles.problemText}>
                <p>
                  Alice is hosting a tournament with <em>N</em> independent bots.
                  Each bot plays a mini-game to determine its final score.
                </p>
                <p>
                  The mini-game works as follows: Each bot starts with a score of 0.
                  They are given a special <em>M</em>-sided die, where the faces have
                  integer values <em>A</em><sub>1</sub>, <em>A</em><sub>2</sub>,&nbsp;…,&nbsp;
                  <em>A</em><sub>M</sub>. The bot rolls the die exactly <em>K</em> times
                  and adds the results of the rolls to its score. All rolls are independent,
                  and each face has an equal probability of 1/<em>M</em> of appearing on
                  any given roll.
                </p>
                <p>
                  After all <em>N</em> bots have finished their <em>K</em> rolls, their
                  final scores are placed into an array{' '}
                  <em>S</em>&nbsp;= [<em>S</em><sub>1</sub>,&nbsp;<em>S</em><sub>2</sub>,
                  &nbsp;…,&nbsp;<em>S</em><sub>N</sub>].
                </p>
                <p>
                  An <strong>inversion</strong> in the array <em>S</em> is defined as a
                  pair of indices (<em>i</em>,&nbsp;<em>j</em>) such that{' '}
                  1&nbsp;&#8804;&nbsp;<em>i</em>&nbsp;&lt;&nbsp;<em>j</em>&nbsp;&#8804;&nbsp;<em>N</em>
                  {' '}and <em>S</em><sub>i</sub>&nbsp;&gt;&nbsp;<em>S</em><sub>j</sub>.
                </p>
                <p>
                  Find the <strong>expected number of inversions</strong> in the array{' '}
                  <em>S</em>. Because this expected value can be a rational number,
                  output it modulo 998244353.
                </p>
              </div>
            </div>

            {/* Input */}
            <div className={styles.problemBlock}>
              <p className={styles.problemBlockTitle}>Input</p>
              <div className={styles.problemText}>
                <p>
                  The first line contains three integers <em>N</em>, <em>K</em>, and{' '}
                  <em>M</em>{' '}
                  (2&nbsp;&#8804;&nbsp;<em>N</em>&nbsp;&#8804;&nbsp;10<sup>9</sup>,{' '}
                  1&nbsp;&#8804;&nbsp;<em>K</em>&nbsp;&#8804;&nbsp;10<sup>5</sup>,{' '}
                  1&nbsp;&#8804;&nbsp;<em>M</em>&nbsp;&#8804;&nbsp;100){' '}
                  — the number of bots, the number of rolls each bot makes, and the
                  number of faces on the die.
                </p>
                <p>
                  The second line contains <em>M</em> integers{' '}
                  <em>A</em><sub>1</sub>,&nbsp;<em>A</em><sub>2</sub>,&nbsp;…,&nbsp;
                  <em>A</em><sub>M</sub>{' '}
                  (1&nbsp;&#8804;&nbsp;<em>A</em><sub>i</sub>&nbsp;&#8804;&nbsp;20){' '}
                  — the values on the faces of the die.
                </p>
              </div>
            </div>

            {/* Output */}
            <div className={styles.problemBlock}>
              <p className={styles.problemBlockTitle}>Output</p>
              <div className={styles.problemText}>
                <p>
                  Print a single integer — the expected number of inversions modulo 998244353.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.problemFooter}>
              <p className={styles.problemAuthor}>
                Problem by{' '}
                <a
                  href="https://www.linkedin.com/in/kartik-agrawal-4b71192b7/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.authorLink}
                >
                  Kartik Aggrawal
                </a>
              </p>
              <p className={styles.submitNote}>
                Submit your solution and editorial to{' '}
                <a href="mailto:admin@amsociety.in" className={styles.submitLink}>
                  admin@amsociety.in
                </a>
              </p>
            </div>
          </div>

          <Link href="/syllabus" className={styles.backLink}>
            ← Back to Syllabus
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
