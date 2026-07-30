import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, Plus, Search, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { getFragrance, getWishlist, removeFromWishlist } from '@/db';
import type { Fragrance, WishlistItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAMILY_COLORS } from '@/lib/stats';
import { inputFieldLg, textSubtle } from '@/lib/ui-classes';
import { SegmentedControl } from '@/components/premium/SegmentedControl';
import { hapticLight } from '@/lib/premium/haptics';
import { enrichFragranceImages } from '@/services/seed';
import { WardrobeCabinet, WardrobeShelf } from '@/components/wardrobe/WardrobeCabinet';
import { WardrobeShelfBottle } from '@/components/wardrobe/WardrobeShelfBottle';
import { WishlistEditorialCard } from '@/components/wardrobe/WishlistEditorialCard';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { parseBaseName } from '@/services/onlineCatalog';

type WardrobeTab = 'owned' | 'want' | 'tested';

const TABS: { id: WardrobeTab; label: string; icon: typeof Heart }[] = [
  { id: 'owned', label: 'Owned', icon: Star },
  { id: 'want', label: 'Want', icon: Heart },
  { id: 'tested', label: 'Tested', icon: Star },
];

function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
  return rows;
}

export function CollectionPage() {
  const { collection, refresh } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<WardrobeTab>(
    tabParam === 'want' || tabParam === 'tested' ? tabParam : 'owned',
  );
  const [items, setItems] = useState<{ c: typeof collection[0]; f?: Fragrance }[]>([]);
  const [wishlist, setWishlist] = useState<{ w: WishlistItem; f?: Fragrance }[]>([]);
  const [q, setQ] = useState('');
  const [family, setFamily] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam === 'want' || tabParam === 'tested') setTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    Promise.all(collection.map(async (c) => ({ c, f: await getFragrance(c.fragranceId) }))).then(setItems);
    void enrichFragranceImages(collection.map((c) => c.fragranceId)).then(async () => {
      const rows = await Promise.all(collection.map(async (c) => ({ c, f: await getFragrance(c.fragranceId) })));
      setItems(rows);
    });
  }, [collection]);

  useEffect(() => {
    (async () => {
      const list = tab === 'owned' ? [] : await getWishlist(tab);
      const rows = await Promise.all(list.map(async (w) => ({ w, f: await getFragrance(w.fragranceId) })));
      setWishlist(rows.sort((a, b) => b.w.addedAt.localeCompare(a.w.addedAt)));
    })();
  }, [tab, collection]);

  const switchTab = (next: WardrobeTab) => {
    if (next !== tab) hapticLight();
    setTab(next);
    setQ('');
    setFamily(null);
    if (next === 'owned') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', next);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const families = useMemo(
    () => [...new Set(items.map((i) => i.f?.family).filter(Boolean))] as string[],
    [items],
  );

  const filteredOwned = items.filter(({ f }) => {
    if (family && f?.family !== family) return false;
    if (!q) return true;
    const s = `${f?.brand} ${f?.name}`.toLowerCase();
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    return tokens.every((t) => s.includes(t));
  });

  const filteredWishlist = wishlist.filter(({ f }) => {
    if (!q) return true;
    const s = `${f?.brand} ${f?.name}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const totalValue = collection.reduce((s, c) => s + (c.purchasePrice ?? 0), 0);
  const signatureItem = items.find(({ c }) => c.isSignature) ?? items.find(({ c }) => c.isFavorite);
  const shelfRows = chunk(filteredOwned, 2);

  const removeWishlistItem = async (w: WishlistItem) => {
    await removeFromWishlist(w.id);
    await refresh();
    const list = await getWishlist(tab as 'want' | 'tested');
    const rows = await Promise.all(list.map(async (item) => ({ w: item, f: await getFragrance(item.fragranceId) })));
    setWishlist(rows);
  };

  if (tab === 'owned' && !collection.length) {
    return (
      <div className="atelier-page">
        <EmptyState
          eyebrow="Collection"
          title="Your cabinet is empty"
          description="Search the catalog and add bottles you own. Everything stays on this device."
          action={{ label: 'Add first bottle', to: '/add' }}
        />
      </div>
    );
  }

  return (
    <div className="atelier-page space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="atelier-page__brand">Collection</p>
          <h1 className="atelier-page__title">
            {tab === 'owned' ? 'My bottles' : tab === 'want' ? 'Wishlist' : 'Tested'}
          </h1>
          {tab === 'owned' && collection.length > 0 && (
            <p className="atelier-page__sub">
              {collection.length} bottle{collection.length !== 1 ? 's' : ''}
              {totalValue > 0 && ` · ${formatCurrency(totalValue)}`}
            </p>
          )}
        </div>
        <Button
          to={tab === 'owned' ? '/add' : `/add?list=${tab}`}
          size="sm"
          className="btn-glow !min-h-[40px] !rounded-xl shrink-0"
          haptic="medium"
          aria-label={tab === 'owned' ? 'Add fragrance' : tab === 'want' ? 'Add to Want list' : 'Add to Tested list'}
        >
          <Plus size={16} aria-hidden />
        </Button>
      </header>

      {tab === 'owned' && signatureItem?.f && !q && !family && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="atelier-panel"
          style={{ '--featured-aura': FAMILY_COLORS[signatureItem.f.family] ?? 'var(--sc-accent)' } as React.CSSProperties}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--sc-text-muted)]">Featured</p>
          <div className="wardrobe-featured-inner !mt-3">
            <FragranceThumb
              brand={signatureItem.f.brand}
              name={signatureItem.f.name}
              family={signatureItem.f.family}
              catalogImage={signatureItem.f.image}
              fragrance={signatureItem.f}
              size="hero"
              className="wardrobe-featured-bottle !h-[120px] !bg-transparent"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-[var(--sc-text-muted)]">{signatureItem.f.brand}</p>
              <p className="text-xl font-semibold leading-tight mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                {parseBaseName(signatureItem.f.name)}
              </p>
              <p className="text-xs font-semibold text-[var(--sc-accent)] mt-1">{signatureItem.f.concentration}</p>
            </div>
          </div>
        </motion.div>
      )}

      <SegmentedControl
        options={TABS.map(({ id, label, icon: Icon }) => ({
          value: id,
          label,
          icon: <Icon size={13} strokeWidth={2.25} />,
        }))}
        value={tab}
        onChange={switchTab}
      />

      <div className="relative">
        <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSubtle}`} aria-hidden />
        <label htmlFor="collection-search" className="sr-only">
          {tab === 'owned' ? 'Search your wardrobe' : `Search ${tab} list`}
        </label>
        <input
          id="collection-search"
          role="searchbox"
          className={`${inputFieldLg} pl-11`}
          placeholder={tab === 'owned' ? 'Search your wardrobe…' : `Search ${tab} list…`}
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {tab === 'owned' && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button type="button" onClick={() => setFamily(null)} className={`atelier-chip ${!family ? 'atelier-chip--on' : ''}`}>All</button>
          {families.map((fam) => (
            <button
              key={fam}
              type="button"
              onClick={() => setFamily(fam)}
              className={`atelier-chip ${family === fam ? 'atelier-chip--on' : ''}`}
              style={family === fam ? undefined : { borderLeft: `3px solid ${FAMILY_COLORS[fam] ?? 'var(--sc-accent)'}` }}
            >
              {fam}
            </button>
          ))}
        </div>
      )}

      {tab === 'owned' ? (
        <WardrobeCabinet label={filteredOwned.length ? `${filteredOwned.length} on display` : undefined}>
          {shelfRows.length === 0 ? null : (
            shelfRows.map((row, rowIdx) => (
              <WardrobeShelf key={rowIdx}>
                {row.map(({ c, f }, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: rowIdx * 0.06 + i * 0.04 }}
                  >
                    <WardrobeShelfBottle c={c} f={f} />
                  </motion.div>
                ))}
              </WardrobeShelf>
            ))
          )}
        </WardrobeCabinet>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredWishlist.map(({ w, f }, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <WishlistEditorialCard
                w={w}
                f={f}
                tab={tab}
                index={i}
                onRemove={() => void removeWishlistItem(w)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'owned' && collection.length > 0 && filteredOwned.length === 0 && (
        <EmptyState
          title="No matches"
          description="Try a different search or family filter."
        />
      )}

      {tab !== 'owned' && !wishlist.length && (
        <EmptyState
          title={tab === 'want' ? 'Nothing on your wishlist' : 'No tested fragrances'}
          description="Search the catalog and save fragrances you want to try or have sampled."
          action={{ label: tab === 'want' ? 'Add to Want list' : 'Log a tested scent', to: `/add?list=${tab}` }}
        />
      )}
    </div>
  );
}
