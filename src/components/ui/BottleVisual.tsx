import { cn } from '@/lib/utils';
import { FAMILY_COLORS } from '@/lib/stats';
import { FamilyIcon } from '@/components/ui/FamilyIcon';

function initials(brand?: string, name?: string): string {
  const b = brand?.trim().charAt(0)?.toUpperCase() ?? '';
  const n = name?.trim().charAt(0)?.toUpperCase() ?? '';
  return (b + n).slice(0, 2) || 'SC';
}

export function BottleVisual({
  brand,
  name,
  family,
  photoUrl,
  catalogImage,
  size = 'md',
  className,
}: {
  brand?: string;
  name?: string;
  family?: string;
  photoUrl?: string | null;
  catalogImage?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}) {
  const aura = FAMILY_COLORS[family ?? ''] ?? '#0071e3';
  const dims = { sm: 56, md: 88, lg: 120, hero: 160 }[size];
  const height = Math.round(dims * 1.25);
  const imageSrc = photoUrl ?? catalogImage;

  if (imageSrc) {
    return (
      <div
        className={cn('relative overflow-hidden rounded-2xl', className)}
        style={{ width: dims, height }}
      >
        <img
          src={imageSrc}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full',
            photoUrl ? 'object-cover' : 'object-contain p-1.5',
          )}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {photoUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />}
      </div>
    );
  }

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: dims, height }}
      aria-hidden
    >
      <svg
        viewBox="0 0 80 100"
        className="w-full h-full drop-shadow-md"
        style={{ filter: `drop-shadow(0 8px 16px ${aura}33)` }}
      >
        <defs>
          <linearGradient id={`bottle-grad-${family ?? 'default'}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={aura} stopOpacity="0.95" />
            <stop offset="55%" stopColor={aura} stopOpacity="0.55" />
            <stop offset="100%" stopColor={aura} stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <rect x="28" y="6" width="24" height="10" rx="3" fill={aura} opacity="0.5" />
        <rect x="32" y="2" width="16" height="6" rx="2" fill={aura} opacity="0.35" />
        <path
          d="M22 18 C22 16 26 14 40 14 C54 14 58 16 58 18 L62 78 C62 88 52 94 40 94 C28 94 18 88 18 78 Z"
          fill={`url(#bottle-grad-${family ?? 'default'})`}
          stroke={aura}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <ellipse cx="40" cy="78" rx="18" ry="6" fill={aura} opacity="0.2" />
        <text
          x="40"
          y="54"
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="600"
          fontFamily="system-ui, -apple-system, sans-serif"
          opacity="0.92"
        >
          {initials(brand, name)}
        </text>
      </svg>
      {size === 'hero' && (
        <div className="absolute -bottom-1 -right-1">
          <FamilyIcon family={family} size={14} />
        </div>
      )}
    </div>
  );
}
