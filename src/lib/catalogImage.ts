/** Catalog art that should be replaced by live Fraganty product photos. */
export function isPlaceholderCatalogImage(image?: string | null): boolean {
  if (!image) return true;
  if (image.includes('perfume-nobg')) return true;
  if (image.startsWith('data:image/svg')) return true;
  if (image.startsWith('data:image/') && image.length < 80) return true;
  return false;
}

/** True when wardrobe bottle still needs a real http product photo. */
export function needsCatalogImageRefresh(image?: string | null, _slug?: string | null): boolean {
  // Manual bottles without a slug are fine once they have real art — don't force Fraganty.
  return isPlaceholderCatalogImage(image);
}
