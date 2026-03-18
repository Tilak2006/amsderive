import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import NotifyModal from './NotifyModal';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo}>
            <span>AMS </span><span className={styles.logoDerive}>DERIVE</span>
          </Link>
        </div>
        <button
          type="button"
          className={styles.notifyBtn}
          onClick={() => setIsModalOpen(true)}
        >
          Notify Me
        </button>
      </nav>
      <NotifyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Navbar;
