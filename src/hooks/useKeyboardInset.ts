import { useEffect, useState } from 'react';

/** Tracks virtual keyboard overlap for sticky footers on mobile Safari / Capacitor WebView */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInset(Math.round(overlap));
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}

/** Scroll focused input into view when keyboard opens */
export function scrollInputIntoView(el: HTMLElement | null) {
  if (!el) return;
  requestAnimationFrame(() => {
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}
