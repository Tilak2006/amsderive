import styles from '../../styles/sections.module.css';

const CATEGORIES = [
  {
    index: '01',
    title: 'First-Principles Thinkers',
    desc: 'Anyone who derives solutions from fundamentals rather than templates. Probability, Bayesian reasoning, market microstructure.',
  },
  {
    index: '02',
    title: 'Competitive Programmers',
    desc: 'Top-tier algorithmic problem solvers. ICPC, IOI, or Codeforces experience. Ready for novel problem structures.',
  },
  {
    index: '03',
    title: 'Mathematics Students',
    desc: 'Strong foundation in probability, stochastic processes, statistics. Analytical minds who think in first principles.',
  },
  {
    index: '04',
    title: 'Quant Researchers',
    desc: 'Aspiring quantitative researchers and traders. Interested in signal generation, not just pattern recognition.',
  },
];

const WhoSection = () => (
  <section id="who" className={styles.section}>
    <div className={styles.containerWide}>
      <span className={styles.sectionEyebrow}>Target Profile</span>
      <h2 className={styles.sectionTitle}>Who Should Participate</h2>
      <div className={styles.gridFour}>
        {CATEGORIES.map(({ index, title, desc }) => (
          <div key={index} className={styles.card}>
            <span className={styles.cardIndex}>{index}</span>
            <div className={styles.cardTitle}>{title}</div>
            <p className={styles.cardText}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhoSection;
