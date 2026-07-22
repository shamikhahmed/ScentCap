import { cn } from '@/lib/utils';
import { FAMILY_COLORS } from '@/lib/stats';

/** Elegant SVG flacon when no bottle photo available — always shows a real bottle shape. */
export function FlaconPlaceholder({
  brand,
  name,
  family,
  className,
}: {
  brand?: string;
  name?: string;
  family?: string;
  className?: string;
}) {
  const aura = FAMILY_COLORS[family ?? ''] ?? 'var(--sc-amber)';
  const initials = [brand, name]
    .filter(Boolean)
    .map((w) => w!.trim().charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || 'SC';
  const gid = `flacon-${(family ?? 'x').replace(/\W/g, '')}-${initials}`;

  return (
    <div
      className={cn('relative flex items-center justify-center w-full h-full min-h-[4rem]', className)}
      role="img"
      aria-label={brand && name ? `${brand} ${name}` : 'Fragrance bottle'}
    >
      <svg viewBox="0 0 80 140" className="w-full h-full max-h-full drop-shadow-md" aria-hidden>
        <defs>
          <linearGradient id={`${gid}-glass`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={aura} stopOpacity="0.95" />
            <stop offset="45%" stopColor={aura} stopOpacity="0.55" />
            <stop offset="100%" stopColor={aura} stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id={`${gid}-shine`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Cap */}
        <rect x="30" y="6" width="20" height="12" rx="2.5" fill={aura} opacity="0.9" />
        <rect x="34" y="2" width="12" height="6" rx="1.5" fill={aura} opacity="0.55" />
        {/* Collar */}
        <rect x="26" y="18" width="28" height="10" rx="2" fill={aura} opacity="0.4" />
        {/* Body */}
        <path
          d="M22 32 C22 28 28 26 40 26 C52 26 58 28 58 32 L64 108 C64 122 52 132 40 132 C28 132 16 122 16 108 Z"
          fill={`url(#${gid}-glass)`}
          stroke={aura}
          strokeWidth="1.2"
          strokeOpacity="0.65"
        />
        {/* Shine */}
        <path
          d="M28 40 C30 38 34 48 34 70 C34 92 30 108 28 112 C26 100 26 52 28 40 Z"
          fill={`url(#${gid}-shine)`}
        />
        {/* Base ellipse */}
        <ellipse cx="40" cy="118" rx="20" ry="5" fill={aura} opacity="0.2" />
        <text
          x="40"
          y="78"
          textAnchor="middle"
          fill="#fff"
          fontSize="13"
          fontWeight="700"
          fontFamily="var(--font-display), Georgia, serif"
          opacity="0.92"
          letterSpacing="0.06em"
        >
          {initials}
        </text>
      </svg>
    </div>
  );
}
