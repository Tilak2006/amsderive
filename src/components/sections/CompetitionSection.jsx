import styles from '../../styles/sections.module.css';

const CompetitionSection = () => {
  return (
    <section id="competition" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Competition Format</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>01</div>
            <div className={styles.cardTitle}>Mathematical Modeling</div>
            <p className={styles.cardText}>
              A rigorous round focused on derivatives pricing, risk management, and 
              statistical arbitrage theory.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>02</div>
            <div className={styles.cardTitle}>Algorithmic Trading</div>
            <p className={styles.cardText}>
              Implement and backtest high-frequency strategies on historical 
              market data using our proprietary engine.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>03</div>
            <div className={styles.cardTitle}>Market Simulation</div>
            <p className={styles.cardText}>
              The final round where your algorithms compete in real-time against 
              other participants in a live simulated exchange.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompetitionSection;
