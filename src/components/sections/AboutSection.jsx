import styles from '../../styles/sections.module.css';

const AboutSection = () => {
  return (
    <section id="about" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>About AMS DERIVE</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>First Principles Thinking</div>
            <p className={styles.cardText}>
              Problems derived from probability theory, Bayesian inference, and market microstructure. No standard DSA templates applicable.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Structured Problem Solving</div>
            <p className={styles.cardText}>
              Stochastic processes, options pricing, and reasoning under uncertainty. Build strategies that survive market constraints.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Derivation, Not Pattern Recognition</div>
            <p className={styles.cardText}>
              AMS evaluates how you think, not just what you produce. Process matters. Reasoning ability. Communication.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
