import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import NotifyModal from './NotifyModal';
import { REGISTRATION_OPENS } from '../lib/constants';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when navigating
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} ${isMenuOpen ? styles.menuOpen : ''}`}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo} onClick={closeMenu}>
            <span>AMS </span><span className={styles.logoDerive}>DERIVE</span>
          </Link>
        </div>

        <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksMobile : ''}`}>
          <Link href="/syllabus" className={styles.navLink} onClick={closeMenu}>
            SYLLABUS
          </Link>
          <Link href="/rules" className={styles.navLink} onClick={closeMenu}>
            RULES
          </Link>
          <Link href="/competition" className={styles.navLink} onClick={closeMenu}>
            COMPETITION
          </Link>
          <Link href="/about" className={styles.navLink} onClick={closeMenu}>
            ABOUT US
          </Link>
          {Date.now() >= REGISTRATION_OPENS.getTime() && (
            <Link href="/check-registration" className={styles.navLink} onClick={closeMenu}>
              CHECK STATUS
            </Link>
          )}
        </div>

        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.notifyBtn}
            onClick={() => {
              setIsModalOpen(true);
              closeMenu();
            }}
          >
            Pre register
          </button>

          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerActive : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </nav>
      <NotifyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Navbar;
