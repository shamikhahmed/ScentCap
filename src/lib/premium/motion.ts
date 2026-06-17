/** Shared motion presets — subtle, spring-physics press feel */
export const SPRING_PRESS = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 28,
  mass: 0.6,
};

export const FADE_UP = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
};

export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.25 },
};

export const MODAL_SPRING = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.98 },
  transition: SPRING_PRESS,
};
