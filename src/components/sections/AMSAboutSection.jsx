import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import styles from '../../styles/about.module.css';
import sponsorStyles from '../../styles/sponsors.module.css';

const SponsorsSection = dynamic(() => import('./SponsorsSection'), { ssr: false, loading: () => null });

const SYMBOLS = [
  'σ', 'μ', '∂', '∫', 'Σ', 'Δ', 'λ', '∇', 'π', 'ℝ',
  'E[X]', 'P(A|B)', '∞', 'α', 'β', 'γ', 'θ', '≈', '∈', '→',
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function spawnParticle(id) {
  const edge = Math.floor(Math.random() * 4);
  const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const duration = randomBetween(1.6, 2.8);
  const size = randomBetween(0.6, 0.95);

  if (edge === 0) {
    return { id, symbol, duration, size, left: randomBetween(0, 100), top: 0, tx: randomBetween(-20, 20), ty: randomBetween(-60, -100) };
  } else if (edge === 1) {
    return { id, symbol, duration, size, left: 100, top: randomBetween(0, 100), tx: randomBetween(40, 80), ty: randomBetween(-30, 30) };
  } else if (edge === 2) {
    return { id, symbol, duration, size, left: randomBetween(0, 100), top: 100, tx: randomBetween(-20, 20), ty: randomBetween(60, 100) };
  } else {
    return { id, symbol, duration, size, left: 0, top: randomBetween(0, 100), tx: randomBetween(-40, -80), ty: randomBetween(-30, 30) };
  }
}

function AMSLogoCard() {
  const [hovered, setHovered] = useState(false);
  const [particles, setParticles] = useState([]);
  const intervalRef = useRef(null);
  const idRef = useRef(0);
  const s = sponsorStyles;

  useEffect(() => {
    if (hovered) {
      const spawn = () => {
        const id = idRef.current++;
        setParticles((prev) => [...prev.slice(-20), spawnParticle(id)]);
      };
      spawn();
      intervalRef.current = setInterval(spawn, 180);
    } else {
      clearInterval(intervalRef.current);
      setTimeout(() => setParticles([]), 2800);
    }
    return () => clearInterval(intervalRef.current);
  }, [hovered]);

  return (
    <div
      className={`${s.cardWrapper} ${hovered ? s.cardWrapperHovered : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className={s.mathParticle}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}rem`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
          }}
        >
          {p.symbol}
        </span>
      ))}
      <div className={`${s.logoCard} ${s.logoCard_lg} ${hovered ? s.logoCardHovered : ''} ${styles.overrideLogoCard}`}>
        <Image
          src="/Derive_Logo.svg"
          alt="AMS Derive"
          width={300}
          height={80}
          className={s.logoImg}
          style={{ height: 'auto' }}
        />
      </div>
    </div>
  );
}

const COMMUNITY_PARTNERS = [
  { institution: 'IIT Bombay', club: 'Quant Club', logo: '/IITB-Quant_Club.svg' },
  { institution: 'IIT Delhi', club: 'ANCC', logo: '/IITD_ANCC.png' },
  { institution: 'IIT Kanpur', club: 'Programming Club', logo: '/IITKanpur_PC.png' },
  { institution: 'IIT Kharagpur', club: 'Grimoire of Code', logo: '/IITKGP_GOC.png' },
  { institution: 'IIT Guwahati', club: 'Coding Club', logo: '/IITGuwahati_CodingClub.png' },
  { institution: 'IIIT Hyderabad', club: 'Programming Club', logo: '/IIITH_ProgrammingClub.jpeg' },
  { institution: 'MNNIT Allahabad', club: 'Computer Coding Club', logo: '/MNNIT_Computer_Club.png' },
  { institution: 'VJTI Mumbai', club: 'Coding Club', logo: '/VJTI_CodingClub.jpeg' },
  { institution: 'IIT Mandi', club: 'Programming Club', logo: '/IIT_Mandi_ProgrammingClub.svg' },
  { institution: 'BITS Pilani', club: 'Mathematics Association', logo: '/BITS_Pilani_Math_Association.png' },
  { institution: 'IIT Roorkee', club: 'Finance Club', logo: '/IIT_Roorkee_FinanceClub.png' },
  { institution: 'DJ Sanghvi', club: 'Codestars', logo: '/DJ_Sanghvi_Codestars.svg' },
];

const stats = [
  { number: '2000+', label: 'High-Signal Members' },
  { number: '1500+', label: 'Problems Solved' },
  { number: '01', label: 'Global Contest' },
];

const AMSAboutSection = () => {
  return (
    <section id="ams-about" className={styles.aboutPage}>
      <div className={styles.container}>
        {/* ── Section Title ── */}
        <h2 className={styles.pageTitle}>About Us</h2>

        {/* ── Top Block ── */}
        <div className={styles.topBlock}>
          <div className={styles.premiumHero}>
            <div className={styles.heroLogo}>
              <AMSLogoCard />
            </div>
            <div className={styles.heroContent}>
              <div className={styles.heroText}>
                <h1 className={styles.heroTitle}>High-Signal Meritocracy</h1>
              </div>
              <div className={styles.heroDescription}>
                <p>
                  For those who find standard algorithms insufficient. For those who think in markets, systems, and first principles.
                </p>
                <p>
                  We don&apos;t rank by participation. We identify by rigor. Members engage in intellectual sparring, dissecting problems, debating approaches, designing simulations. We value the thrill of the solve over prestige.
                </p>
              </div>
              <div className={styles.heroStats}>
                {stats.map((s) => (
                  <div key={s.label} className={styles.heroStat}>
                    <span className={styles.heroStatNumber}>{s.number}</span>
                    <span className={styles.heroStatLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* ── Sponsors ── */}
        <SponsorsSection />

        <hr className={styles.divider} />

        {/* ── Community Partners ── */}
        <div className={styles.communityPartnersBlock}>
          <p className={styles.communityPartnersEyebrow}>Outreach Network</p>
          <h2 className={styles.subsectionLabel}>Community Partners</h2>
          <p className={styles.communityPartnersText}>
            We&apos;re grateful to the student clubs and technical societies from India&apos;s top institutions who championed AMS Derive 2026 within their communities. Their outreach brought the contest to thousands of students who thrive on rigor. We look forward to building lasting partnerships with each of these organisations and collaborating on future editions.
          </p>
          <div className={styles.partnerGrid}>
            {COMMUNITY_PARTNERS.map((partner) => (
              <div key={`${partner.institution}-${partner.club}`} className={styles.partnerCard}>
                <div className={styles.partnerLogoWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.logo}
                    alt={`${partner.institution} ${partner.club}`}
                    className={styles.partnerLogo}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className={styles.partnerInfo}>
                  <span className={styles.partnerInstitution}>{partner.institution}</span>
                  <span className={styles.partnerClub}>{partner.club}</span>
                </div>
              </div>
            ))}
          </div>
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
