import { useEffect, useRef, useState } from 'react';
import styles from './FadeInSection.module.css';

const FadeInSection = ({ children }) => {
  const [isVisible, setVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const domRef = useRef();

  useEffect(() => {
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
    }, { threshold: 0.05, rootMargin: '200px' });
    // rootMargin: '200px' starts loading the section's JS bundle 200px before
    // it enters the viewport, so content is ready before the user scrolls to it.

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
