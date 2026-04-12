import { useEffect, useRef, useState } from 'react';
import styles from './FadeInSection.module.css';

const FadeInSection = ({ children }) => {
  const [isVisible, setVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    // rootMargin: eagerly triggers bundle load before section enters viewport.
    // 200px was too aggressive on mobile — loads 2-3 sections simultaneously
    // on a 375px screen. 100px desktop / 60px mobile is sufficient lookahead.
    const rootMargin = window.innerWidth < 768 ? '60px' : '100px';
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setHasMounted(true);
          // Small rAF delay so the mount doesn't compete with scroll paint
          requestAnimationFrame(() => setVisible(true));
          observer.unobserve(entry.target);
          setTimeout(() => {
            if (entry.target) entry.target.style.willChange = 'auto';
          }, 1100);
        }
      });
    }, { threshold: 0.05, rootMargin });

    const { current } = domRef;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      className={`${styles.reveal} ${isVisible ? styles.visible : ''}`}
      ref={domRef}
    >
      {hasMounted ? children : null}
    </div>
  );
};

export default FadeInSection;
