import { useEffect, useRef, useState } from 'react';
import styles from './FadeInSection.module.css';

const FadeInSection = ({ children }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const rootMargin = window.innerWidth < 768 ? '60px' : '100px';
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setVisible(true));
          observer.unobserve(entry.target);
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
      {children}
    </div>
  );
};

export default FadeInSection;
