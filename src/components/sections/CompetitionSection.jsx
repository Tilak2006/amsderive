import styles from '../../styles/sections.module.css';

const CompetitionSection = () => {
  return (
    <section id="competition" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>3-Round Structure</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>01</div>
            <div className={styles.cardTitle}>PRIOR</div>
            <div className={styles.cardSubtitle}>Mathematical Modeling · Online · May 23, 2026</div>
            <p className={styles.cardText}>
              Problems drawn from probability, stochastic processes, expected value, and distribution theory. No templates provided. Individual participation. Build models from first principles, show your reasoning in full.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>02</div>
            <div className={styles.cardTitle}>POSTERIOR</div>
            <div className={styles.cardSubtitle}>Algorithmic + Quant Thinking · Online · June 21, 2026</div>
            <p className={styles.cardText}>
              Competitive-programming style problems with a quantitative layer. Correct answers are not enough — solutions must be efficient and handle edge cases under constraints. Individual participation.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>03</div>
            <div className={styles.cardTitle}>CONVERGENCE</div>
            <div className={styles.cardSubtitle}>Final Round · In-Person, Offline · July 11, 2026</div>
            <p className={styles.cardText}>
              Open-ended, real-world problems co-designed with partner firms. Teams formed on-site. No single correct answer — evaluated on problem framing, reasoning depth, execution, and communication.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompetitionSection;
