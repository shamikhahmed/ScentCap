import type { CatalogSnapshot } from '@/types';

export interface CatalogProvider {
  id: string;
  search(q: string): Promise<CatalogSnapshot[]>;
  lookup(id: string): Promise<CatalogSnapshot | null>;
  image(snapshot: CatalogSnapshot): string | undefined;
  refresh(id: string): Promise<CatalogSnapshot | null>;
}
