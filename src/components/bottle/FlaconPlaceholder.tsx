import { cn } from '@/lib/utils';
import { FAMILY_COLORS } from '@/lib/stats';

/** Sculpted flacon — last resort when no bottle art. Distinct per house. */
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
  const aura = FAMILY_COLORS[family ?? ''] ?? 'var(--sc-accent)';
  const label = (brand ?? 'ScentCap').slice(0, 14);
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
      <svg viewBox="0 0 80 150" className="w-full h-full max-h-full drop-shadow-lg" aria-hidden>
        <defs>
          <linearGradient id={`${gid}-glass`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor={aura} stopOpacity="0.98" />
            <stop offset="42%" stopColor={aura} stopOpacity="0.62" />
            <stop offset="100%" stopColor={aura} stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id={`${gid}-shine`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${gid}-cap`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={aura} stopOpacity="1" />
            <stop offset="100%" stopColor={aura} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <rect x="31" y="4" width="18" height="10" rx="2" fill={`url(#${gid}-cap)`} />
        <rect x="28" y="14" width="24" height="8" rx="1.5" fill={aura} opacity="0.75" />
        <rect x="24" y="22" width="32" height="9" rx="2" fill={aura} opacity="0.4" />
        <path
          d="M20 36 C20 30 28 27 40 27 C52 27 60 30 60 36 L66 112 C66 128 54 140 40 140 C26 140 14 128 14 112 Z"
          fill={`url(#${gid}-glass)`}
          stroke={aura}
          strokeWidth="1.15"
          strokeOpacity="0.7"
        />
        <path
          d="M27 44 C29 42 33 52 33 78 C33 104 29 122 27 126 C25 112 25 56 27 44 Z"
          fill={`url(#${gid}-shine)`}
        />
        <ellipse cx="40" cy="126" rx="18" ry="4.5" fill={aura} opacity="0.18" />
        <text
          x="40"
          y="82"
          textAnchor="middle"
          fill="#fff"
          fontSize="12"
          fontWeight="700"
          fontFamily="var(--font-display), Georgia, serif"
          opacity="0.95"
          letterSpacing="0.08em"
        >
          {initials}
        </text>
        <text
          x="40"
          y="98"
          textAnchor="middle"
          fill="#fff"
          fontSize="5.5"
          fontWeight="600"
          fontFamily="var(--font-sans), system-ui, sans-serif"
          opacity="0.75"
          letterSpacing="0.12em"
        >
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
