import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          AMS DERIVE
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
