import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Star, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getFragrance, getWishlist, removeFromWishlist } from '@/db';
import type { CollectionItem, Fragrance, WishlistItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { hapticLight } from '@/lib/premium/haptics';
import { enrichFragranceImages } from '@/services/seed';
import { BottleCard, PageHeader } from '@/components/kit';
import { PressableLink } from '@/components/ui/PressableScale';
import { usePhotoUrl } from '@/hooks/usePhotoUrl';
import { concentrationLabel } from '@/lib/fragranceName';

type WardrobeTab = 'owned' | 'want' | 'tested';

const TABS: { id: WardrobeTab; label: string }[] = [
  { id: 'owned', label: 'Owned' },
  { id: 'want', label: 'Wishlist' },
  { id: 'tested', label: 'Tested' },
];

const LEVEL_LABEL: Record<string, string> = {
  full: 'Full',
  '75': '¾ full',
  '50': 'Half full',
  '25': '¼ left',
  '10': 'Running low',
  empty: 'Empty',
};

type SortKey = 'recent' | 'brand' | 'name';

function OwnedCard({ c, f }: { c: CollectionItem; f?: Fragrance }) {
  const photoUrl = usePhotoUrl(c.photoBlobId);
  const kind = c.bottleType && c.bottleType !== 'full' ? c.bottleType[0].toUpperCase() + c.bottleType.slice(1) : null;
  const meta = [f ? concentrationLabel(f.concentration) : null, kind ?? LEVEL_LABEL[c.bottleLevel] ?? null]
    .filter(Boolean)
    .join(' · ');
  return (
    <BottleCard
      fragrance={f}
      to={`/fragrance/${c.id}`}
      photoUrl={photoUrl}
      meta={meta}
      badge={
        c.isFavorite || c.isSignature ? (
          <span className="ui-tag ui-tag--tint !bg-[var(--surface)] shadow-[var(--shadow-1)]" aria-label={c.isSignature ? 'Signature' : 'Favourite'}>
            <Star size={11} fill="currentColor" aria-hidden />
          </span>
        ) : undefined
      }
    />
  );
}

export function CollectionPage() {
  const { collection, refresh } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<WardrobeTab>(tabParam === 'want' || tabParam === 'tested' ? tabParam : 'owned');
  const [items, setItems] = useState<{ c: CollectionItem; f?: Fragrance }[]>([]);
  const [wishlist, setWishlist] = useState<{ w: WishlistItem; f?: Fragrance }[]>([]);
  const [q, setQ] = useState('');
  const [family, setFamily] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('recent');

  useEffect(() => {
    if (tabParam === 'want' || tabParam === 'tested') setTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    let cancelled = false;
    const load = () => Promise.all(collection.map(async (c) => ({ c, f: await getFragrance(c.fragranceId) })));
    void load().then((rows) => !cancelled && setItems(rows));
    void enrichFragranceImages(collection.map((c) => c.fragranceId)).then(load).then((rows) => !cancelled && setItems(rows));
    return () => {
      cancelled = true;
    };
  }, [collection]);

  const loadWishlist = async (which: WardrobeTab) => {
    const list = which === 'owned' ? [] : await getWishlist(which);
    const rows = await Promise.all(list.map(async (w) => ({ w, f: await getFragrance(w.fragranceId) })));
    setWishlist(rows.sort((a, b) => b.w.addedAt.localeCompare(a.w.addedAt)));
  };

  useEffect(() => {
    void loadWishlist(tab);
  }, [tab, collection]);

  const switchTab = (next: WardrobeTab) => {
    if (next !== tab) hapticLight();
    setTab(next);
    setQ('');
    setFamily(null);
    if (next === 'owned') searchParams.delete('tab');
    else searchParams.set('tab', next);
    setSearchParams(searchParams, { replace: true });
  };

  const families = useMemo(
    () => [...new Set(items.map((i) => i.f?.family).filter(Boolean))].sort() as string[],
    [items],
  );

  const matches = (f?: Fragrance) => {
    if (!q) return true;
    const s = `${f?.brand} ${f?.name}`.toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => s.includes(t));
  };

  const filteredOwned = items
    .filter(({ f }) => (!family || f?.family === family) && matches(f))
    .sort((a, b) => {
      if (sort === 'brand') return (a.f?.brand ?? '').localeCompare(b.f?.brand ?? '') || (a.f?.name ?? '').localeCompare(b.f?.name ?? '');
      if (sort === 'name') return (a.f?.name ?? '').localeCompare(b.f?.name ?? '');
      return b.c.addedAt.localeCompare(a.c.addedAt);
    });
  const filteredWishlist = wishlist.filter(({ f }) => matches(f));

  const totalValue = collection.reduce((s, c) => s + (c.purchasePrice ?? 0), 0);
  const addTo = tab === 'owned' ? '/add' : `/add?list=${tab}`;

  const removeWishlistItem = async (w: WishlistItem) => {
    await removeFromWishlist(w.id);
    await refresh();
    await loadWishlist(tab);
  };

  if (tab === 'owned' && !collection.length) {
    return (
      <EmptyState
        eyebrow="Collection"
        title="Your shelf is empty"
        description="Search over a thousand real fragrances and add the bottles you own. Everything stays on this device."
        action={{ label: 'Add your first bottle', to: '/add' }}
      />
    );
  }

  const subtitle =
    tab === 'owned'
      ? `${collection.length} bottle${collection.length !== 1 ? 's' : ''}${totalValue > 0 ? ` · ${formatCurrency(totalValue)}` : ''}`
      : `${wishlist.length} saved`;

  return (
    <div className="ui-page">
      <PageHeader
        title="Collection"
        subtitle={subtitle}
        trailing={
          <PressableLink
            to={addTo}
            className="ui-icon-btn ui-icon-btn--tint"
            aria-label={tab === 'owned' ? 'Add fragrance' : tab === 'want' ? 'Add to wishlist' : 'Add tested fragrance'}
          >
            <Plus size={20} strokeWidth={2.6} aria-hidden />
          </PressableLink>
        }
      />

      <div className="ui-segmented" role="group" aria-label="List">
        {TABS.map((t) => (
          <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => switchTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-4 items-center">
        <label className="ui-search flex-1">
          <Search size={17} aria-hidden />
          <span className="sr-only">{tab === 'owned' ? 'Search your collection' : `Search ${tab} list`}</span>
          <input
            id="collection-search"
            type="search"
            role="searchbox"
            placeholder={tab === 'owned' ? 'Search your bottles' : 'Search this list'}
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className="text-[var(--label-3)] p-1" onClick={() => setQ('')} aria-label="Clear search">
              <X size={16} aria-hidden />
            </button>
          )}
        </label>
        {tab === 'owned' && (
          <label className="ui-chip !min-h-[44px] !px-3 shrink-0">
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-transparent border-0 outline-none font-medium text-[var(--t-subhead)] appearance-none cursor-pointer"
            >
              <option value="recent">Recent</option>
              <option value="brand">Brand</option>
              <option value="name">Name</option>
            </select>
          </label>
        )}
      </div>

      {tab === 'owned' && families.length > 1 && (
        <div className="ui-scroller !gap-2 mt-3" role="group" aria-label="Filter by family">
          <button type="button" className="ui-chip" aria-pressed={!family} onClick={() => setFamily(null)}>
            All
          </button>
          {families.map((fam) => (
            <button key={fam} type="button" className="ui-chip" aria-pressed={family === fam} onClick={() => setFamily(family === fam ? null : fam)}>
              {fam}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        {tab === 'owned' ? (
          filteredOwned.length ? (
            <div className="ui-grid">
              {filteredOwned.map(({ c, f }) => (
                <OwnedCard key={c.id} c={c} f={f} />
              ))}
            </div>
          ) : (
            <p className="ui-secondary text-center py-16">No bottles match “{q || family}”.</p>
          )
        ) : filteredWishlist.length ? (
          <div className="ui-grid">
            {filteredWishlist.map(({ w, f }) => (
              <div key={w.id} className="relative">
                <BottleCard
                  fragrance={f}
                  meta={`Added ${new Date(w.addedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
                />
                <button
                  type="button"
                  className="ui-icon-btn absolute top-2 right-2 !w-8 !h-8 !bg-[var(--surface)] shadow-[var(--shadow-2)]"
                  onClick={() => void removeWishlistItem(w)}
                  aria-label={`Remove ${f?.name ?? 'fragrance'} from list`}
                >
                  <X size={15} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="ui-title2">{tab === 'want' ? 'Nothing on your wishlist yet' : 'No tested fragrances yet'}</p>
            <p className="ui-secondary mt-2 text-[var(--t-subhead)]">
              Save fragrances you want to try, or ones you’ve sampled.
            </p>
            <PressableLink to={addTo} className="ui-btn ui-btn--secondary mt-6">
              {tab === 'want' ? 'Find a fragrance' : 'Log a tested scent'}
            </PressableLink>
          </div>
        )}
      </div>
    </div>
  );
}
