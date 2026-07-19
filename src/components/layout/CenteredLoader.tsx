import { motion } from 'framer-motion';

/** Perfume blotter strip splash / boot loader */
export function CenteredLoader() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden bg-[var(--color-bg)]">
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 18px, color-mix(in srgb, var(--color-accent) 8%, transparent) 18px, color-mix(in srgb, var(--color-accent) 8%, transparent) 19px)',
        }}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-5"
      >
        <div
          className="relative w-[min(48vw,160px)] aspect-[2/5] rounded-sm border border-[var(--color-border)] shadow-[var(--glass-shadow)] overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 90%, var(--color-accent)), var(--color-bg-secondary))',
          }}
          aria-hidden
        >
          <div
            className="absolute inset-[8%]"
            style={{
              border: '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)',
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 9px, color-mix(in srgb, var(--color-text-tertiary) 25%, transparent) 9px, color-mix(in srgb, var(--color-text-tertiary) 25%, transparent) 10px)',
            }}
          />
          <div className="absolute left-0 top-[8%] bottom-[8%] w-1.5 bg-[var(--color-accent)]" />
          <div
            className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-[9px] font-semibold tracking-[0.2em] uppercase text-[var(--color-accent)]"
            style={{ fontFamily: 'var(--font-display)', transform: 'translateX(-50%) rotate(-8deg)' }}
          >
            blotter
          </div>
        </div>
        <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--color-text-primary)]">
          ScentCap
        </p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
          Loading collection…
        </p>
      </motion.div>
    </div>
  );
}
