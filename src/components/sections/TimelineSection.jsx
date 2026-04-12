import Link from 'next/link';
import styles from '../../styles/timeline.module.css';

const EVENTS = [
  {
    index: '01',
    date: 'April 20, 2026',
    timestamp: new Date('2026-04-20'),
    title: 'Registrations Open',
    desc: 'Free to participate. Open to all enrolled students and recent alumni from Indian institutions.',
    cta: true,
  },
  {
    index: '02',
    date: 'May 23, 2026',
    timestamp: new Date('2026-05-23'),
    title: 'Round 1 | PRIOR',
    desc: 'Online qualification. Probability theory, Bayesian inference, market microstructure. Hosted on Codeforces.',
  },
  {
    index: '03',
    date: 'June 21, 2026',
    timestamp: new Date('2026-06-21'),
    title: 'Round 2 | POSTERIOR',
    desc: 'Advanced round. Stochastic processes, options pricing. Filters verified Round 1 performers.',
  },
  {
    index: '04',
    date: 'July 11, 2026',
    timestamp: new Date('2026-07-11'),
    title: 'Round 3 | CONVERGENCE',
    desc: 'Finals. Teams of 3. Offline at one of the prestigious IITs. Open-ended quant problems with firm evaluation.',
  },
];

function getPhase(timestamp) {
  const now = new Date();
  const end = new Date(timestamp);
  end.setDate(end.getDate() + 1); // treat as end-of-day
  if (now > end) return 'past';
  // "active" = within 14 days before or same day
  const diffDays = (timestamp - now) / (1000 * 60 * 60 * 24);
  if (diffDays <= 14 && diffDays >= -1) return 'active';
  return 'future';
}

const TimelineSection = () => {
  const now = new Date();
  const phases = EVENTS.map(e => getPhase(e.timestamp));

  // How many columns are "past" — drives the gold line fill
  const pastCount = phases.filter(p => p === 'past').length;
  const activeIdx = phases.indexOf('active');

  // gold line covers: all past nodes + half-step to active node centre
  // each col is 25% wide, node centre is at col-midpoint = (i + 0.5) * 25%
  // track line spans col 0 centre → col 3 centre = 75% of track width
  // expressed as % of track::after width space (which is 75% of container)
  let goldFraction = 0;
  if (pastCount > 0 || activeIdx >= 0) {
    const lastFilledIdx = activeIdx >= 0 ? activeIdx : pastCount - 1;
    // node centres: col i → position (i * 25 + 12.5)% across the full container
    // but track::after starts at 12.5% and ends at 87.5% (75% total)
    // gold fill = distance from first node to current node / total span
    const totalSpan = 75; // percent: from 12.5% to 87.5%
    const filledSpan = lastFilledIdx * 25;
    goldFraction = Math.min(filledSpan / totalSpan, 1);
  }

  const goldWidthPct = `${Math.round(goldFraction * 100)}%`;

  return (
    <section id="timeline" className={styles.timelineSection}>
      <div className={styles.container}>
        <span className={styles.eyebrow}>Schedule</span>
        <h2 className={styles.title}>Timeline</h2>

        <div
          className={styles.track}
          style={{ '--gold-width': goldWidthPct }}
        >
          {EVENTS.map(({ index, date, timestamp, title, desc, cta }, i) => {
            const phase = phases[i];
            const isPast = phase === 'past';
            const isActive = phase === 'active';
            const isFuture = phase === 'future';

            const regOpen = now >= new Date('2026-04-20');

            return (
              <div key={index} className={styles.col}>
                {/* Node */}
                <div
                  className={[
                    styles.node,
                    isPast ? styles.nodePast : '',
                    isActive ? styles.nodeActive : '',
                  ].join(' ')}
                >
                  {index}
                </div>

                {/* Card */}
                <div
                  className={[
                    styles.card,
                    isPast ? styles.cardPast : '',
                    isActive ? styles.cardActive : '',
                    isFuture ? styles.cardFuture : '',
                  ].join(' ')}
                >
                  {isActive && (
                    <span className={styles.activeBadge}>
                      <span className={styles.activeDot} />
                      {cta ? 'Opening soon' : 'Active'}
                    </span>
                  )}

                  <div className={[styles.date, isFuture ? styles.dateFuture : ''].join(' ')}>
                    {date}
                  </div>

                  <div className={[styles.cardTitle, isFuture ? styles.cardTitleFuture : ''].join(' ')}>
                    {title}
                  </div>

                  <p className={styles.cardDesc}>{desc}</p>

                  {cta && (
                    regOpen
                      ? (
                        <Link href="/register" className={styles.ctaBtn}>
                          Register Now
                        </Link>
                      ) : (
                        <span className={[styles.ctaBtn, styles.ctaBtnDisabled].join(' ')}>
                          Opens Apr 20
                        </span>
                      )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
