import styles from '../../styles/sections.module.css';

const WhoSection = () => {
  const categories = [
    {
      title: 'Competitive Programmers',
      desc: 'Top-tier coders who thrive under pressure and enjoy solving algorithmic puzzles.'
    },
    {
      title: 'Mathematics Students',
      desc: 'Analytical minds with a strong foundation in probability, statistics, and calculus.'
    },
    {
      title: 'Quant Enthusiasts',
      desc: 'Aspiring quantitative researchers and traders interested in financial markets.'
    },
    {
      title: 'Finance Engineers',
      desc: 'Engineers who want to build the next generation of financial technology and systems.'
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
