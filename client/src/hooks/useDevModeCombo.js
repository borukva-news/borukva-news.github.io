import { useEffect, useState } from 'react';

const COMBO = 'devmode';

// Mirrors `handleKey`/`comboBuffer` in CarouselScreenState (hotspot_shared.dart):
// typing the letters "devmode" anywhere on the page toggles the hidden editor.
export function useDevModeCombo(onToggle) {
  const [buffer, setBuffer] = useState('');

  useEffect(() => {
    function handleKeyDown(e) {
      const char = e.key && e.key.length === 1 ? e.key.toLowerCase() : '';
      if (!char) {
        setBuffer('');
        return;
      }
      setBuffer((prev) => {
        const next = (prev + char).slice(-COMBO.length);
        if (next === COMBO) {
          onToggle();
          return '';
        }
        return next;
      });
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onToggle]);
}
