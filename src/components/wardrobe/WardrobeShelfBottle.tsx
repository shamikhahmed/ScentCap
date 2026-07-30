import { Star } from 'lucide-react';
import { PressableLink } from '@/components/ui/PressableScale';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { usePhotoUrl } from '@/hooks/usePhotoUrl';
import type { CollectionItem, Fragrance } from '@/types';
import { FAMILY_COLORS } from '@/lib/stats';
import { cn } from '@/lib/utils';
import { fragranceDisplayName } from '@/services/onlineCatalog';

export function WardrobeShelfBottle({
  c,
  f,
  className,
}: {
  c: CollectionItem;
  f?: Fragrance;
  className?: string;
}) {
  const photoUrl = usePhotoUrl(c.photoBlobId);
  const aura = FAMILY_COLORS[f?.family ?? ''] ?? 'var(--sc-accent)';
  const levelLabel = c.bottleLevel === 'full' ? 'Full' : `${c.bottleLevel}%`;

  return (
    <PressableLink
      to={`/fragrance/${c.id}`}
      className={cn('wardrobe-shelf-bottle block pressable', className)}
      style={{ '--bottle-aura': aura } as React.CSSProperties}
    >
      <div className="wardrobe-shelf-bottle-inner">
        <div className="wardrobe-shelf-bottle-stage">
          {photoUrl ? (
            <>
              <img src={photoUrl} alt="" className="wardrobe-shelf-photo" loading="lazy" />
              <div className="wardrobe-shelf-photo-scrim" />
            </>
          ) : (
            <FragranceThumb
              brand={f?.brand}
              name={f?.name}
              family={f?.family}
              catalogImage={f?.image}
              fragrance={f}
              size="lg"
              className="wardrobe-shelf-thumb !rounded-xl"
            />
          )}
          {c.isFavorite && (
            <Star
              size={12}
              className="absolute top-2 right-2 text-[var(--color-accent)] drop-shadow"
              fill="currentColor"
            />
          )}
          {c.isSignature && (
            <span className="wardrobe-signature-badge">Signature</span>
          )}
        </div>
        <div className="wardrobe-shelf-label">
          <p className="wardrobe-shelf-brand">{f?.brand ?? 'Unknown'}</p>
          <p className="wardrobe-shelf-name">{f ? fragranceDisplayName(f.name) : '…'}</p>
          <div className="wardrobe-shelf-meta">
            {f?.concentration && <span>{f.concentration}</span>}
            <span className="wardrobe-shelf-level">{levelLabel}</span>
          </div>
        </div>
      </div>
      <div className="wardrobe-shelf-plank" aria-hidden />
    </PressableLink>
  );
}
