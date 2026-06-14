import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, Plus, Search, Star, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FamilyIcon } from '@/components/ui/FamilyIcon';
import { useApp } from '@/context/AppContext';
import { getFragrance, getWishlist, removeFromWishlist } from '@/db';
import type { Fragrance, WishlistItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { BottleCard } from '@/components/collection/BottleCard';
import { FAMILY_COLORS } from '@/lib/stats';
import { chipActive, chipInactive, inputFieldLg, segmentActive, segmentBar, segmentInactive, textMuted, textSubtle } from '@/lib/ui-classes';

type WardrobeTab = 'owned' | 'want' | 'tested';

const TABS: { id: WardrobeTab; label: string; icon: typeof Heart }[] = [
  { id: 'owned', label: 'Owned', icon: Star },
  { id: 'want', label: 'Want', icon: Heart },
  { id: 'tested', label: 'Tested', icon: Star },
];

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
  }, [collection]);

  useEffect(() => {
    (async () => {
      const list = tab === 'owned' ? [] : await getWishlist(tab);
      const rows = await Promise.all(list.map(async (w) => ({ w, f: await getFragrance(w.fragranceId) })));
      setWishlist(rows.sort((a, b) => b.w.addedAt.localeCompare(a.w.addedAt)));
    })();
  }, [tab, collection]);

  const switchTab = (next: WardrobeTab) => {
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
    return tokens.every((t) => s.includes(t) || f?.brand.toLowerCase().includes(t) || f?.name.toLowerCase().includes(t));
  });

  const filteredWishlist = wishlist.filter(({ f }) => {
    if (!q) return true;
    const s = `${f?.brand} ${f?.name}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const totalValue = collection.reduce((s, c) => s + (c.purchasePrice ?? 0), 0);
  const countLabel = tab === 'owned' ? collection.length : wishlist.length;

  return (
    <div className="safe-pt px-5 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Wardrobe</p>
          <h1 className="text-3xl font-semibold mt-1">
            {tab === 'owned' ? `${collection.length} bottles` : `${countLabel} ${tab === 'want' ? 'on wishlist' : 'tested'}`}
          </h1>
          {tab === 'owned' && (
            <p className={`text-sm ${textMuted}`}>{formatCurrency(totalValue)} collection value</p>
          )}
        </div>
        <Link to={tab === 'owned' ? '/add' : `/add?list=${tab}`}>
          <Button size="sm"><Plus size={16} /></Button>
        </Link>
      </div>

      <div className={segmentBar}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === id ? segmentActive : segmentInactive
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSubtle}`} />
        <input
          className={`${inputFieldLg} pl-11`}
          placeholder={tab === 'owned' ? 'Search your wardrobe…' : `Search ${tab} list…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {tab === 'owned' && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button type="button" onClick={() => setFamily(null)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${!family ? chipActive : chipInactive}`}>All</button>
          {families.map((fam) => (
            <button
              key={fam}
              type="button"
              onClick={() => setFamily(fam)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${family === fam ? chipActive : chipInactive}`}
              style={family === fam ? {} : { borderLeft: `3px solid ${FAMILY_COLORS[fam] ?? '#c9a87c'}` }}
            >
              {fam}
            </button>
          ))}
        </div>
      )}

      {tab === 'owned' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredOwned.map(({ c, f }, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <BottleCard c={c} f={f} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWishlist.map(({ w, f }, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="flex items-center gap-3 py-3">
                <FamilyIcon family={f?.family} size={18} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${textSubtle}`}>{f?.brand ?? 'Unknown brand'}</p>
                  <p className="font-medium truncate text-[var(--color-text-primary)]">{f?.name ?? w.fragranceId}</p>
                  {f && <p className={`text-xs ${textSubtle}`}>{f.concentration}</p>}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await removeFromWishlist(w.id);
                    await refresh();
                    const list = await getWishlist(tab);
                    const rows = await Promise.all(list.map(async (item) => ({ w: item, f: await getFragrance(item.fragranceId) })));
                    setWishlist(rows);
                  }}
                  className="p-2 text-stone-500 hover:text-red-400"
                  aria-label="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'owned' && !collection.length && (
        <Card className="text-center py-12">
          <p className={`${textMuted} mb-4`}>Your wardrobe is empty</p>
          <Link to="/add"><Button>Add your first bottle</Button></Link>
        </Card>
      )}

      {tab !== 'owned' && !wishlist.length && (
        <Card className="text-center py-12">
          <p className={`${textMuted} mb-2`}>
            {tab === 'want' ? 'Nothing on your wishlist yet' : 'No tested fragrances logged'}
          </p>
          <p className={`text-xs ${textSubtle} mb-4`}>Search the catalog and save fragrances you want to try or have sampled.</p>
          <Link to={`/add?list=${tab}`}><Button>Add to {tab === 'want' ? 'Want list' : 'Tested'}</Button></Link>
        </Card>
      )}
    </div>
  );
}
