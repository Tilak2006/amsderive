import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import styles from '../../styles/admin.module.css';

export default function FirmIndex() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch('/api/firm/get-firm-profile', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            router.replace('/firm/dashboard');
          } else {
            // Valid Firebase user but not a firm account
            router.replace('/firm/login');
          }
        } catch {
          router.replace('/firm/login');
        }
      } else {
        router.replace('/firm/login');
      }
      setChecking(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className={styles.checkingWrap}>
        <span className={styles.checkingDot} />
      </div>
    );
  }

  return null;
}
