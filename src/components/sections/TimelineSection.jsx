import styles from '../../styles/sections.module.css';

const TimelineSection = () => {
  const events = [
    {
      date: 'MARCH 20, 2026',
      title: 'Registrations Open',
      desc: 'Early bird access and system on-boarding for all participants.'
    },
    {
      date: 'APRIL 15, 2026',
      title: 'Round 1: Mathematical Modeling',
      desc: 'Online qualification round focused on derivatives and math.'
    },
    {
      date: 'MAY 05, 2026',
      title: 'Round 2: Algorithmic Trading',
      desc: 'Backtesting phase for algorithmic strategy implementation.'
    },
    {
      date: 'MAY 25, 2026',
      title: 'Finals: Market Simulation',
      desc: 'Live trading battle between the top performing teams.'
    }
  ];

  return (
    <section id="timeline" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Timeline</h2>
        <div className={styles.timeline}>
          {events.map((event, index) => (
            <div key={index} className={styles.timelineItem}>
              <div className={styles.timelineDate}>{event.date}</div>
              <div className={styles.timelineTitle}>{event.title}</div>
              <div className={styles.timelineDesc}>{event.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
