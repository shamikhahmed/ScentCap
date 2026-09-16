/**
 * Catalog bottle art policy (C-42 / D-04-style).
 * Only Capricorn-authored SVG flacons (and user camera photos via photoBlobId) are reusable.
 * Remote retailer-style product photos (Fraganty / CDN http) have unknown reuse license — never display.
 */

/** Remote product photo URL — license not established for redistribution. */
export function isUnlicensedRemoteCatalogImage(image?: string | null): boolean {
  if (!image) return false;
  return /^https?:\/\//i.test(image);
}

/** Capricorn generic flacon / stub art (data SVG or tiny placeholder). */
export function isPlaceholderCatalogImage(image?: string | null): boolean {
  if (!image) return true;
  if (isUnlicensedRemoteCatalogImage(image)) return true;
  if (image.includes('perfume-nobg')) return true;
  if (image.startsWith('data:image/svg')) return true;
  if (image.startsWith('data:image/') && image.length < 80) return true;
  return false;
}

/**
 * True when wardrobe bottle still needs remote product photo enrichment.
 * Always false: C-42 forbids retailer photos without a clear reuse license.
 */
export function needsCatalogImageRefresh(_image?: string | null, _slug?: string | null): boolean {
  return false;
}

/** Image safe to render as catalog art (excludes unlicensed http photos). */
export function catalogImageForDisplay(image?: string | null): string | null {
  if (!image) return null;
  if (isUnlicensedRemoteCatalogImage(image)) return null;
  if (image.includes('perfume-nobg')) return null;
  return image;
}
