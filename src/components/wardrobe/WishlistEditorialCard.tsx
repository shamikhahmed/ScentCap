import { Heart, Trash2 } from 'lucide-react';
import { PressableLink } from '@/components/ui/PressableScale';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { concentrationLabel } from '@/services/onlineCatalog';
import type { Fragrance, WishlistItem } from '@/types';
import { FAMILY_COLORS } from '@/lib/stats';
import { cn } from '@/lib/utils';

export function WishlistEditorialCard({
  w,
  f,
  tab,
  onRemove,
  index = 0,
}: {
  w: WishlistItem;
  f?: Fragrance;
  tab: 'want' | 'tested';
  onRemove: () => void;
  index?: number;
}) {
  const aura = FAMILY_COLORS[f?.family ?? ''] ?? 'var(--sc-accent)';
  const issueNum = String((index % 12) + 1).padStart(2, '0');

  return (
    <article
      className="wishlist-editorial-card"
      style={{ '--wishlist-aura': aura } as React.CSSProperties}
    >
      <PressableLink
        to={`/add?list=${tab}`}
        className="wishlist-editorial-link pressable"
      >
        <div className="wishlist-editorial-meta">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
            {tab === 'want' ? 'Wishlist' : 'Tested'} · No. {issueNum}
          </span>
          {tab === 'want' && (
            <Heart size={14} className="text-[var(--color-accent)]" fill="currentColor" />
          )}
        </div>
        <div className="wishlist-editorial-stage">
          <FragranceThumb
            brand={f?.brand}
            name={f?.name}
            family={f?.family}
            catalogImage={f?.image}
            fragrance={f}
            size="md"
            className="wishlist-editorial-thumb !h-[88px]"
          />
        </div>
        <div className="wishlist-editorial-copy">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {f?.brand ?? 'Unknown brand'}
          </p>
          <p className="font-semibold tracking-tight leading-tight mt-0.5 truncate">
            {f?.name ?? w.fragranceId}
          </p>
          {f && (
            <p className="text-xs text-[var(--color-accent)] mt-1">
              {concentrationLabel(f.concentration)}
            </p>
          )}
        </div>
      </PressableLink>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          'wishlist-editorial-remove p-2 rounded-xl text-[var(--color-text-tertiary)]',
          'hover:text-[var(--sc-danger)] hover:bg-[color-mix(in_srgb,var(--sc-danger)_10%,transparent)] transition-colors',
        )}
        aria-label="Remove"
      >
        <Trash2 size={15} />
      </button>
    </article>
  );
}
