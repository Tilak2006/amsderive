import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from '../../styles/sections.module.css';
import s from '../../styles/sponsors.module.css';

const SYMBOLS = [
  'σ', 'μ', '∂', '∫', 'Σ', 'Δ', 'λ', '∇', 'π', 'ℝ',
  'E[X]', 'P(A|B)', '∞', 'α', 'β', 'γ', 'θ', '≈', '∈', '→',
];

const TIERS = [
  {
    id: 'apex',
    label: 'Apex Partner',
    sponsors: [
      { name: 'Jane Street', logo: '/Jane_Street.svg', url: 'https://www.janestreet.com' },
    ],
  },
  {
    id: 'convergence',
    label: 'Convergence Partner',
    sponsors: [],
  },
  {
    id: 'derivation',
    label: 'Derivation Partner',
    sponsors: [],
  },
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
    return { id, symbol, duration, size, left: randomBetween(0, 100), top: 0,   tx: randomBetween(-20, 20),  ty: randomBetween(-60, -100) };
  } else if (edge === 1) {
    return { id, symbol, duration, size, left: 100,                   top: randomBetween(0, 100), tx: randomBetween(40, 80),   ty: randomBetween(-30, 30) };
  } else if (edge === 2) {
    return { id, symbol, duration, size, left: randomBetween(0, 100), top: 100,  tx: randomBetween(-20, 20),  ty: randomBetween(60, 100) };
  } else {
    return { id, symbol, duration, size, left: 0,                     top: randomBetween(0, 100), tx: randomBetween(-40, -80), ty: randomBetween(-30, 30) };
  }
}

function SponsorCard({ sponsor, size, isApex }) {
  const [hovered, setHovered] = useState(false);
  const [particles, setParticles] = useState([]);
  const intervalRef = useRef(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (!isApex) return;
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
  }, [hovered, isApex]);

  const imgW = size === 'lg' ? 300 : size === 'md' ? 210 : 160;
  const imgH = size === 'lg' ? 80  : size === 'md' ? 56  : 44;

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
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${s.logoCard} ${s[`logoCard_${size}`]} ${hovered ? s.logoCardHovered : ''}`}
        aria-label={`Visit ${sponsor.name}`}
      >
        <Image
          src={sponsor.logo}
          alt={sponsor.name}
          width={imgW}
          height={imgH}
          className={s.logoImg}
        />
      </a>
    </div>
  );
}

const SponsorsSection = () => (
  <section id="sponsors" className={styles.section}>
    <div className={styles.container}>
      <p className={s.eyebrow}>Quantitative Partners</p>
      <h2 className={styles.sectionTitle}>Our Sponsors</h2>

      {TIERS.filter((tier) => tier.sponsors.length > 0).map((tier) => (
        <div key={tier.id} className={s.tier}>
          <p className={`${s.tierLabel} ${s[`tierLabel_${tier.id}`]}`}>
            {tier.label}
          </p>
          <div className={`${s.logoRow} ${s[`logoRow_${tier.id}`]}`}>
            {tier.sponsors.map((sponsor) => (
              <SponsorCard
                key={sponsor.name}
                sponsor={sponsor}
                size={tier.id === 'apex' ? 'lg' : tier.id === 'convergence' ? 'md' : 'sm'}
                isApex={tier.id === 'apex'}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default SponsorsSection;
