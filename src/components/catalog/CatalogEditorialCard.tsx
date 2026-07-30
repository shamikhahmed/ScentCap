import { ChevronRight } from 'lucide-react';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { concentrationLabel } from '@/services/onlineCatalog';
import type { FragranceGroup } from '@/services/catalogSearch';
import type { Fragrance } from '@/types';
import { cn } from '@/lib/utils';
import { FAMILY_COLORS } from '@/lib/stats';

type Props = {
  group: FragranceGroup;
  isOpen: boolean;
  picked: Fragrance | null;
  pickingImage: boolean;
  onOpen: () => void;
  onPickVariant: (f: Fragrance) => void;
  index?: number;
};

export function CatalogEditorialCard({
  group,
  isOpen,
  picked,
  pickingImage,
  onOpen,
  onPickVariant,
  index = 0,
}: Props) {
  const preview = group.variants.find((v) => v.image) ?? group.variants[0];
  const aura = FAMILY_COLORS[preview?.family ?? ''] ?? 'var(--sc-accent)';
  const issueNum = String((index % 12) + 1).padStart(2, '0');

  return (
    <article
      className={cn(
        'catalog-editorial-card overflow-hidden transition-all duration-300',
        isOpen && 'catalog-editorial-card--open',
      )}
      style={{ '--catalog-aura': aura } as React.CSSProperties}
    >
      <button
        type="button"
        className="catalog-editorial-cover w-full text-left pressable"
        onClick={onOpen}
        disabled={pickingImage}
        aria-expanded={isOpen}
      >
        <div className="catalog-editorial-meta">
          <span className="catalog-editorial-issue">No. {issueNum}</span>
          <span className="catalog-editorial-variants">
            {group.variants.length} variant{group.variants.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="catalog-editorial-stage">
          <div className="catalog-editorial-pedestal" />
          <FragranceThumb
            brand={group.brand}
            name={group.name}
            family={preview?.family}
            catalogImage={preview?.image}
            fragrance={preview}
            size="hero"
            className="catalog-editorial-bottle !h-[140px] !rounded-none !bg-transparent"
          />
        </div>

        <div className="catalog-editorial-copy">
          <p className="catalog-editorial-brand">{group.brand}</p>
          <h3 className="catalog-editorial-name">{group.name}</h3>
          {!isOpen && (
            <p className="catalog-editorial-cta">
              Choose concentration
              <ChevronRight size={14} className="inline ml-0.5 -mt-px" />
            </p>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="catalog-editorial-variants-panel">
          <p className="text-caption text-[var(--color-accent)] mb-3">Select your bottle</p>
          <div className="space-y-2">
            {group.variants.map((v) => {
              const selected = picked?.catalogSlug === v.catalogSlug && picked?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onPickVariant(v)}
                  disabled={pickingImage}
                  className={cn(
                    'catalog-variant-row w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left pressable',
                    selected && 'catalog-variant-row--selected',
                  )}
                >
                  <FragranceThumb
                    brand={v.brand}
                    name={v.name}
                    family={v.family}
                    catalogImage={v.image}
                    fragrance={v}
                    size="sm"
                    className="w-14 shrink-0"
                    selected={selected}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold tracking-tight">
                      {concentrationLabel(v.concentration)}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                      {v.name}
                    </p>
                    {v.top_notes.length > 0 && (
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 line-clamp-1 italic">
                        {v.top_notes.slice(0, 3).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="catalog-variant-badge">{v.concentration}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
