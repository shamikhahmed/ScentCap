import { useState } from 'react';
import { PressableLink } from '@/components/ui/PressableScale';
import { Star } from 'lucide-react';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { usePhotoUrl } from '@/hooks/usePhotoUrl';
import type { CollectionItem, Fragrance } from '@/types';
import { FAMILY_COLORS } from '@/lib/stats';
import { chipInactive, textSubtle } from '@/lib/ui-classes';

export function BottleCard({ c, f }: { c: CollectionItem; f?: Fragrance }) {
  const photoUrl = usePhotoUrl(c.photoBlobId);
  const aura = FAMILY_COLORS[f?.family ?? ''] ?? 'var(--sc-amber)';
  const [photoFailed, setPhotoFailed] = useState(false);
  const showUserPhoto = Boolean(photoUrl) && !photoFailed;

  return (
    <PressableLink to={`/fragrance/${c.id}`} className="block h-full w-full min-w-0">
      <div className="bottle-card-premium h-full cursor-pointer overflow-hidden">
        <div
          className="aspect-[4/5] flex flex-col justify-end p-4 relative"
          style={{
            background: showUserPhoto
              ? undefined
              : `linear-gradient(165deg, ${aura}22 0%, var(--color-bg-secondary) 55%, var(--color-bg) 100%)`,
          }}
        >
          {showUserPhoto ? (
            <>
              <img
                src={photoUrl!}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                onError={() => setPhotoFailed(true)}
              />
              <div className="absolute inset-0 photo-card-scrim-dark" />
            </>
          ) : (
            <div className="absolute inset-x-0 top-3 bottom-20 flex items-center justify-center px-3">
              <FragranceThumb
                brand={f?.brand}
                name={f?.name}
                family={f?.family}
                catalogImage={f?.image}
                fragrance={f}
                size="lg"
                className="w-full max-w-[9rem] !bg-transparent"
              />
            </div>
          )}
          <div className="relative z-10 min-w-0">
            {c.isFavorite && <Star size={14} className="text-[var(--color-accent)] mb-2" fill="currentColor" />}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] truncate">{f?.brand}</p>
            <p className="font-semibold leading-tight tracking-tight mt-0.5 truncate">{f?.name ?? '…'}</p>
            <div className="flex justify-between items-center mt-2.5 gap-2 flex-wrap">
              {f?.concentration && (
                <span className="tag-premium !text-[9px]">{f.concentration}</span>
              )}
              {(c.bottleType === 'decant' || c.bottleType === 'travel') && (
                <span className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${chipInactive}`}>
                  {c.bottleType === 'decant' ? 'Decant' : 'Travel'}
                </span>
              )}
              <span className={`text-[10px] ml-auto font-medium ${textSubtle}`}>{c.bottleLevel === 'full' ? 'Full' : `${c.bottleLevel}%`}</span>
            </div>
          </div>
        </div>
      </div>
    </PressableLink>
  );
}
