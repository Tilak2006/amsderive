import styles from '../../styles/sections.module.css';

const AboutSection = () => {
  return (
    <section id="about" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>About AMS Derive</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Quantitative Trading</div>
            <p className={styles.cardText}>
              Experience the fast-paced world of high-frequency trading and derivatives. 
              Develop strategies that survive market volatility.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Mathematics</div>
            <p className={styles.cardText}>
              Apply advanced mathematical modeling to solve complex financial problems. 
              From stochastic calculus to linear algebra.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Algorithmic Thinking</div>
            <p className={styles.cardText}>
              Optimize your code for speed and efficiency. Every microsecond counts 
              when competing in a simulated market environment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
