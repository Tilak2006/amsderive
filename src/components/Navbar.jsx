import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

const REGISTRATION_OPENS = new Date('2026-04-19T18:30:00Z'); // April 20 2026, 00:00 IST

function openGoogleCalendarInvite() {
  const isRegistrationOpen = Date.now() >= REGISTRATION_OPENS.getTime();

  if (isRegistrationOpen) {
    // After April 20: remind for Round 1 "Prior" on May 23
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: 'AMS DERIVE — Round 1: Prior',
      dates: '20260522T183000Z/20260522T193000Z',
      details: 'Round 1 (Prior) of the AMS DERIVE Quantitative Trading & Mathematical Competition begins. Make sure you are prepared.',
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  } else {
    // Before April 20: remind for registrations opening
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: 'AMS DERIVE — Registrations Open',
      dates: '20260419T183000Z/20260419T193000Z',
      details: 'Registrations for the AMS DERIVE Quantitative Trading & Mathematical Competition are now open. Visit the website to register.',
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  }
}

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          <span>AMS </span><span className={styles.logoDerive}>DERIVE</span>
        </Link>
      </div>
      <button type="button" className={styles.notifyBtn} onClick={openGoogleCalendarInvite}>
        Notify Me
      </button>
    </nav>
  );
};

export default Navbar;
