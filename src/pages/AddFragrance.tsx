import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, ChevronRight, PenLine, Search, X } from 'lucide-react';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
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
import { ensureFragranceCatalogEntry, searchCatalogLocal, searchCatalogWithImages, type FragranceGroup } from '@/services/catalogSearch';
import { concentrationLabel, parseBaseName } from '@/services/onlineCatalog';
import { isBundledBottle, popularLocal } from '@/catalog/local';
import { BottleCard, PageHeader, Sheet } from '@/components/kit';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { useApp } from '@/context/AppContext';
import type { BottleType, Concentration, Fragrance, GenderLean, Longevity, Projection, WishlistList } from '@/types';
import { CONCENTRATIONS } from '@/types';
import { estimateWearsRemaining, uid } from '@/lib/utils';
import { MIDDLE_EAST_BRANDS, POPULAR_BRANDS } from '@/catalog/brands';

const BOTTLE_TYPES: { id: BottleType; label: string }[] = [
  { id: 'full', label: 'Full bottle' },
  { id: 'decant', label: 'Decant' },
  { id: 'travel', label: 'Travel' },
  { id: 'sample', label: 'Sample' },
];

const FAMILIES = ['Fresh', 'Floral', 'Woody', 'Oriental', 'Gourmand'];

function groupOf(f: Fragrance): FragranceGroup {
  return { key: `${f.brand}::${parseBaseName(f.name)}`, brand: f.brand, name: parseBaseName(f.name), variants: [f] };
}

export function AddFragrance() {
  const { collection, refresh } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listTarget = (searchParams.get('list') as WishlistList | null) ?? null;

  const [q, setQ] = useState('');
  const [groups, setGroups] = useState<FragranceGroup[]>([]);
  const [popular, setPopular] = useState<Fragrance[]>([]);
  const [searching, setSearching] = useState(false);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeq = useRef(0);

  // Confirm sheet
  const [activeGroup, setActiveGroup] = useState<FragranceGroup | null>(null);
  const [picked, setPicked] = useState<Fragrance | null>(null);
  const [bottleType, setBottleType] = useState<BottleType>('full');
  const [parentCollectionId, setParentCollectionId] = useState('');
  const [parentOptions, setParentOptions] = useState<{ id: string; label: string }[]>([]);
  const [meta, setMeta] = useState({ sizeMl: '100', price: '', opened: '', purchase: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Manual sheet
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({
    name: '',
    brand: '',
    concentration: 'EDP' as Concentration,
    family: 'Fresh',
    projection: 'moderate' as Projection,
    longevity: 'medium' as Longevity,
    gender_lean: 'unisex' as GenderLean,
  });

  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    void popularLocal(18).then(setPopular);
  }, []);

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

  const runSearch = async (query: string) => {
    const seq = ++searchSeq.current;
    if (!query.trim()) {
      setGroups([]);
      setDidYouMean(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const local = await searchCatalogLocal(query, 30);
      if (seq !== searchSeq.current) return;
      if (local.groups.length) setGroups(local.groups);
      const result = await searchCatalogWithImages(query, 30);
      if (seq !== searchSeq.current) return;
      setGroups(result.groups);
      setDidYouMean(result.didYouMean);
    } finally {
      if (seq === searchSeq.current) setSearching(false);
    }
  };

  const search = (query: string, immediate = false) => {
    setQ(query);
    // Show the loading state through the debounce window so "No matches" never flashes mid-typing.
    setSearching(Boolean(query.trim()));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (immediate) void runSearch(query);
    else searchTimer.current = setTimeout(() => void runSearch(query), 220);
  };

  const openGroup = async (g: FragranceGroup) => {
    hapticSelection();
    setActiveGroup(g);
    setBottleType('full');
    setParentCollectionId('');
    setPhotoFile(null);
    setMeta({ sizeMl: '100', price: '', opened: '', purchase: '' });
    await choose(g.variants[0]);
  };

  const choose = async (f: Fragrance) => {
    setPicked(f);
    await putFragrance(f);
    if (isBundledBottle(f.image)) return; // offline catalog entry is already complete
    const enriched = await ensureFragranceCatalogEntry(f);
    setPicked((cur) => (cur?.id === f.id ? enriched : cur));
  };

  const closeSheet = () => {
    setActiveGroup(null);
    setPicked(null);
  };

  const needsParent = bottleType === 'decant' || bottleType === 'travel';
  const canAdd = !needsParent || Boolean(parentCollectionId);

  const confirmAdd = async (f: Fragrance) => {
    if (needsParent && !parentCollectionId) return;
    setSaving(true);
    try {
      await enrichFragranceOnce(f);
      const colId = uid();
      let photoBlobId: string | undefined;
      if (photoFile) {
        photoBlobId = `photo-${colId}`;
        await savePhoto(photoBlobId, photoFile);
      }
      const defaultSize = bottleType === 'decant' ? '10' : bottleType === 'travel' ? '30' : bottleType === 'sample' ? '2' : meta.sizeMl;
      await addToCollection({
        id: colId,
        fragranceId: f.id,
        bottleLevel: 'full',
        bottleType,
        parentCollectionId: bottleType === 'full' || bottleType === 'sample' ? undefined : parentCollectionId,
        bottleSizeMl: Number(defaultSize) || 100,
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
      navigate(`/fragrance/${colId}?added=1`);
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
        await addToWishlist({ id: uid(), fragranceId: f.id, list, addedAt: new Date().toISOString() });
      }
      await refresh();
      hapticSuccess();
      navigate(`/collection?tab=${list}`);
    } finally {
      setSaving(false);
    }
  };

  const addManual = async () => {
    const id = `${manual.brand}-${manual.name}-${manual.concentration}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const f: Fragrance = {
      id,
      name: manual.name.trim(),
      brand: manual.brand.trim(),
      concentration: manual.concentration,
      family: manual.family,
      subfamily: manual.family,
      projection: manual.projection,
      longevity: manual.longevity,
      seasonality: ['spring', 'summer', 'fall', 'winter'],
      day_night: 'versatile',
      gender_lean: manual.gender_lean,
      top_notes: [],
      heart_notes: [],
      base_notes: [],
      office_score: 60,
      heat_score: 65,
      cold_score: 65,
      date_score: 70,
      formal_score: 60,
      casual_score: 75,
      layering_tags: ['fresh'],
    };
    await putFragrance(f);
    const enriched = await enrichFragranceOnce(f);
    setManualOpen(false);
    if (listTarget) {
      await addToList(enriched, listTarget);
      return;
    }
    await confirmAdd(enriched);
  };

  const listName = listTarget === 'want' ? 'Wishlist' : listTarget === 'tested' ? 'Tested' : null;
  const variants = activeGroup?.variants ?? [];

  return (
    <div className="ui-page" style={{ paddingBottom: keyboardInset > 0 ? keyboardInset + 24 : undefined }}>
      <PageHeader eyebrow={listName ? `Adding to ${listName}` : undefined} title="Add fragrance" />

      <label className="ui-search !min-h-[48px] sticky top-[max(8px,env(safe-area-inset-top))] z-20 shadow-[var(--shadow-2)] !bg-[var(--surface)]">
        <Search size={18} aria-hidden />
        <span className="sr-only">Search by brand or name</span>
        <input
          id="catalog-search"
          type="search"
          role="searchbox"
          enterKeyHint="search"
          placeholder="Brand or fragrance name"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={q}
          onChange={(e) => search(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search(q, true)}
        />
        {q && (
          <button type="button" className="p-1 text-[var(--label-3)]" onClick={() => search('', true)} aria-label="Clear search">
            <X size={17} aria-hidden />
          </button>
        )}
      </label>

      {!q.trim() ? (
        <>
          <div className="mt-5" data-testid="brand-browse">
            <p className="ui-list-header !px-0">Popular houses</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {[...POPULAR_BRANDS.slice(0, 6), ...MIDDLE_EAST_BRANDS.slice(0, 4)].map((b) => (
                <button key={b} type="button" className="ui-chip" onClick={() => search(b, true)}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          {popular.length > 0 && (
            <section className="ui-section !mt-7">
              <div className="ui-section-head">
                <h2 className="ui-section-title">Popular right now</h2>
              </div>
              <div className="ui-grid">
                {popular.map((f) => (
                  <BottleCard key={f.id} fragrance={f} meta={concentrationLabel(f.concentration)} onClick={() => void openGroup(groupOf(f))} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="mt-5" aria-live="polite">
          {didYouMean && (
            <button type="button" className="ui-row ui-list mb-4" onClick={() => search(didYouMean, true)}>
              <span className="ui-row__main">
                <span className="ui-row__sub block">Did you mean</span>
                <span className="ui-row__title block text-[var(--tint)]">{didYouMean}</span>
              </span>
              <ChevronRight size={18} className="ui-chevron" aria-hidden />
            </button>
          )}
          {searching && !groups.length ? (
            <div className="ui-grid" aria-label="Searching">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="ui-skeleton aspect-square" />
                  <div className="ui-skeleton h-3 w-1/2" />
                  <div className="ui-skeleton h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : groups.length ? (
            <div className="ui-grid">
              {groups.map((g) => (
                <BottleCard
                  key={g.key}
                  fragrance={g.variants[0]}
                  meta={
                    g.variants.length > 1
                      ? `${g.variants.length} concentrations`
                      : concentrationLabel(g.variants[0].concentration)
                  }
                  onClick={() => void openGroup(g)}
                />
              ))}
            </div>
          ) : !searching ? (
            <p className="ui-secondary text-center py-12">No matches for “{q}”.</p>
          ) : null}
        </div>
      )}

      <div className="ui-list mt-8">
        <button type="button" className="ui-row" onClick={() => setManualOpen(true)}>
          <span className="w-8 h-8 rounded-[9px] grid place-items-center bg-[var(--fill)] shrink-0">
            <PenLine size={16} aria-hidden />
          </span>
          <span className="ui-row__main">
            <span className="ui-row__title block">Can’t find it? Add manually</span>
            <span className="ui-row__sub block">Brand, name and concentration</span>
          </span>
          <ChevronRight size={18} className="ui-chevron" aria-hidden />
        </button>
      </div>
      <p className="ui-footnote mt-3 px-1">Bottle images © their respective brands, via Parfumo.</p>

      {/* Confirm sheet */}
      <Sheet open={Boolean(activeGroup)} title={listName ? `Add to ${listName}` : 'Add to collection'} onClose={closeSheet}>
        {picked && (
          <div className="space-y-5 pb-2">
            <div className="flex gap-4 items-center">
              <div className="w-28 shrink-0">
                <FragranceThumb fragrance={picked} variant="plinth" size="lg" />
              </div>
              <div className="min-w-0">
                <p className="ui-bottle__brand">{picked.brand}</p>
                <p className="serif text-[var(--t-title2)] leading-tight mt-0.5">{parseBaseName(picked.name)}</p>
                <p className="ui-footnote mt-1">{picked.family}{picked.top_notes[0] ? ` · ${picked.top_notes.slice(0, 2).join(', ')}` : ''}</p>
              </div>
            </div>

            {variants.length > 1 && (
              <div>
                <p className="ui-list-header !px-0">Concentration</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="ui-chip"
                      aria-pressed={picked.id === v.id}
                      onClick={() => {
                        hapticSelection();
                        void choose(v);
                      }}
                    >
                      {concentrationLabel(v.concentration)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!listTarget && (
              <>
                <div>
                  <p className="ui-list-header !px-0">Bottle</p>
                  <div className="ui-segmented">
                    {BOTTLE_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={bottleType === t.id}
                        onClick={() => {
                          setBottleType(t.id);
                          if (t.id === 'full' || t.id === 'sample') setParentCollectionId('');
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {needsParent && (
                    <div className="ui-list mt-3">
                      <label className="ui-row" htmlFor="parent-bottle">
                        <span className="ui-row__main">From bottle</span>
                        <select
                          id="parent-bottle"
                          className="ui-field max-w-[60%]"
                          value={parentCollectionId}
                          onChange={(e) => setParentCollectionId(e.target.value)}
                          aria-invalid={!parentCollectionId}
                        >
                          <option value="">{parentOptions.length ? 'Choose…' : 'No full bottles yet'}</option>
                          {parentOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>

                <details className="group">
                  <summary className="ui-list ui-row cursor-pointer list-none">
                    <span className="ui-row__main">Details <span className="ui-footnote">— optional</span></span>
                    <ChevronRight size={18} className="ui-chevron transition-transform group-open:rotate-90" aria-hidden />
                  </summary>
                  <div className="ui-list mt-2">
                    {bottleType === 'full' && (
                      <label className="ui-row" htmlFor="meta-size">
                        <span className="ui-row__main">Size (ml)</span>
                        <input id="meta-size" className="ui-field max-w-[40%]" type="number" inputMode="decimal" value={meta.sizeMl} onChange={(e) => setMeta({ ...meta, sizeMl: e.target.value })} />
                      </label>
                    )}
                    <label className="ui-row" htmlFor="meta-price">
                      <span className="ui-row__main">Price paid</span>
                      <input id="meta-price" className="ui-field max-w-[40%]" type="number" inputMode="decimal" placeholder="—" value={meta.price} onChange={(e) => setMeta({ ...meta, price: e.target.value })} />
                    </label>
                    <label className="ui-row" htmlFor="meta-purchase">
                      <span className="ui-row__main">Purchased</span>
                      <input id="meta-purchase" className="ui-field max-w-[50%]" type="date" value={meta.purchase} onChange={(e) => setMeta({ ...meta, purchase: e.target.value })} />
                    </label>
                    <label className="ui-row" htmlFor="meta-opened">
                      <span className="ui-row__main">Opened</span>
                      <input id="meta-opened" className="ui-field max-w-[50%]" type="date" value={meta.opened} onChange={(e) => setMeta({ ...meta, opened: e.target.value })} />
                    </label>
                    <label className="ui-row cursor-pointer">
                      <Camera size={18} className="text-[var(--tint)]" aria-hidden />
                      <span className="ui-row__main">Your own photo</span>
                      <span className="ui-row__value truncate max-w-[45%]">{photoFile ? photoFile.name : 'Choose'}</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  <p className="ui-list-footer">Photos stay on this device.</p>
                </details>
              </>
            )}

            <div className="space-y-2 pt-1">
              {listTarget ? (
                <button type="button" className="ui-btn ui-btn--primary ui-btn--block" disabled={saving} onClick={() => void addToList(picked, listTarget)}>
                  Add to {listName}
                </button>
              ) : (
                <>
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--block" disabled={!canAdd || saving} onClick={() => void confirmAdd(picked)}>
                    {saving ? 'Adding…' : 'Add to collection'}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="ui-btn ui-btn--gray" disabled={saving} onClick={() => void addToList(picked, 'want')}>
                      Wishlist
                    </button>
                    <button type="button" className="ui-btn ui-btn--gray" disabled={saving} onClick={() => void addToList(picked, 'tested')}>
                      Tested
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* Manual sheet */}
      <Sheet
        open={manualOpen}
        title="Add manually"
        onClose={() => setManualOpen(false)}
        labelledBy="manual-title"
        done={{
          label: 'Save',
          onClick: () => void addManual(),
          disabled: !manual.name.trim() || !manual.brand.trim() || saving,
        }}
      >
        <div className="ui-list">
          <label className="ui-row" htmlFor="manual-brand">
            <span className="w-28 shrink-0">Brand</span>
            <input id="manual-brand" className="ui-field ui-field--left" placeholder="e.g. Creed" autoComplete="off" value={manual.brand} onChange={(e) => setManual({ ...manual, brand: e.target.value })} />
          </label>
          <label className="ui-row" htmlFor="manual-name">
            <span className="w-28 shrink-0">Name</span>
            <input id="manual-name" className="ui-field ui-field--left" placeholder="e.g. Aventus" autoComplete="off" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
          </label>
          <label className="ui-row" htmlFor="manual-concentration">
            <span className="ui-row__main">Concentration</span>
            <select id="manual-concentration" className="ui-field max-w-[50%]" value={manual.concentration} onChange={(e) => setManual({ ...manual, concentration: e.target.value as Concentration })}>
              {CONCENTRATIONS.map((c) => (
                <option key={c} value={c}>
                  {concentrationLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="ui-row" htmlFor="manual-family">
            <span className="ui-row__main">Family</span>
            <select id="manual-family" className="ui-field max-w-[50%]" value={manual.family} onChange={(e) => setManual({ ...manual, family: e.target.value })}>
              {FAMILIES.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="ui-list-footer">Saved on this device. You can add a photo from the bottle page.</p>
      </Sheet>
    </div>
  );
}
