import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, PenLine, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FamilyIcon } from '@/components/ui/FamilyIcon';
import {
  addToCollection,
  addToWishlist,
  getAllCollection,
  getFragrance,
  getRecentAdditions,
  getWishlistByFragrance,
  putFragrance,
  savePhoto,
  searchFragranceGroups,
} from '@/db';
import { enrichFragranceOnce } from '@/services/seed';
import { useApp } from '@/context/AppContext';
import { usePro } from '@/context/ProContext';
import type { BottleType, Concentration, Fragrance, GenderLean, Longevity, Projection, WishlistList } from '@/types';
import { CONCENTRATIONS } from '@/types';
import { estimateWearsRemaining, uid } from '@/lib/utils';
import { FREE_BOTTLE_LIMIT } from '@/lib/pro';

const BOTTLE_TYPES: { id: BottleType; label: string }[] = [
  { id: 'full', label: 'Full bottle' },
  { id: 'decant', label: 'Decant' },
  { id: 'travel', label: 'Travel' },
];

export function AddFragrance() {
  const { collection, refresh } = useApp();
  const { canAddBottle, requestFeature } = usePro();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listTarget = (searchParams.get('list') as WishlistList | null) ?? null;

  const [tab, setTab] = useState<'search' | 'manual'>(listTarget ? 'search' : 'search');
  const [q, setQ] = useState('');
  const [groups, setGroups] = useState<Awaited<ReturnType<typeof searchFragranceGroups>>>([]);
  const [recents, setRecents] = useState<Fragrance[]>([]);
  const [picked, setPicked] = useState<Fragrance | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ sizeMl: '100', price: '', opened: '', purchase: '' });
  const [bottleType, setBottleType] = useState<BottleType>('full');
  const [parentCollectionId, setParentCollectionId] = useState('');
  const [parentOptions, setParentOptions] = useState<{ id: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const col = await getAllCollection();
      const opts = await Promise.all(
        col
          .filter((c) => (c.bottleType ?? 'full') === 'full')
          .map(async (c) => {
            const f = await getFragrance(c.fragranceId);
            return { id: c.id, label: f ? `${f.brand} — ${f.name}` : c.id };
          }),
      );
      setParentOptions(opts);
    })();
  }, [collection]);

  const loadResults = async (query: string) => {
    if (!query.trim()) {
      setGroups([]);
      setRecents(await getRecentAdditions());
      return;
    }
    setRecents([]);
    setGroups(await searchFragranceGroups(query));
  };

  useEffect(() => {
    loadResults('');
  }, []);

  const search = async (query: string) => {
    setQ(query);
    setPicked(null);
    await loadResults(query);
  };

  const confirmAdd = async (f: Fragrance) => {
    if (!canAddBottle()) {
      requestFeature('bottle_limit');
      return;
    }
    if ((bottleType === 'decant' || bottleType === 'travel') && !parentCollectionId) return;
    setSaving(true);
    try {
      await enrichFragranceOnce(f);
      const colId = uid();
      let photoBlobId: string | undefined;
      if (photoFile) {
        photoBlobId = `photo-${colId}`;
        await savePhoto(photoBlobId, photoFile);
      }
      const defaultSize = bottleType === 'decant' ? '10' : bottleType === 'travel' ? '30' : meta.sizeMl;
      await addToCollection({
        id: colId,
        fragranceId: f.id,
        bottleLevel: 'full',
        bottleType,
        parentCollectionId: bottleType === 'full' ? undefined : parentCollectionId,
        bottleSizeMl: Number(defaultSize) || (bottleType === 'decant' ? 10 : 100),
        purchasePrice: meta.price ? Number(meta.price) : undefined,
        purchaseDate: meta.purchase || undefined,
        openedDate: meta.opened || undefined,
        photoBlobId,
        isFavorite: false,
        isSignature: false,
        addedAt: new Date().toISOString(),
        estimatedWearsRemaining: estimateWearsRemaining('full', f.concentration),
      });
      await refresh();
      navigate('/collection');
    } finally {
      setSaving(false);
    }
  };

  const addToList = async (f: Fragrance, list: WishlistList) => {
    setSaving(true);
    try {
      await enrichFragranceOnce(f);
      const existing = await getWishlistByFragrance(f.id, list);
      if (!existing) {
        await addToWishlist({
          id: uid(),
          fragranceId: f.id,
          list,
          addedAt: new Date().toISOString(),
        });
      }
      await refresh();
      navigate(`/collection?tab=${list}`);
    } finally {
      setSaving(false);
    }
  };

  const [manual, setManual] = useState({
    name: '', brand: '', concentration: 'EDP' as Concentration,
    family: 'Fresh', projection: 'moderate' as Projection, longevity: 'medium' as Longevity,
    gender_lean: 'unisex' as GenderLean,
  });

  const addManual = async () => {
    const id = `${manual.brand}-${manual.name}-${manual.concentration}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const f: Fragrance = {
      id, name: manual.name, brand: manual.brand, concentration: manual.concentration,
      family: manual.family, subfamily: manual.family, projection: manual.projection,
      longevity: manual.longevity, seasonality: ['spring', 'summer'], day_night: 'versatile',
      gender_lean: manual.gender_lean, top_notes: [], heart_notes: [], base_notes: [],
      office_score: 60, heat_score: 70, cold_score: 60, date_score: 70, formal_score: 60,
      casual_score: 75, layering_tags: ['fresh'],
    };
    await putFragrance(f);
    if (listTarget === 'want' || listTarget === 'tested') {
      await addToList(f, listTarget);
      return;
    }
    setPicked(f);
    await confirmAdd(f);
  };

  const needsParent = bottleType === 'decant' || bottleType === 'travel';
  const canAdd = !needsParent || Boolean(parentCollectionId);
  const atBottleLimit = !canAddBottle();

  const renderGroup = (g: { key: string; brand: string; name: string; variants: Fragrance[] }) => (
    <Card key={g.key} className="py-3">
      <div className="flex items-center gap-3">
        <FamilyIcon family={g.variants[0]?.family} size={16} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-stone-500">{g.brand}</p>
          <p className="font-medium truncate">{g.name}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {g.variants.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setPicked(v)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 hover:border-[var(--color-accent)]"
          >
            {v.concentration}
          </button>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="safe-pt px-5 py-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Add fragrance</h1>
        {listTarget && (
          <p className="text-sm text-[var(--color-accent)] mt-1">
            Adding to {listTarget === 'want' ? 'Want list' : 'Tested list'}
          </p>
        )}
      </div>

      <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
        <Button
          variant={tab === 'search' ? 'default' : 'ghost'}
          className="flex-1 gap-2"
          onClick={() => setTab('search')}
        >
          <Search size={16} />
          Search catalog
        </Button>
        <Button
          variant={tab === 'manual' ? 'default' : 'ghost'}
          className="flex-1 gap-2"
          onClick={() => setTab('manual')}
        >
          <PenLine size={16} />
          Add manually
        </Button>
      </div>

      {atBottleLimit && !listTarget && (
        <Card className="border-amber-500/30 bg-amber-500/10 text-sm text-amber-200">
          Free plan: {FREE_BOTTLE_LIMIT} bottles max. Upgrade to Pro for unlimited wardrobe.
        </Card>
      )}

      {!listTarget && (
        <Card className="space-y-3">
          <p className="text-xs uppercase text-stone-500">Bottle type</p>
          <div className="flex gap-2 flex-wrap">
            {BOTTLE_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setBottleType(t.id); if (t.id === 'full') setParentCollectionId(''); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold ${
                  bottleType === t.id ? 'bg-[var(--color-accent)] text-stone-950' : 'bg-white/5 text-stone-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {needsParent && (
            <div className="space-y-1">
              <label className="text-xs text-stone-500">Link to parent bottle</label>
              <select
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
                value={parentCollectionId}
                onChange={(e) => setParentCollectionId(e.target.value)}
              >
                <option value="">Select parent bottle…</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              {!parentOptions.length && (
                <p className="text-xs text-amber-400">Add a full bottle first to link decants or travel sizes.</p>
              )}
            </div>
          )}
        </Card>
      )}

      {!listTarget && (
        <Card className="space-y-3">
          <p className="text-xs uppercase text-stone-500">Bottle details (optional)</p>
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" placeholder="Size (ml)" value={meta.sizeMl} onChange={(e) => setMeta({ ...meta, sizeMl: e.target.value })} />
            <input className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" placeholder="Price $" value={meta.price} onChange={(e) => setMeta({ ...meta, price: e.target.value })} />
            <input type="date" className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" title="Purchased" value={meta.purchase} onChange={(e) => setMeta({ ...meta, purchase: e.target.value })} />
            <input type="date" className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" title="Opened" value={meta.opened} onChange={(e) => setMeta({ ...meta, opened: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-400 cursor-pointer">
            <Camera size={16} />
            <span>Photo (optional)</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
            {photoFile ? photoFile.name : 'Choose file'}
          </label>
        </Card>
      )}

      {tab === 'search' ? (
        <>
          <input
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-[var(--color-accent)]"
            placeholder="Search by brand or name…"
            value={q}
            onChange={(e) => search(e.target.value)}
          />
          {picked ? (
            <Card className="space-y-3 border-[var(--color-accent)]/40">
              <div className="flex gap-3 items-center">
                <FamilyIcon family={picked.family} />
                <div>
                  <p className="text-xs text-stone-500">{picked.brand}</p>
                  <p className="font-semibold">{picked.name}</p>
                  <p className="text-sm text-[var(--color-accent)]">{picked.concentration}</p>
                </div>
              </div>
              {listTarget ? (
                <Button className="w-full" onClick={() => addToList(picked, listTarget)} disabled={saving}>
                  Add to {listTarget === 'want' ? 'Want list' : 'Tested list'}
                </Button>
              ) : (
                <>
                  <Button className="w-full" onClick={() => confirmAdd(picked)} disabled={!canAdd || saving}>
                    Add to wardrobe
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => addToList(picked, 'want')} disabled={saving}>
                      Want list
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => addToList(picked, 'tested')} disabled={saving}>
                      Tested
                    </Button>
                  </div>
                </>
              )}
              <Button variant="ghost" className="w-full" onClick={() => setPicked(null)}>Back</Button>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {!q && recents.length > 0 && (
                <>
                  <p className="text-xs uppercase tracking-wider text-stone-500 px-1">Recent additions</p>
                  {recents.map((f) => renderGroup({
                    key: `${f.brand}::${f.name}`,
                    brand: f.brand,
                    name: f.name,
                    variants: [f],
                  }))}
                </>
              )}
              {!q && !recents.length && (
                <p className="text-sm text-stone-500 text-center py-6">Search 2,300+ fragrances or add manually</p>
              )}
              {q && !groups.length && (
                <p className="text-sm text-stone-500 text-center py-6">No matches — try fewer letters or add manually</p>
              )}
              {groups.map(renderGroup)}
            </div>
          )}
        </>
      ) : (
        <Card className="space-y-4">
          <p className="text-sm text-stone-400">Can&apos;t find it? Enter brand and name — we&apos;ll save it locally.</p>
          {(['name', 'brand'] as const).map((k) => (
            <input
              key={k}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 capitalize"
              placeholder={k === 'name' ? 'Fragrance name' : 'Brand'}
              value={manual[k]}
              onChange={(e) => setManual({ ...manual, [k]: e.target.value })}
            />
          ))}
          <select className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3" value={manual.concentration} onChange={(e) => setManual({ ...manual, concentration: e.target.value as Concentration })}>
            {CONCENTRATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button
            className="w-full"
            onClick={addManual}
            disabled={!manual.name || !manual.brand || (!listTarget && !canAdd) || saving}
          >
            {listTarget === 'want' ? 'Save to Want list' : listTarget === 'tested' ? 'Save to Tested' : 'Save to wardrobe'}
          </Button>
        </Card>
      )}
    </div>
  );
}
