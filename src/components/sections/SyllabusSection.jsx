import styles from '../../styles/syllabus.module.css';

const SyllabusSection = () => {
  const subsections = [
    {
      title: 'MATHEMATICS',
      cards: [
        {
          title: 'Probability & Inference',
          desc: 'Topics: Sample spaces, Conditional probability, Bayes theorem, Discrete and continuous distributions, PMF PDF CDF, Joint distributions, Linearity of expectation, Moments, MGFs, Tail bounds.'
        },
        {
          title: 'Stochastic Processes',
          desc: 'Topics: Markov chains, Transition matrices, Stationary distributions, Random walks, Martingales, Basic Brownian motion intuition.'
        },
        {
          title: 'Analytical Foundations',
          desc: 'Topics: Derivation over formula recall, First-principles reasoning, Modeling under uncertainty, Structured proof construction.'
        }
      ]
    },
    {
      title: 'ALGORITHMS',
      cards: [
        {
          title: 'Graph Theory',
          desc: 'Topics: BFS, DFS, Shortest paths, Trees, Flows and matchings.'
        },
        {
          title: 'Dynamic Programming',
          desc: 'Topics: Optimal substructure, State design, DP on sequences trees and graphs.'
        },
        {
          title: 'Optimization',
          desc: 'Topics: Greedy algorithms, Exchange arguments, Constraint handling, Expected-cost minimization.'
        }
      ]
    },
    {
      title: 'QUANT CONCEPTS',
      cards: [
        {
          title: 'Order Books',
          desc: 'Topics: Bid-ask structure, Limit and market orders, Price impact intuition.'
        },
        {
          title: 'Pricing Intuition',
          desc: 'Topics: No-arbitrage reasoning, Risk-neutral thinking, Relative valuation.'
        },
        {
          title: 'Arbitrage Logic',
          desc: 'Topics: Identifying mispricing, Constructing hedges, Reasoning about market efficiency.'
        }
      ]
    }
  ];

  return (
    <section id="syllabus" className={styles.syllabusPage}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Syllabus</h1>
        <div className={styles.subsectionsWrapper}>
          {subsections.map((sub, idx) => (
            <div key={idx} className={styles.subsection}>
              {idx > 0 && <hr className={styles.divider} />}
              <h2 className={styles.subsectionLabel}>{sub.title}</h2>
              {sub.note && <p className={styles.subsectionNote}>{sub.note}</p>}
              <div className={styles.grid}>
                {sub.cards.map((card, cIdx) => (
                  <div key={cIdx} className={styles.card}>
                    <div className={styles.cardTitle}>{card.title}</div>
                    <p className={styles.cardText}>{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
