import { motion } from 'framer-motion';

const DEFAULT_ACCENT = 'var(--sc-accent)';

export function ScoreRing({
  score,
  color = DEFAULT_ACCENT,
  size = 88,
}: {
  score: number;
  color?: string;
  size?: number;
}) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const safeId = color.replace(/[^a-zA-Z0-9]/g, '') || 'accent';
  const gradId = `ring-grad-${safeId}`;

  return (
    <div
      className="relative score-ring-glow shrink-0"
      style={{ width: size, height: size, '--ring-color': color } as React.CSSProperties}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--sc-border-soft)"
          strokeWidth={5}
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={score}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="text-xl font-semibold tabular-nums tracking-tight"
        >
          {score}
        </motion.span>
        <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">match</span>
      </div>
    </div>
  );
}
