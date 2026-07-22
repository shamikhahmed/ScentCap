import { cn } from '@/lib/utils';

/** Elegant SVG flacon when no bottle photo available */
export function FlaconPlaceholder({
  brand,
  name,
  className,
}: {
  brand?: string;
  name?: string;
  className?: string;
}) {
  const initials = (brand || name || 'SC')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn('relative flex flex-col items-center justify-end', className)}
      role="img"
      aria-label={brand && name ? `${brand} ${name}` : 'Fragrance bottle'}
    >
      <svg viewBox="0 0 80 140" className="w-full h-full drop-shadow-md" aria-hidden>
        <defs>
          <linearGradient id="flaconGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--sc-blush)" stopOpacity="0.35" />
            <stop offset="50%" stopColor="var(--sc-amber)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--sc-panel)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect x="32" y="8" width="16" height="14" rx="2" fill="var(--sc-amber)" opacity="0.85" />
        <rect x="28" y="22" width="24" height="8" rx="2" fill="var(--sc-border)" />
        <path
          d="M22 36 Q40 30 58 36 L62 120 Q40 132 18 120 Z"
          fill="url(#flaconGlass)"
          stroke="var(--sc-border)"
          strokeWidth="1"
        />
        <ellipse cx="40" cy="70" rx="8" ry="28" fill="white" opacity="0.12" />
      </svg>
      <span
        className="absolute bottom-[18%] text-[10px] font-semibold tracking-[0.15em] text-[var(--sc-amber)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {initials}
      </span>
    </div>
  );
}
