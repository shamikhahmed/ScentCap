import { useEffect, useState } from 'react';

/** Tracks virtual keyboard overlap for sticky footers on mobile Safari / Capacitor WebView */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // Only a real keyboard counts: Safari's toolbar collapsing during a normal scroll also shrinks the
      // visual viewport (~50–100px), which used to change page padding mid-scroll and make the page jump.
      const el = document.activeElement as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const next = typing && overlap > 150 ? Math.round(overlap) : 0;
      setInset((prev) => (prev === next ? prev : next));
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
