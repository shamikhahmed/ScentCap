import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FlaconPlaceholder } from '@/components/bottle/FlaconPlaceholder';
import { ensureCatalogImageBlob } from '@/catalog/images';
import { bottleSmall, bottleUrl, findLocalFragrance, isBundledBottle } from '@/catalog/local';
import { isPlaceholderCatalogImage } from '@/lib/catalogImage';
import { isDemoSession, isDemoUrl } from '@/lib/demoMode';
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
  variant = 'tile',
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
  /** `plinth` = 3.0 square white product stage (fills its container width). */
  variant?: 'tile' | 'plinth';
}) {
  const resolvedBrand = brand ?? fragrance?.brand;
  const resolvedName = name ?? fragrance?.name;
  const resolvedFamily = family ?? fragrance?.family;
  const aura = FAMILY_COLORS[resolvedFamily ?? ''] ?? 'var(--sc-amber)';
  const isHero = size === 'hero';
  const demoOffline = isDemoUrl() || isDemoSession();

  const [resolvedImage, setResolvedImage] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [localChecked, setLocalChecked] = useState(false);

  const directImage = catalogImage ?? fragrance?.image ?? null;
  const bundled = isBundledBottle(directImage) ? directImage : localImage;
  const rawCatalog = bundled ?? resolvedImage ?? directImage;
  // Prefer live http product photo. Skip huge data: SVG <img> on hero — FlaconPlaceholder
  // paints with first frame and keeps LCP on text instead of a late-decoded data-URI.
  const small = size === 'sm' || size === 'md';
  const catalog =
    (bundled ? bottleUrl(small ? bottleSmall(bundled) : bundled) : null) ??
    blobUrl ??
    (rawCatalog && !isPlaceholderCatalogImage(rawCatalog) ? rawCatalog : null) ??
    (!isHero && rawCatalog?.startsWith('data:') ? rawCatalog : null);
  const image = photoUrl ?? catalog;
  const showPhoto = Boolean(image) && !imageFailed;
  const heights = { sm: 96, md: 120, lg: 152, hero: 280 };

  useEffect(() => {
    setImageFailed(false);
    setResolvedImage(null);
    setLocalImage(null);
    setLocalChecked(false);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [catalogImage, fragrance?.id, fragrance?.image, photoUrl]);

  // Bundled offline photo (no network) — matched by id or brand+name+concentration.
  useEffect(() => {
    if (photoUrl || isBundledBottle(directImage) || !resolvedBrand || !resolvedName) {
      setLocalChecked(true);
      return;
    }
    let cancelled = false;
    void findLocalFragrance({
      id: fragrance?.id,
      brand: resolvedBrand,
      name: resolvedName,
      concentration: fragrance?.concentration,
    }).then((local) => {
      if (cancelled) return;
      if (local) setLocalImage(local.image);
      setLocalChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [photoUrl, directImage, resolvedBrand, resolvedName, fragrance?.id, fragrance?.concentration]);

  useEffect(() => {
    if (demoOffline || photoUrl || localImage || !localChecked) return;
    if (!fragrance) return;
    const candidate = catalogImage ?? fragrance.image;
    if (!isPlaceholderCatalogImage(candidate)) return;

    let cancelled = false;
    void import('@/services/catalogSearch')
      .then(({ ensureFragranceImage }) => ensureFragranceImage(fragrance))
      .then((f) => {
        if (cancelled) return;
        if (f.image && !isPlaceholderCatalogImage(f.image)) {
          setResolvedImage(f.image);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fragrance, photoUrl, catalogImage, demoOffline, localImage, localChecked]);

  useEffect(() => {
    if (demoOffline || photoUrl || localImage || !localChecked) return;
    const url = resolvedImage ?? catalogImage ?? fragrance?.image;
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
  }, [catalogImage, resolvedImage, fragrance?.image, photoUrl, demoOffline, localImage, localChecked]);

  const alt = resolvedName ? `${resolvedBrand ?? ''} ${resolvedName} bottle`.trim() : '';

  if (variant === 'plinth') {
    return (
      <div className={cn('ui-plinth', selected && 'ring-2 ring-[var(--tint)]', className)}>
        {showPhoto && !photoUrl ? (
          <img
            src={image!}
            alt={alt}
            width={512}
            height={512}
            loading={isHero ? 'eager' : 'lazy'}
            fetchPriority={isHero ? 'high' : undefined}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : showPhoto ? (
          <img
            src={image!}
            alt={alt}
            className="!p-0 !object-cover !mix-blend-normal"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <FlaconPlaceholder
            brand={resolvedBrand}
            name={resolvedName}
            family={resolvedFamily}
            className="w-[52%] h-[78%]"
          />
        )}
      </div>
    );
  }

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
          alt={alt}
          width={512}
          height={512}
          className="absolute inset-0 w-full h-full object-contain p-2"
          loading={isHero ? 'eager' : 'lazy'}
          fetchPriority={isHero ? 'high' : undefined}
          decoding={isHero ? 'sync' : 'async'}
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
