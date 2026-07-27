import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FlaconPlaceholder } from '@/components/bottle/FlaconPlaceholder';
import { ensureFragranceImage } from '@/services/catalogSearch';
import { ensureCatalogImageBlob } from '@/catalog/images';
import { FAMILY_COLORS } from '@/lib/stats';
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
  fragrance?: Fragrance | null;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  selected?: boolean;
}) {
  const resolvedBrand = brand ?? fragrance?.brand;
  const resolvedName = name ?? fragrance?.name;
  const resolvedFamily = family ?? fragrance?.family;
  const aura = FAMILY_COLORS[resolvedFamily ?? ''] ?? 'var(--sc-amber)';

  const [resolvedImage, setResolvedImage] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const catalog = blobUrl ?? resolvedImage ?? catalogImage ?? fragrance?.image ?? null;
  const image = photoUrl ?? catalog;
  const showPhoto = Boolean(image) && !imageFailed;
  const heights = { sm: 88, md: 112, lg: 140, hero: 260 };

  useEffect(() => {
    setImageFailed(false);
    setResolvedImage(null);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [catalogImage, fragrance?.id, fragrance?.image, photoUrl]);

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

  useEffect(() => {
    if (photoUrl) return;
    const url = catalogImage ?? resolvedImage ?? fragrance?.image;
    if (!url || !url.startsWith('http')) return;
    let cancelled = false;
    let created: string | null = null;
    void ensureCatalogImageBlob(url).then((obj) => {
      if (cancelled || !obj) return;
      created = obj;
      setBlobUrl(obj);
    });
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [catalogImage, resolvedImage, fragrance?.image, photoUrl]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl flex items-center justify-center',
        selected && 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg)]',
        showPhoto && !photoUrl && 'catalog-bottle-thumb',
        className,
      )}
      style={{
        height: heights[size],
        background: showPhoto
          ? undefined
          : `linear-gradient(165deg, ${aura}22 0%, var(--color-bg-secondary) 72%)`,
      }}
    >
      {showPhoto ? (
        <img
          src={image!}
          alt=""
          className="absolute inset-0 w-full h-full object-contain p-2"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <FlaconPlaceholder
          brand={resolvedBrand}
          name={resolvedName}
          family={resolvedFamily}
          className="w-[70%] h-[88%] max-w-[7rem]"
        />
      )}
    </div>
  );
}
