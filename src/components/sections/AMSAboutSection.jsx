import styles from '../../styles/about.module.css';

const researchAreas = [
  { id: '01', text: 'Stochastic processes & probabilistic modeling' },
  { id: '02', text: 'Algorithmic game theory & market mechanisms' },
  { id: '03', text: 'High-performance computing & architecture' },
  { id: '04', text: 'Advanced combinatorics & number theory' },
  { id: '05', text: 'Competitive programming with mathematical depth' },
  { id: '06', text: 'Quantitative finance & strategy simulation' },
];

const stats = [
  { number: '1000+', label: 'High-Signal Members', desc: 'Curated network of top problem solvers.' },
  { number: '1500+', label: 'Problems Solved', desc: 'Hours of deep computational work.' },
  { number: '01', label: 'Global Contest', desc: 'Rigorous monthly algorithmic events.' },
];

const AMSAboutSection = () => {
  return (
    <section id="ams-about" className={styles.aboutPage}>
      <div className={styles.container}>
        {/* ── Title ── */}
        <h1 className={styles.pageTitle}>About AMS</h1>

        {/* ── Mission ── */}
        <div className={styles.missionBlock}>
          <h2 className={styles.missionLead}>High-signal meritocracy.</h2>
          <p className={styles.missionText}>
            There are no passive observers here. Members engage in &ldquo;intellectual sparring&rdquo; dissecting problems, debating approaches, and designing their own market simulations. We value the thrill of the solve over the prestige of the rank.
          </p>
          <p className={styles.missionText}>
            Beyond standard algorithms, we explore how code behaves in volatile environments. We analyze the trade-offs between theoretical purity and system performance, mirroring the intellectual demands of top-tier quantitative research firms.
          </p>
        </div>

        <hr className={styles.divider} />

        {/* ── Research & Application ── */}
        <h2 className={styles.subsectionLabel}>Research &amp; Application</h2>
        <div className={styles.researchGrid}>
          {researchAreas.map((area) => (
            <div key={area.id} className={styles.researchCard}>
              <span className={styles.researchIndex}>{area.id}</span>
              <span className={styles.researchText}>{area.text}</span>
            </div>
          ))}
        </div>

        <hr className={styles.divider} />

        {/* ── The Talent Pool ── */}
        <h2 className={styles.subsectionLabel}>The Talent Pool</h2>
        <div className={styles.statsRow}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
              <p className={styles.statDesc}>{stat.desc}</p>
            </div>
          ))}
        </div>

        <hr className={styles.divider} />

        {/* ── Join The Network ── */}
        <div className={styles.joinBlock}>
          <h2 className={styles.subsectionLabel}>Join The Network</h2>
          <p className={styles.joinText}>
            AMS is the home for students who find the standard curriculum too slow. If you get a thrill from deriving an expected value formula, optimizing a graph traversal, or modeling market dynamics, you belong here. Connect with like-minded peers building the future of quant and systems.
          </p>
          <div className={styles.communityLinks}>
            <a
              href="https://chat.whatsapp.com/L1N6lksa6t3KW2I9Z7fHyq?mode=gi_t"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.communityBtn} ${styles.communityBtnPrimary}`}
            >
              Join WhatsApp Community
            </a>
            <a
              href="https://discord.gg/fgm4CnBKzV"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.communityBtn} ${styles.communityBtnOutline}`}
            >
              Join Discord Community
            </a>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* ── Campus Ambassador CTA ── */}
        <div className={styles.ambassadorBlock}>
          <div className={styles.ambassadorLabel}>Opportunity</div>
          <h2 className={styles.ambassadorTitle}>Represent AMS at Your Institution</h2>
          <p className={styles.ambassadorDesc}>
            We&apos;re looking for driven individuals to champion the AMS mission on their campus. Lead the conversation around quantitative excellence.
          </p>
          <a
            href="https://forms.gle/vKFRue7xoYw6gYdf9"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ambassadorBtn}
          >
            Apply as Campus Ambassador
          </a>
        </div>
      </div>
    </section>
  );
};

export default AMSAboutSection;
