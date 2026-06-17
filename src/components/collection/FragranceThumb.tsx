import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { BottleVisual } from '@/components/ui/BottleVisual';
import { FAMILY_COLORS } from '@/lib/stats';
import { ensureFragranceImage } from '@/services/catalogSearch';
import type { Fragrance } from '@/types';

export function FragranceThumb({
  brand,
  name,
  family,
  catalogImage,
  photoUrl,
  fragrance,
  size = 'md',
  className,
  selected,
}: {
  brand?: string;
  name?: string;
  family?: string;
  catalogImage?: string | null;
  photoUrl?: string | null;
  /** When set, auto-fetches a bottle photo if none is available yet. */
  fragrance?: Fragrance | null;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  selected?: boolean;
}) {
  const aura = FAMILY_COLORS[family ?? fragrance?.family ?? ''] ?? '#0a84ff';
  const [resolvedImage, setResolvedImage] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const catalog = resolvedImage ?? catalogImage ?? fragrance?.image ?? null;
  const image = photoUrl ?? catalog;
  const showPhoto = Boolean(image) && !imageFailed;
  const heights = { sm: 72, md: 96, lg: 120, hero: 160 };
  const isCatalogPhoto = showPhoto && !photoUrl && Boolean(catalog);

  useEffect(() => {
    setImageFailed(false);
    setResolvedImage(null);
  }, [catalogImage, fragrance?.id, photoUrl]);

  useEffect(() => {
    if (photoUrl || catalogImage) return;
    if (!fragrance) return;
    const needsFetch = !fragrance.image || fragrance.image.includes('perfume-nobg');
    if (!needsFetch) return;

    let cancelled = false;
    void ensureFragranceImage(fragrance).then((f) => {
      if (!cancelled && f.image && !f.image.includes('perfume-nobg')) {
        setResolvedImage(f.image);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fragrance, photoUrl, catalogImage]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl flex items-center justify-center',
        selected && 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg)]',
        isCatalogPhoto && 'catalog-bottle-thumb',
        className,
      )}
      style={{
        height: heights[size],
        background: showPhoto
          ? undefined
          : `linear-gradient(165deg, ${aura}18 0%, var(--color-bg-secondary) 70%)`,
      }}
    >
      {showPhoto ? (
        <img
          src={image!}
          alt=""
          className="absolute inset-0 w-full h-full object-contain p-2"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <BottleVisual
          brand={brand ?? fragrance?.brand}
          name={name ?? fragrance?.name}
          family={family ?? fragrance?.family}
          catalogImage={catalog}
          photoUrl={photoUrl}
          size={size === 'hero' ? 'hero' : size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
        />
      )}
    </div>
  );
}
