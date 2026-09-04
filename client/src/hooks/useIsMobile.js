import { useState, useEffect } from 'react';

/**
 * Hook that returns true when the viewport width is less than or equal to the given breakpoint.
 * Default breakpoint is 768px, which corresponds to typical mobile devices.
 * The hook updates its value on window resize events.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}
