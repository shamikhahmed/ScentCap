import { fragantyProvider } from '@/catalog/providers/fraganty';
import type { CatalogProvider } from '@/catalog/types';

export function getDefaultProvider(): CatalogProvider {
  return fragantyProvider;
}

export { POPULAR_BRANDS, MIDDLE_EAST_BRANDS } from '@/catalog/brands';
export type { CatalogProvider } from '@/catalog/types';
