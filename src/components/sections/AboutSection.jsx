import styles from '../../styles/sections.module.css';

const CARDS = [
  {
    index: '01',
    title: 'First Principles Thinking',
    text: 'Problems derived from probability theory, Bayesian inference, and market microstructure. No standard DSA templates applicable.',
  },
  {
    index: '02',
    title: 'Structured Problem Solving',
    text: 'Stochastic processes, options pricing, and reasoning under uncertainty. Build strategies that survive market constraints.',
  },
  {
    index: '03',
    title: 'Derivation, Not Pattern Recognition',
    text: 'AMS evaluates how you think, not just what you produce. Process matters. Reasoning ability. Communication.',
  },
];

const AboutSection = () => (
  <section id="about" className={styles.section}>
    <div className={styles.container}>
      <span className={styles.sectionEyebrow}>What We Test</span>
      <h2 className={styles.sectionTitle}>About AMS Derive</h2>
      <div className={styles.grid}>
        {CARDS.map(({ index, title, text }) => (
          <div key={index} className={styles.card}>
            <span className={styles.cardIndex}>{index}</span>
            <div className={styles.cardTitle}>{title}</div>
            <p className={styles.cardText}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default AboutSection;
