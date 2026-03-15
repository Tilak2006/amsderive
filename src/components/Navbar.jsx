import Link from 'next/link';
import styles from './Navbar.module.css';

function openGoogleCalendarInvite() {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'AMS DERIVE — Registrations Open',
    dates: '20260419T183000Z/20260419T193000Z',
    details: 'Registrations for the AMS DERIVE Quantitative Trading & Mathematical Competition are now open. Visit the website to register.',
  });
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
}

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          AMS DERIVE
        </Link>
      </div>
      <button type="button" className={styles.notifyBtn} onClick={openGoogleCalendarInvite}>
        Notify Me
      </button>
    </nav>
  );
};

export default Navbar;
