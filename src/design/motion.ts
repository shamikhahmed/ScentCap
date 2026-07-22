/** ScentCap 2.0 motion — perfume handling, not bounce. */

export const SC_EASE = [0.22, 0.61, 0.36, 1] as const;

export const SC_DUR = {
  fast: 0.12,
  standard: 0.22,
  large: 0.38,
  hero: 0.65,
} as const;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const SC_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: SC_DUR.standard, ease: SC_EASE },
};

export const SC_BLOTTER_SLIDE = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: SC_DUR.large, ease: SC_EASE },
};

export const SC_BOTTLE_LIFT = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: SC_DUR.hero, ease: SC_EASE },
};

export const SC_PAGE = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { duration: SC_DUR.standard, ease: SC_EASE },
};

export const SC_SHEET = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '40%' },
  transition: { duration: 0.26, ease: SC_EASE },
};
