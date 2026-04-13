import styles from '../../styles/competition.module.css';

const ROUNDS = [
  {
    num: '01',
    title: 'PRIOR',
    tags: ['Individual', 'Online'],
    what: 'Mathematical Modeling',
    text: 'Problems drawn from probability theory, stochastic processes, expected value, and distribution theory. No templates provided. Build models from first principles and show your full reasoning, partial credit awarded for methodology.',
  },
  {
    num: '02',
    title: 'POSTERIOR',
    tags: ['Individual', 'Online'],
    what: 'Algorithmic + Quant Thinking',
    text: 'Competitive-programming problems with a quantitative layer. Correct answers alone are not enough, solutions must be efficient and handle edge cases under tight constraints. Filters verified Round 1 performers.',
  },
  {
    num: '03',
    title: 'CONVERGENCE',
    tags: ['Teams of 3', 'Offline Finals'],
    what: 'Open-Ended Firm Problems',
    text: 'Real-world problems co-designed with partner firms. No single correct answer. Evaluated on problem framing, reasoning depth, execution quality, and communication. Finals hosted at one of the prestigious IITs.',
  },
];

const CompetitionSection = () => (
  <section id="competition" className={styles.section}>
    <div className={styles.container}>
      <span className={styles.eyebrow}>What You Will Face</span>
      <h2 className={styles.title}>3-Round Structure</h2>
      <div className={styles.rows}>
        {ROUNDS.map(({ num, title, tags, what, text }) => (
          <div key={num} className={styles.row}>
            <div className={styles.rowLeft}>
              <span className={styles.num}>{num}</span>
              <div className={styles.roundName}>{title}</div>
              <div className={styles.what}>{what}</div>
              <div className={styles.tags}>
                {tags.map(t => (
                  <span key={t} className={styles.tag}>{t}</span>
                ))}
              </div>
            </div>
            <div className={styles.dividerVert} />
            <p className={styles.text}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default CompetitionSection;
