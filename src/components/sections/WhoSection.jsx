import styles from '../../styles/sections.module.css';

const WhoSection = () => {
  const categories = [
    {
      title: 'First-Principles Thinkers',
      desc: 'Anyone who derives solutions from fundamentals rather than templates. Probability, Bayesian reasoning, market microstructure.'
    },
    {
      title: 'Competitive Programmers',
      desc: 'Top-tier algorithmic problem solvers. ICPC, IOI, or Codeforces experience. Ready for novel problem structures.'
    },
    {
      title: 'Mathematics Students',
      desc: 'Strong foundation in probability, stochastic processes, statistics. Analytical minds who think in first principles.'
    },
    {
      title: 'Quant Researchers',
      desc: 'Aspiring quantitative researchers and traders. Interested in signal generation, not just pattern recognition.'
    }
  ];

  return (
    <section id="who" className={styles.section}>
      <div className={styles.containerWide}>
        <h2 className={styles.sectionTitle}>Who Should Participate</h2>
        <div className={styles.gridFour}>
          {categories.map((cat, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.cardTitle}>{cat.title}</div>
              <p className={styles.cardText}>{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoSection;
