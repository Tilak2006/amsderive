import styles from '../../styles/sections.module.css';

const TimelineSection = () => {
  const events = [
    {
      date: 'APRIL 20, 2026',
      title: 'Registrations Open',
      desc: 'Participant registrations begin.'
    },
    {
      date: 'MAY 23, 2026',
      title: 'Round 1: PRIOR',
      desc: 'Online qualification round focused on derivatives and math.'
    },
    {
      date: 'JUNE 21, 2026',
      title: 'Round 2: POSTERIOR',
      desc: 'Advanced round for top performers.'
    },
    {
      date: 'JULY 11, 2026',
      title: 'Finals: CONVERGENCE',
      desc: 'Onsite coding round for the top competitors.'
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
