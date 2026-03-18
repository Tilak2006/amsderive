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
            <div className={styles.cardSubtitle}>Online Qualifier · May 23, 2026</div>
            <p className={styles.cardText}>
              ICPC format on Codeforces Gym. Individual participation. Problems derived from first principles in probability theory, Bayesian inference, and market microstructure.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>02</div>
            <div className={styles.cardTitle}>POSTERIOR</div>
            <div className={styles.cardSubtitle}>Online Prelims · June 21, 2026</div>
            <p className={styles.cardText}>
              Harder problem set by external problem-setters. Stochastic processes, options pricing, probability under market constraints. Filters verified Round 1 performers.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>03</div>
            <div className={styles.cardTitle}>CONVERGENCE</div>
            <div className={styles.cardSubtitle}>Offline Finals · July 11, 2026</div>
            <p className={styles.cardText}>
              Two components: Chess and Poker under evaluation conditions, then a quant build challenge with real market data under p99 latency constraints. Teams of 3. Problem co-designed with Apex Partner.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompetitionSection;
