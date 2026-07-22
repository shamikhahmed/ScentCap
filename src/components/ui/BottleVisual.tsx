import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FlaconPlaceholder } from '@/components/bottle/FlaconPlaceholder';
import { FAMILY_COLORS } from '@/lib/stats';
import { FamilyIcon } from '@/components/ui/FamilyIcon';

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
  const aura = FAMILY_COLORS[family ?? ''] ?? 'var(--sc-amber)';
  const dims = { sm: 56, md: 88, lg: 120, hero: 160 }[size];
  const height = Math.round(dims * 1.25);
  const [failed, setFailed] = useState(false);
  const imageSrc = !failed ? photoUrl ?? catalogImage : null;

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
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
        {photoUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />}
      </div>
    );
  }

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{
        width: dims,
        height,
        background: `linear-gradient(165deg, ${aura}18 0%, transparent 70%)`,
        borderRadius: 16,
      }}
    >
      <FlaconPlaceholder brand={brand} name={name} family={family} className="w-[78%] h-[92%]" />
      {size === 'hero' && (
        <div className="absolute -bottom-1 -right-1">
          <FamilyIcon family={family} size={14} />
        </div>
      )}
    </div>
  );
}
