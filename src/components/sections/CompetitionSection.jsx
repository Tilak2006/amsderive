import styles from '../../styles/competition.module.css';

const ROUNDS = [
  {
    num: '01',
    title: 'PRIOR',
    tags: ['Individual', 'Codeforces', 'ICPC Style'],
    what: 'Qualifier',
    text: 'Round 1 is the mass filter. Problems focus on probability theory, Bayesian inference, and market microstructure. No templates transfer here — solve from first principles under contest pressure.',
  },
  {
    num: '02',
    title: 'POSTERIOR',
    tags: ['Individual', 'Online'],
    what: 'Prelims',
    text: 'Round 2 is the difficulty spike. Expect stochastic processes, options pricing, and combinatorics, with external setters and a harder online format designed for true signal validation.',
  },
  {
    num: '03',
    title: 'CONVERGENCE',
    tags: ['Invite-Only', 'IIT', 'Live Duel'],
    what: 'Finals',
    text: 'Round 3 is the prestige moment. 30–50 finalists meet at IIT to solve from a syllabus of puzzles, probability, the Kelly criterion, random walks, Monte Carlo simulation, expected value, and Bayesian questions. The top 2 enter a live 1v1 Derivation Duel.',
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
