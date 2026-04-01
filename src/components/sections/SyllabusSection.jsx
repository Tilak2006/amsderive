import Link from 'next/link';
import styles from '../../styles/syllabus.module.css';

const sections = [
  {
    num: '01',
    title: 'Mathematics',
    areas: [
      {
        name: 'Probability & Inference',
        topics: 'Sample spaces, Conditional probability, Bayes theorem, Discrete and continuous distributions, PMF / PDF / CDF, Joint distributions, Linearity of expectation, Moments, MGFs, Tail bounds'
      },
      {
        name: 'Stochastic Processes',
        topics: 'Markov chains, Transition matrices, Stationary distributions, Random walks, Martingales, Brownian motion intuition'
      },
      {
        name: 'Analytical Foundations',
        topics: 'Derivation over formula recall, First-principles reasoning, Modeling under uncertainty, Structured proof construction'
      }
    ]
  },
  {
    num: '02',
    title: 'Algorithms',
    areas: [
      {
        name: 'Graph Theory',
        topics: 'BFS, DFS, Shortest paths, Trees, Flows and matchings'
      },
      {
        name: 'Dynamic Programming',
        topics: 'Optimal substructure, State design, DP on sequences, DP on trees, DP on graphs'
      },
      {
        name: 'Optimization',
        topics: 'Greedy algorithms, Exchange arguments, Constraint handling, Expected-cost minimization'
      }
    ]
  },
  {
    num: '03',
    title: 'Quant Concepts',
    areas: [
      {
        name: 'Order Books',
        topics: 'Bid-ask structure, Limit and market orders, Price impact intuition'
      },
      {
        name: 'Pricing Intuition',
        topics: 'No-arbitrage reasoning, Risk-neutral thinking, Relative valuation'
      },
      {
        name: 'Arbitrage Logic',
        topics: 'Identifying mispricing, Constructing hedges, Reasoning about market efficiency'
      }
    ]
  }
];

const SyllabusSection = () => {
  return (
    <section id="syllabus" className={styles.syllabusPage}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Syllabus</h1>

        <div className={styles.sectionsWrapper}>
          {sections.map((sec, idx) => (
            <div key={idx}>
              {idx > 0 && <hr className={styles.divider} />}
              <div className={styles.sectionHead}>
                <span className={styles.sectionNum}>{sec.num}</span>
                <h2 className={styles.sectionTitle}>{sec.title}</h2>
              </div>
              <div className={styles.topicTable}>
                {sec.areas.map((area, aIdx) => (
                  <div key={aIdx} className={styles.topicRow}>
                    <span className={styles.topicName}>{area.name}</span>
                    <span className={styles.topicList}>{area.topics}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <hr className={styles.divider} />

        {/* ── Sample Problem CTA ── */}
        <div className={styles.problemCta}>
          <span className={styles.problemCtaEyebrow}>Round I · PRIOR</span>
          <h2 className={styles.problemCtaTitle}>Sample Problem</h2>
          <p className={styles.problemCtaDesc}>See what to expect — a problem representative of Round I difficulty</p>
          <Link href="/problems" className={styles.problemCtaLink}>
            View Problem →
          </Link>
        </div>

        <hr className={styles.divider} />

        {/* ── Resources CTA ── */}
        <div className={styles.resourcesBlock}>
          <div className={styles.resourcesLabel}>Learning Hub</div>
          <h2 className={styles.resourcesTitle}>Want to master these concepts?</h2>
          <p className={styles.resourcesDesc}>
            Check out our curated repository of high-signal resources, books, and problem sets to build your first-principles foundation.
          </p>
          <a
            href="https://amsociety.in/resources"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.resourcesBtn}
          >
            View Resources
          </a>
        </div>
      </div>
    </section>
  );
};

export default SyllabusSection;
