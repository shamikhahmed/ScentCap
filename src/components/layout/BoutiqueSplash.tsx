import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { SC_DUR, SC_EASE, prefersReducedMotion } from '@/design/motion';

/**
 * Boutique splash — blotter → flacon → wordmark (0–3000ms).
 * Returning users: short fade via `brief`.
 */
export function BoutiqueSplash({
  brief = false,
  onDone,
}: {
  brief?: boolean;
  onDone?: () => void;
}) {
  const reduced = prefersReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (brief || reduced) {
      const t = window.setTimeout(() => onDone?.(), reduced ? 80 : 180);
      return () => window.clearTimeout(t);
    }
    const timers = [
      window.setTimeout(() => setPhase(1), 300),
      window.setTimeout(() => setPhase(2), 900),
      window.setTimeout(() => setPhase(3), 1500),
      window.setTimeout(() => setPhase(4), 2100),
      window.setTimeout(() => onDone?.(), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [brief, reduced, onDone]);

  if (brief || reduced) {
    return (
      <div className="min-h-dvh sc-marble flex items-center justify-center bg-[var(--sc-bg)]">
        <p className="relative z-10 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--sc-text)]">
          ScentCap
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh sc-marble flex flex-col items-center justify-center overflow-hidden bg-[var(--sc-bg)]">
      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        {phase >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: SC_DUR.large, ease: SC_EASE }}
            className="sc-blotter w-[120px] h-[48px] flex items-center justify-center"
            aria-hidden
          >
            <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--sc-amber)]">blotter</span>
          </motion.div>
        )}
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.42, ease: SC_EASE }}
            className="relative w-20 h-36"
            aria-hidden
          >
            <svg viewBox="0 0 80 140" className="w-full h-full">
              <defs>
                <linearGradient id="splashGleam" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--sc-amber)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="var(--sc-blush)" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <rect x="32" y="8" width="16" height="14" rx="2" fill="var(--sc-amber)" />
              <path
                d="M22 36 Q40 30 58 36 L62 120 Q40 132 18 120 Z"
                fill="url(#splashGleam)"
                stroke="var(--sc-border)"
              />
              <motion.rect
                x="0"
                y="0"
                width="20"
                height="140"
                fill="white"
                opacity={0.15}
                initial={{ x: -20 }}
                animate={{ x: 80 }}
                transition={{ duration: 0.42, ease: SC_EASE }}
              />
            </svg>
          </motion.div>
        )}
        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: SC_DUR.standard, ease: SC_EASE }}
            className="text-center"
          >
            <h1
              className="text-[34px] md:text-[46px] font-semibold tracking-[-0.02em] text-[var(--sc-text)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ScentCap
            </h1>
            <p className="mt-2 text-sm text-[var(--sc-text-muted)]">Your fragrance wardrobe.</p>
          </motion.div>
        )}
        {phase >= 4 && (
          <motion.div
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: SC_DUR.large, ease: SC_EASE }}
            className="sr-only"
          >
            Ready
          </motion.div>
        )}
      </div>
      <p className="absolute bottom-6 text-[11px] text-[var(--sc-text-muted)] z-10">2.0</p>
    </div>
  );
}
