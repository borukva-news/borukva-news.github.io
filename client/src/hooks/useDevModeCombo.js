import { useEffect, useRef } from 'react';

const COMBO = 'devmode';

// Mirrors `handleKey`/`comboBuffer` in CarouselScreenState (hotspot_shared.dart):
// typing the letters "devmode" anywhere on the page toggles the hidden editor.
export function useDevModeCombo(onToggle) {
  const buffer = useRef('');

  useEffect(() => {
    function handleKeyDown(e) {
      const char = e.code && /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : '';
      if (!char) {
        buffer.current = '';
        return;
      }
      buffer.current = (buffer.current + char).slice(-COMBO.length);
      if (buffer.current === COMBO) {
        buffer.current = '';
        onToggle();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onToggle]);
}
