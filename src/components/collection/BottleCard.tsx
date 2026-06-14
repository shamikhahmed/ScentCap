import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { BottleVisual } from '@/components/ui/BottleVisual';
import { usePhotoUrl } from '@/hooks/usePhotoUrl';
import type { CollectionItem, Fragrance } from '@/types';
import { FAMILY_COLORS } from '@/lib/stats';

export function BottleCard({ c, f }: { c: CollectionItem; f?: Fragrance }) {
  const photoUrl = usePhotoUrl(c.photoBlobId);
  const aura = FAMILY_COLORS[f?.family ?? ''] ?? '#0071e3';

  return (
    <Link to={`/fragrance/${c.id}`}>
      <Card className="h-full hover:border-[var(--color-accent)]/40 transition-colors p-0 overflow-hidden">
        <div
          className="aspect-[4/5] flex flex-col justify-end p-4 relative"
          style={{
            background: photoUrl
              ? undefined
              : `linear-gradient(160deg, ${aura}18, var(--color-bg-secondary))`,
          }}
        >
          {photoUrl ? (
            <>
              <img src={photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pb-10">
              <BottleVisual brand={f?.brand} name={f?.name} family={f?.family} size="lg" />
            </div>
          )}
          <div className="relative z-10">
            {c.isFavorite && <Star size={14} className="text-[var(--color-accent)] mb-auto" fill="currentColor" />}
            <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">{f?.brand}</p>
            <p className="font-semibold leading-tight text-[var(--color-text)]">{f?.name ?? '…'}</p>
            <div className="flex justify-between items-center mt-2 gap-2 flex-wrap">
              {f?.concentration && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
                  {f.concentration}
                </span>
              )}
              {(c.bottleType === 'decant' || c.bottleType === 'travel') && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-stone-300">
                  {c.bottleType === 'decant' ? 'Decant' : 'Travel'}
                </span>
              )}
              <span className="text-[10px] text-stone-500 ml-auto">{c.bottleLevel === 'full' ? 'Full' : `${c.bottleLevel}%`}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
