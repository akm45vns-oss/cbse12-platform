import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect scroll direction and position
 * Returns { isScrollingUp, scrollY, isAtTop }
 */
export function useScrollDirection() {
  const [scrollY, setScrollY] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Check if scrolling up or down
          setIsScrollingUp(currentScrollY < lastScrollYRef.current);
          setScrollY(currentScrollY);
          setIsAtTop(currentScrollY < 10);
          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { isScrollingUp, scrollY, isAtTop };
}
