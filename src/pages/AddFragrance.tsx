import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, PenLine, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptionPill } from '@/components/ui/OptionPill';
import { useKeyboardInset, scrollInputIntoView } from '@/hooks/useKeyboardInset';
import { hapticSelection, hapticSuccess } from '@/lib/premium/haptics';
import {
  addToCollection,
  addToWishlist,
  getAllCollection,
  getFragrance,
  getWishlistByFragrance,
  putFragrance,
  savePhoto,
} from '@/db';
import { enrichFragranceOnce } from '@/services/seed';
import {
  ensureFragranceCatalogEntry,
  getRecentAdditionsWithImages,
  searchCatalogWithImages,
  type FragranceGroup,
} from '@/services/catalogSearch';
import { concentrationLabel, parseBaseName } from '@/services/onlineCatalog';
import { CatalogEditorialCard } from '@/components/catalog/CatalogEditorialCard';
import { DidYouMeanBanner } from '@/components/catalog/DidYouMeanBanner';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { useApp } from '@/context/AppContext';
import type { BottleType, Concentration, Fragrance, GenderLean, Longevity, Projection, WishlistList } from '@/types';
import { CONCENTRATIONS } from '@/types';
import { estimateWearsRemaining, uid } from '@/lib/utils';
import { MIDDLE_EAST_BRANDS, POPULAR_BRANDS } from '@/catalog/brands';
import { inputFieldLg, segmentBar, textSubtle } from '@/lib/ui-classes';

const BOTTLE_TYPES: { id: BottleType; label: string }[] = [
  { id: 'full', label: 'Full bottle' },
  { id: 'decant', label: 'Decant' },
  { id: 'travel', label: 'Travel' },
  { id: 'sample', label: 'Sample' },
];

export function AddFragrance() {
  const { collection, refresh } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listTarget = (searchParams.get('list') as WishlistList | null) ?? null;

  const [tab, setTab] = useState<'search' | 'manual'>(listTarget ? 'search' : 'search');
  const [q, setQ] = useState('');
  const [groups, setGroups] = useState<FragranceGroup[]>([]);
  const [recents, setRecents] = useState<Fragrance[]>([]);
  const [picked, setPicked] = useState<Fragrance | null>(null);
  const [activeGroup, setActiveGroup] = useState<FragranceGroup | null>(null);
  const [pickingImage, setPickingImage] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ sizeMl: '100', price: '', opened: '', purchase: '' });
  const [bottleType, setBottleType] = useState<BottleType>('full');
  const [parentCollectionId, setParentCollectionId] = useState('');
  const [parentOptions, setParentOptions] = useState<{ id: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchingOnline, setSearchingOnline] = useState(false);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [searchedAs, setSearchedAs] = useState<string | null>(null);
  const keyboardInset = useKeyboardInset();

  const inputClass = `${inputFieldLg} text-sm`;

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
      setDidYouMean(null);
      setSearchedAs(null);
      setRecents(await getRecentAdditionsWithImages());
      return;
    }
    setRecents([]);
    setSearchingOnline(true);
    try {
      const result = await searchCatalogWithImages(query, 20);
      setGroups(result.groups);
      setDidYouMean(result.didYouMean);
      setSearchedAs(result.searchedAs);
    } finally {
      setSearchingOnline(false);
    }
  };

  useEffect(() => {
    void loadResults('');
  }, []);

  const search = (query: string) => {
    setQ(query);
    setPicked(null);
    setActiveGroup(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void loadResults(query);
    }, 280);
  };

  const applySuggestion = (suggestion: string) => {
    hapticSelection();
    setQ(suggestion);
    setPicked(null);
    setActiveGroup(null);
    void loadResults(suggestion);
  };

  const openGroup = (g: FragranceGroup) => {
    hapticSelection();
    setActiveGroup(g);
    setPicked(null);
  };

  const pickVariant = async (f: Fragrance) => {
    hapticSelection();
    setPickingImage(true);
    try {
      const enriched = await ensureFragranceCatalogEntry(f);
      setPicked(enriched);
    } finally {
      setPickingImage(false);
    }
  };

  const confirmAdd = async (f: Fragrance) => {
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
      hapticSuccess();
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
      hapticSuccess();
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
    const enriched = await enrichFragranceOnce(f);
    if (listTarget === 'want' || listTarget === 'tested') {
      await addToList(enriched, listTarget);
      return;
    }
    setPicked(enriched);
    await confirmAdd(enriched);
  };

  const needsParent = bottleType === 'decant' || bottleType === 'travel';
  const canAdd = !needsParent || Boolean(parentCollectionId);

  return (
    <div
      className="atelier-page space-y-6"
      style={{ paddingBottom: keyboardInset > 0 ? keyboardInset + 24 : undefined }}
    >
      <div>
        <p className="atelier-page__brand">Catalog</p>
        <h1 className="atelier-page__title">Add fragrance</h1>
        {listTarget && (
          <p className="text-sm text-[var(--color-accent)] mt-1">
            Adding to {listTarget === 'want' ? 'Want list' : 'Tested list'}
          </p>
        )}
      </div>

      <div className={segmentBar} role="group" aria-label="Add method">
        <Button
          aria-pressed={tab === 'search'}
          variant={tab === 'search' ? 'default' : 'ghost'}
          className="flex-1 gap-2 min-h-[44px]"
          onClick={() => setTab('search')}
        >
          <Search size={16} />
          Search catalog
        </Button>
        <Button
          aria-pressed={tab === 'manual'}
          variant={tab === 'manual' ? 'default' : 'ghost'}
          className="flex-1 gap-2 min-h-[44px]"
          onClick={() => setTab('manual')}
        >
          <PenLine size={16} />
          Add manually
        </Button>
      </div>

      {!listTarget && (
        <Card className="space-y-3">
          <p className="text-xs uppercase text-[var(--sc-text-muted)]">Bottle type</p>
          <div className="flex gap-2 flex-wrap">
            {BOTTLE_TYPES.map((t) => (
              <OptionPill
                key={t.id}
                label={t.label}
                selected={bottleType === t.id}
                onSelect={() => {
                  setBottleType(t.id);
                  if (t.id === 'full') setParentCollectionId('');
                }}
              />
            ))}
          </div>
          {needsParent && (
            <div className="space-y-1">
              <label htmlFor="parent-bottle" className="text-xs text-[var(--sc-text-muted)]">Link to parent bottle</label>
              <select
                id="parent-bottle"
                className={`${inputClass} py-2`}
                value={parentCollectionId}
                onChange={(e) => setParentCollectionId(e.target.value)}
                aria-invalid={needsParent && !parentCollectionId}
                aria-describedby={!parentOptions.length ? 'parent-hint' : undefined}
              >
                <option value="">Select parent bottle…</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              {!parentOptions.length && (
                <p id="parent-hint" className="text-xs text-[var(--sc-warning)]">Add a full bottle first to link decants or travel sizes.</p>
              )}
              {needsParent && parentOptions.length > 0 && !parentCollectionId && (
                <p className="text-xs text-[var(--sc-danger)]" role="alert">Choose a parent bottle to continue.</p>
              )}
            </div>
          )}
        </Card>
      )}

      {!listTarget && (
        <Card className="space-y-3">
          <p className="text-xs uppercase text-[var(--sc-text-muted)]">Bottle details (optional)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="meta-size" className="text-xs text-[var(--sc-text-muted)]">Size (ml)</label>
              <input id="meta-size" className={inputClass} type="number" inputMode="decimal" autoComplete="off" placeholder="50" value={meta.sizeMl} onChange={(e) => setMeta({ ...meta, sizeMl: e.target.value })} onFocus={(e) => scrollInputIntoView(e.currentTarget)} />
            </div>
            <div className="space-y-1">
              <label htmlFor="meta-price" className="text-xs text-[var(--sc-text-muted)]">Price</label>
              <input id="meta-price" className={inputClass} type="number" inputMode="decimal" autoComplete="off" placeholder="0" value={meta.price} onChange={(e) => setMeta({ ...meta, price: e.target.value })} onFocus={(e) => scrollInputIntoView(e.currentTarget)} />
            </div>
            <div className="space-y-1">
              <label htmlFor="meta-purchase" className="text-xs text-[var(--sc-text-muted)]">Purchased</label>
              <input id="meta-purchase" type="date" className={inputClass} autoComplete="off" value={meta.purchase} onChange={(e) => setMeta({ ...meta, purchase: e.target.value })} onFocus={(e) => scrollInputIntoView(e.currentTarget)} />
            </div>
            <div className="space-y-1">
              <label htmlFor="meta-opened" className="text-xs text-[var(--sc-text-muted)]">Opened</label>
              <input id="meta-opened" type="date" className={inputClass} autoComplete="off" value={meta.opened} onChange={(e) => setMeta({ ...meta, opened: e.target.value })} onFocus={(e) => scrollInputIntoView(e.currentTarget)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--sc-text-soft)] cursor-pointer min-h-[44px]">
            <Camera size={16} aria-hidden />
            <span>Photo (optional)</span>
            <input type="file" accept="image/*" className="hidden" aria-label="Choose bottle photo" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
            <span className="text-[var(--sc-accent)] font-semibold">{photoFile ? photoFile.name : 'Choose file'}</span>
          </label>
        </Card>
      )}

      {tab === 'search' ? (
        <>
          <div className="relative">
            <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSubtle}`} aria-hidden />
            <label htmlFor="catalog-search" className="sr-only">Search catalog by brand or name</label>
            <input
              id="catalog-search"
              role="searchbox"
              className={`${inputClass} rounded-2xl py-3 pl-11 min-h-[48px]`}
              placeholder="Search by brand or name…"
              autoComplete="off"
              value={q}
              onChange={(e) => search(e.target.value)}
              onFocus={(e) => scrollInputIntoView(e.currentTarget)}
            />
          </div>

          {!q.trim() && (
            <div className="space-y-2" data-testid="brand-browse">
              <p className="text-xs uppercase tracking-wider text-[var(--sc-text-muted)]">Popular</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_BRANDS.slice(0, 6).map((b) => (
                  <button key={b} type="button" className="text-xs px-3 py-1.5 rounded-full border border-[var(--sc-border-soft)] text-[var(--sc-text-soft)]" onClick={() => search(b)}>{b}</button>
                ))}
              </div>
              <p className="text-xs uppercase tracking-wider text-[var(--sc-text-muted)] pt-1">Middle East</p>
              <div className="flex flex-wrap gap-2">
                {MIDDLE_EAST_BRANDS.slice(0, 6).map((b) => (
                  <button key={b} type="button" className="text-xs px-3 py-1.5 rounded-full border border-[var(--sc-border-soft)] text-[var(--sc-text-soft)]" onClick={() => search(b)}>{b}</button>
                ))}
              </div>
            </div>
          )}

          {didYouMean && q.trim() && (
            <DidYouMeanBanner
              suggestion={didYouMean}
              searchedAs={searchedAs}
              originalQuery={q}
              onSelect={applySuggestion}
            />
          )}

          {picked ? (
            <Card className="catalog-confirm-card space-y-3">
              <p className="text-caption text-[var(--color-accent)]">Confirm your bottle</p>
              <div className="catalog-confirm-hero">
                <FragranceThumb
                  brand={picked.brand}
                  name={picked.name}
                  family={picked.family}
                  catalogImage={picked.image}
                  fragrance={picked}
                  size="hero"
                  className="catalog-confirm-bottle !h-[160px] mx-auto w-full max-w-[200px]"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--sc-text-muted)]">{picked.brand}</p>
                <p className="text-title mt-0.5">{parseBaseName(picked.name)}</p>
                <p className="text-sm text-[var(--color-accent)] font-medium mt-1">
                  {concentrationLabel(picked.concentration)}
                </p>
              </div>
              {picked.top_notes.length > 0 && (
                <div className="rounded-xl bg-[var(--sc-surface)] border border-[var(--sc-border-soft)] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">Notes</p>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {[...picked.top_notes.slice(0, 2), ...picked.heart_notes.slice(0, 2), ...picked.base_notes.slice(0, 2)].join(' · ')}
                  </p>
                </div>
              )}
              {listTarget ? (
                <Button className="w-full" onClick={() => addToList(picked, listTarget)} disabled={saving}>
                  Add to {listTarget === 'want' ? 'Want list' : 'Tested list'}
                </Button>
              ) : (
                <>
                  <Button className="w-full" onClick={() => confirmAdd(picked)} disabled={!canAdd || saving} haptic="success">
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
              <Button variant="ghost" className="w-full" onClick={() => { setPicked(null); setActiveGroup(null); }}>Back</Button>
            </Card>
          ) : (
            <div className="catalog-results space-y-4 max-h-[55vh] overflow-y-auto pb-2">
              {!q && recents.length > 0 && (
                <>
                  <p className="text-caption text-[var(--color-text-tertiary)] px-1">Recently added</p>
                  {recents.map((f, i) => (
                    <CatalogEditorialCard
                      key={`${f.brand}::${f.name}`}
                      group={{
                        key: `${f.brand}::${f.name}`,
                        brand: f.brand,
                        name: f.name,
                        variants: [f],
                      }}
                      isOpen={activeGroup?.key === `${f.brand}::${f.name}`}
                      picked={picked}
                      pickingImage={pickingImage}
                      onOpen={() => openGroup({
                        key: `${f.brand}::${f.name}`,
                        brand: f.brand,
                        name: f.name,
                        variants: [f],
                      })}
                      onPickVariant={pickVariant}
                      index={i}
                    />
                  ))}
                </>
              )}
              {!q && !recents.length && (
                <div className="catalog-empty-state text-center py-10 px-4">
                  <p className="text-caption text-[var(--color-accent)] mb-2">Live catalog</p>
                  <p className={`text-subhead ${textSubtle}`}>
                    Search thousands of fragrances — real bottle photos, concentrations, and notes.
                  </p>
                </div>
              )}
              {q && searchingOnline && (
                <p className={`text-sm ${textSubtle} text-center py-6`}>Searching catalog…</p>
              )}
              {q && !groups.length && !searchingOnline && !didYouMean && (
                <p className="text-sm text-[var(--sc-text-muted)] text-center py-6">
                  No matches — check spelling or add manually
                </p>
              )}
              {groups.map((g, i) => (
                <CatalogEditorialCard
                  key={g.key}
                  group={g}
                  isOpen={activeGroup?.key === g.key}
                  picked={picked}
                  pickingImage={pickingImage}
                  onOpen={() => openGroup(g)}
                  onPickVariant={pickVariant}
                  index={i}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <Card className="space-y-4">
          <p className="text-sm text-[var(--sc-text-soft)]">Can&apos;t find it? Enter brand and name — we&apos;ll save it locally.</p>
          <div className="space-y-1">
            <label htmlFor="manual-name" className="text-xs text-[var(--sc-text-muted)]">Fragrance name</label>
            <input
              id="manual-name"
              className={`${inputClass} capitalize`}
              placeholder="e.g. Aventus"
              autoComplete="off"
              required
              aria-invalid={!manual.name}
              value={manual.name}
              onChange={(e) => setManual({ ...manual, name: e.target.value })}
              onFocus={(e) => scrollInputIntoView(e.currentTarget)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="manual-brand" className="text-xs text-[var(--sc-text-muted)]">Brand</label>
            <input
              id="manual-brand"
              className={`${inputClass} capitalize`}
              placeholder="e.g. Creed"
              autoComplete="organization"
              required
              aria-invalid={!manual.brand}
              value={manual.brand}
              onChange={(e) => setManual({ ...manual, brand: e.target.value })}
              onFocus={(e) => scrollInputIntoView(e.currentTarget)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="manual-concentration" className="text-xs text-[var(--sc-text-muted)]">Concentration</label>
            <select
              id="manual-concentration"
              className={inputClass}
              value={manual.concentration}
              onChange={(e) => setManual({ ...manual, concentration: e.target.value as Concentration })}
            >
              {CONCENTRATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {(!manual.name || !manual.brand) && (
            <p className="text-xs text-[var(--sc-danger)]" role="alert">Enter both name and brand to save.</p>
          )}
          <Button
            className="w-full"
            onClick={addManual}
            disabled={!manual.name || !manual.brand || (!listTarget && !canAdd) || saving}
            haptic="success"
          >
            {listTarget === 'want' ? 'Save to Want list' : listTarget === 'tested' ? 'Save to Tested' : 'Save to wardrobe'}
          </Button>
        </Card>
      )}
    </div>
  );
}
