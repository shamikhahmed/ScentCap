import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, Layers, Share, Star, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/kit';
import { hapticSuccess } from '@/lib/premium/haptics';
import { WearRatingModal } from '@/components/ui/WearRatingModal';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import {
  deleteCollectionItem,
  getAllCollection,
  getCollectionByParent,
  getFragrance,
  getPhoto,
  logWear,
  savePhoto,
  updateCollectionItem,
  updateWearRecord,
} from '@/db';
import type { CollectionItem, Fragrance, SignatureRole, WearRecord } from '@/types';
import { getPreferences, savePreferences } from '@/db';
import { useApp } from '@/context/AppContext';
import { FAMILY_COLORS } from '@/lib/stats';
import { estimateWearsRemaining, formatCurrency, uid } from '@/lib/utils';
import { downloadBlob, exportShareCardPng, fragranceToShareInput, shareWearCard } from '@/lib/shareCard';
import { FragranceWearGuide } from '@/components/fragrance/FragranceWearGuide';
import { format } from 'date-fns';
import { concentrationLabel, fragranceDisplayName } from '@/services/onlineCatalog';

const LEVELS = ['full', '75', '50', '25', '10', 'empty'] as const;
const SIG_ROLES: { role: SignatureRole; label: string }[] = [
  { role: 'work', label: 'Work signature' },
  { role: 'date', label: 'Date signature' },
  { role: 'summer', label: 'Summer signature' },
  { role: 'winter', label: 'Winter signature' },
  { role: 'weekend', label: 'Weekend signature' },
];

export function FragranceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justAdded = searchParams.get('added') === '1';
  const { history, refresh, profile, prefs, collection } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [item, setItem] = useState<CollectionItem | null>(null);
  const [fragrance, setFragrance] = useState<Fragrance | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sigRole, setSigRole] = useState<SignatureRole | undefined>();
  const [parentItem, setParentItem] = useState<CollectionItem | null>(null);
  const [parentFragrance, setParentFragrance] = useState<Fragrance | null>(null);
  const [childDecants, setChildDecants] = useState<{ item: CollectionItem; f?: Fragrance }[]>([]);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editMeta, setEditMeta] = useState({ sizeMl: '', price: '', opened: '', purchase: '' });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCascade, setDeleteCascade] = useState(false);
  const [wardrobeFragrances, setWardrobeFragrances] = useState<Fragrance[]>([]);
  const [editWear, setEditWear] = useState<WearRecord | null>(null);

  useEffect(() => {
    Promise.all(collection.map(async (c) => getFragrance(c.fragranceId)))
      .then((rows) => setWardrobeFragrances(rows.filter(Boolean) as Fragrance[]));
  }, [collection]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const load = async () => {
      const col = await getAllCollection();
      const c = col.find((x) => x.id === id);
      if (!c || cancelled) return;
      setItem(c);
      setSigRole(c.signatureRole);
      setEditMeta({
        sizeMl: c.bottleSizeMl != null ? String(c.bottleSizeMl) : '',
        price: c.purchasePrice != null ? String(c.purchasePrice) : '',
        opened: c.openedDate ?? '',
        purchase: c.purchaseDate ?? '',
      });
      const f = await getFragrance(c.fragranceId);
      if (cancelled) return;
      setFragrance(f ?? null);
      if (c.photoBlobId) {
        const blob = await getPhoto(c.photoBlobId);
        if (cancelled) return;
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setPhotoUrl(objectUrl);
        } else {
          setPhotoUrl(null);
        }
      } else {
        setPhotoUrl(null);
      }
      if (c.parentCollectionId) {
        const parent = col.find((x) => x.id === c.parentCollectionId);
        if (parent) {
          setParentItem(parent);
          setParentFragrance((await getFragrance(parent.fragranceId)) ?? null);
        }
      } else {
        setParentItem(null);
        setParentFragrance(null);
      }
      if (cancelled) return;
      const children = await getCollectionByParent(c.id);
      const childRows = await Promise.all(
        children.map(async (child) => ({ item: child, f: await getFragrance(child.fragranceId) })),
      );
      if (!cancelled) setChildDecants(childRows);
    };

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  const save = async (next: CollectionItem) => {
    await updateCollectionItem(next);
    setItem(next);
  };

  const updateLevel = async (level: typeof LEVELS[number]) => {
    if (!item || !fragrance) return;
    await save({
      ...item,
      bottleLevel: level,
      estimatedWearsRemaining: estimateWearsRemaining(level, fragrance.concentration),
    });
  };

  const toggleFavorite = async () => {
    if (!item) return;
    await save({ ...item, isFavorite: !item.isFavorite });
  };

  const setSignature = async (role: SignatureRole) => {
    if (!item || !fragrance) return;
    const prefs = await getPreferences();
    const nextRole = sigRole === role ? undefined : role;
    await save({
      ...item,
      isSignature: Boolean(nextRole),
      signatureRole: nextRole,
    });
    setSigRole(nextRole);
    if (nextRole) {
      await savePreferences({ ...prefs, signatures: { ...prefs.signatures, [nextRole]: fragrance.id } });
    }
  };

  const onPhoto = async (file: File) => {
    if (!item) return;
    const photoId = `photo-${item.id}`;
    await savePhoto(photoId, file);
    await save({ ...item, photoBlobId: photoId });
    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const saveEdits = async () => {
    if (!item || !fragrance) return;
    await save({
      ...item,
      bottleSizeMl: editMeta.sizeMl ? Number(editMeta.sizeMl) : undefined,
      purchasePrice: editMeta.price ? Number(editMeta.price) : undefined,
      purchaseDate: editMeta.purchase || undefined,
      openedDate: editMeta.opened || undefined,
    });
    setEditing(false);
  };

  const confirmDelete = async () => {
    if (!item) return;
    try {
      await deleteCollectionItem(item.id, { cascadeChildren: deleteCascade || childDecants.length === 0 });
      await refresh();
      navigate('/collection');
    } catch (e) {
      if (e instanceof Error && e.message === 'HAS_CHILDREN') {
        setDeleteCascade(true);
      }
    }
  };

  useEffect(() => {
    if (fragrance) document.title = `${fragrance.brand} ${fragranceDisplayName(fragrance.name)} — ScentCap`;
  }, [fragrance]);

  const wearHistory = item
    ? history.filter((h) => h.collectionId === item.id).sort((a, b) => b.wornAt.localeCompare(a.wornAt))
    : [];

  const saveWearEdit = async (rating: number, compliment: boolean, notes?: string) => {
    if (!editWear || !item) return;
    await updateWearRecord({ ...editWear, rating, compliment, notes });
    await refresh();
    setEditWear(null);
  };

  if (!item || !fragrance) {
    return (
      <div className="ui-page" aria-busy="true">
        <div className="ui-skeleton aspect-square max-w-sm mx-auto mt-6" />
      </div>
    );
  }

  const aura = FAMILY_COLORS[fragrance.family] ?? 'var(--tint)';
  const displayName = fragranceDisplayName(fragrance.name);
  const wornToday = wearHistory.some((w) => new Date(w.wornAt).toDateString() === new Date().toDateString());

  const shareBottle = async () => {
    try {
      const outcome = await shareWearCard(fragranceToShareInput(fragrance), aura);
      setShareMsg(outcome === 'shared' ? 'Shared' : outcome === 'copied' ? 'Copied to clipboard' : 'Saved as image');
    } catch {
      const blob = await exportShareCardPng(fragranceToShareInput(fragrance), aura);
      downloadBlob(blob, `scentcap-${fragrance.brand}-${fragrance.name}.png`.replace(/\s+/g, '-').toLowerCase());
      setShareMsg('Saved as image');
    }
    setTimeout(() => setShareMsg(null), 2500);
  };

  const wearNow = async () => {
    const wear: WearRecord = {
      id: uid(),
      collectionId: item.id,
      fragranceId: fragrance.id,
      wornAt: new Date().toISOString(),
    };
    await logWear(wear);
    await refresh();
    hapticSuccess();
    setEditWear(wear);
  };

  const suitability = [
    { label: 'Office', v: fragrance.office_score },
    { label: 'Date night', v: fragrance.date_score },
    { label: 'Casual', v: fragrance.casual_score },
    { label: 'Formal', v: fragrance.formal_score },
    { label: 'Hot weather', v: fragrance.heat_score },
    { label: 'Cold weather', v: fragrance.cold_score },
  ];
  const pyramid = [
    { label: 'Top', notes: fragrance.top_notes },
    { label: 'Heart', notes: fragrance.heart_notes },
    { label: 'Base', notes: fragrance.base_notes },
  ].filter((r) => r.notes.length);

  return (
    <div className="ui-page">
      <div className="flex items-center justify-between -mx-2 mb-2">
        <Link to="/collection" className="ui-btn ui-btn--plain !font-normal !px-2">
          <ChevronLeft size={22} aria-hidden /> Collection
        </Link>
        <div className="flex gap-2">
          <button type="button" className="ui-icon-btn" onClick={toggleFavorite} aria-pressed={item.isFavorite} aria-label={item.isFavorite ? 'Remove from favourites' : 'Add to favourites'}>
            <Star size={19} fill={item.isFavorite ? 'currentColor' : 'none'} className={item.isFavorite ? 'text-[var(--tint)]' : ''} aria-hidden />
          </button>
          <button type="button" className="ui-icon-btn" onClick={shareBottle} aria-label="Share">
            <Share size={19} aria-hidden />
          </button>
        </div>
      </div>

      {justAdded && (
        <p className="ui-card !py-3 mb-4 text-[var(--t-subhead)] flex items-center gap-2 ui-rise" role="status">
          <CheckCircle2 size={18} className="text-[var(--success)]" aria-hidden /> Added to your collection
        </p>
      )}
      {shareMsg && <p className="ui-footnote text-center mb-3" role="status">{shareMsg}</p>}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
        <div className="relative lg:sticky lg:top-6">
          <FragranceThumb fragrance={fragrance} photoUrl={photoUrl} variant="plinth" size="hero" className="!rounded-[var(--r-xl)] max-w-[440px] mx-auto" />
          <button
            type="button"
            className="ui-icon-btn absolute bottom-3 right-3 !bg-[var(--surface)] shadow-[var(--shadow-2)]"
            onClick={() => fileRef.current?.click()}
            aria-label={photoUrl ? 'Replace your photo' : 'Add your own photo'}
          >
            <Camera size={18} aria-hidden />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPhoto(f);
            }}
          />
        </div>

        <div className="min-w-0">
          <p className="ui-eyebrow">{fragrance.brand}</p>
          <h1 className="serif text-[clamp(2rem,7vw,2.75rem)] leading-[1.05] font-medium mt-1">{displayName}</h1>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="ui-tag">{concentrationLabel(fragrance.concentration)}</span>
            <span className="ui-tag">{fragrance.family}</span>
            {fragrance.subfamily && fragrance.subfamily !== fragrance.family && <span className="ui-tag">{fragrance.subfamily}</span>}
            {item.bottleType && item.bottleType !== 'full' && <span className="ui-tag ui-tag--tint capitalize">{item.bottleType}</span>}
            {sigRole && <span className="ui-tag ui-tag--tint">{SIG_ROLES.find((r) => r.role === sigRole)?.label}</span>}
          </div>

          <div className="flex gap-2.5 mt-5">
            <button type="button" className="ui-btn ui-btn--primary flex-1" onClick={() => void wearNow()} disabled={wornToday}>
              {wornToday ? (<><Check size={19} aria-hidden /> Worn today</>) : 'Wear today'}
            </button>
            <Link to="/layering" state={{ primaryId: fragrance.id }} className="ui-btn ui-btn--secondary">
              <Layers size={18} aria-hidden /> Layer
            </Link>
          </div>

          <div className="ui-widgets !grid-cols-3 mt-5">
            <div className="ui-widget !min-h-0">
              <span className="ui-widget__label">Worn</span>
              <span className="ui-widget__value !text-[var(--t-title2)]">{wearHistory.length}<span className="ui-widget__unit">×</span></span>
            </div>
            <div className="ui-widget !min-h-0">
              <span className="ui-widget__label">Left</span>
              <span className="ui-widget__value !text-[var(--t-title2)]">{item.estimatedWearsRemaining != null ? `~${item.estimatedWearsRemaining}` : '—'}</span>
            </div>
            <div className="ui-widget !min-h-0">
              <span className="ui-widget__label">Last</span>
              <span className="ui-widget__value !text-[var(--t-title2)]">{wearHistory[0] ? format(new Date(wearHistory[0].wornAt), 'd MMM') : '—'}</span>
            </div>
          </div>

          {pyramid.length > 0 && (
            <section className="ui-section !mt-7">
              <h2 className="ui-section-title mb-3">Notes</h2>
              <div className="ui-list">
                {pyramid.map((r) => (
                  <div key={r.label} className="ui-row !items-start">
                    <span className="w-14 shrink-0 text-[var(--t-subhead)] font-semibold text-[var(--tint)] pt-0.5">{r.label}</span>
                    <span className="flex-1 text-[var(--t-subhead)] text-[var(--label-2)]">{r.notes.join(', ')}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="ui-section !mt-7">
            <h2 className="ui-section-title mb-3">Best for</h2>
            <div className="ui-card space-y-3">
              {suitability.map(({ label, v }) => (
                <div key={label} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3">
                  <span className="text-[var(--t-subhead)]">{label}</span>
                  <span className="ui-meter" aria-hidden><span style={{ width: `${v}%` }} /></span>
                  <span className="text-[var(--t-footnote)] text-[var(--label-3)] tabular-nums text-right">{v}</span>
                </div>
              ))}
              <p className="ui-footnote pt-1">
                {fragrance.projection[0].toUpperCase() + fragrance.projection.slice(1)} projection · {fragrance.longevity} longevity
              </p>
            </div>
          </section>
        </div>
      </div>

      {profile && (
        <section className="ui-section">
          <FragranceWearGuide fragrance={fragrance} wardrobe={wardrobeFragrances} profile={profile} prefs={prefs} />
        </section>
      )}

      <section className="ui-section">
        <h2 className="ui-section-title mb-3">Bottle level</h2>
        <div className="ui-segmented">
          {LEVELS.map((l) => (
            <button key={l} type="button" aria-pressed={item.bottleLevel === l} onClick={() => void updateLevel(l)}>
              {l === 'full' ? 'Full' : l === 'empty' ? 'Empty' : `${l}%`}
            </button>
          ))}
        </div>
      </section>

      <section className="ui-section">
        <h2 className="ui-section-title mb-3">Signature for</h2>
        <div className="flex flex-wrap gap-2">
          {SIG_ROLES.map(({ role, label }) => (
            <button key={role} type="button" className="ui-chip" aria-pressed={sigRole === role} onClick={() => void setSignature(role)}>
              {label.replace(' signature', '')}
            </button>
          ))}
        </div>
      </section>

      {(parentItem && parentFragrance) || childDecants.length > 0 ? (
        <section className="ui-section">
          <p className="ui-list-header">Linked bottles</p>
          <div className="ui-list">
            {parentItem && parentFragrance && (
              <Link to={`/fragrance/${parentItem.id}`} className="ui-row">
                <span className="ui-row__main">
                  <span className="ui-row__sub block">From bottle</span>
                  <span className="ui-row__title block">{parentFragrance.brand} {fragranceDisplayName(parentFragrance.name)}</span>
                </span>
                <ChevronRight size={18} className="ui-chevron" aria-hidden />
              </Link>
            )}
            {childDecants.map(({ item: child, f }) => (
              <Link key={child.id} to={`/fragrance/${child.id}`} className="ui-row">
                <span className="ui-row__main ui-row__title">{child.bottleType === 'travel' ? 'Travel bottle' : 'Decant'}{f ? ` · ${fragranceDisplayName(f.name)}` : ''}</span>
                <span className="ui-row__value">{child.bottleSizeMl ?? '—'} ml</span>
                <ChevronRight size={18} className="ui-chevron" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="ui-section">
        <div className="flex items-center justify-between">
          <p className="ui-list-header">Purchase</p>
          <button type="button" className="ui-btn ui-btn--plain !min-h-[36px] !text-[var(--t-subhead)] mb-1" onClick={() => (editing ? void saveEdits() : setEditing(true))}>
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
        <div className="ui-list">
          {[
            { key: 'sizeMl', label: 'Size (ml)', type: 'number', show: item.bottleSizeMl != null ? `${item.bottleSizeMl} ml` : '—' },
            { key: 'price', label: 'Price paid', type: 'number', show: item.purchasePrice != null ? formatCurrency(item.purchasePrice) : '—' },
            { key: 'purchase', label: 'Purchased', type: 'date', show: item.purchaseDate ? format(new Date(item.purchaseDate), 'd MMM yyyy') : '—' },
            { key: 'opened', label: 'Opened', type: 'date', show: item.openedDate ? format(new Date(item.openedDate), 'd MMM yyyy') : '—' },
          ].map((row) => (
            <label key={row.key} className="ui-row" htmlFor={`edit-${row.key}`}>
              <span className="ui-row__main">{row.label}</span>
              {editing ? (
                <input
                  id={`edit-${row.key}`}
                  type={row.type}
                  inputMode={row.type === 'number' ? 'decimal' : undefined}
                  className="ui-field max-w-[50%] !text-[var(--tint)]"
                  value={editMeta[row.key as keyof typeof editMeta]}
                  onChange={(e) => setEditMeta({ ...editMeta, [row.key]: e.target.value })}
                />
              ) : (
                <span className="ui-row__value">{row.show}</span>
              )}
            </label>
          ))}
        </div>
      </section>

      {wearHistory.length > 0 && (
        <section className="ui-section">
          <p className="ui-list-header">Wear history</p>
          <div className="ui-list">
            {wearHistory.slice(0, 10).map((w) => (
              <button key={w.id} type="button" className="ui-row" onClick={() => setEditWear(w)}>
                <span className="ui-row__main">
                  <span className="ui-row__title block">{format(new Date(w.wornAt), 'EEEE, d MMM yyyy')}</span>
                  {(w.rating || w.compliment || w.notes) && (
                    <span className="ui-row__sub block">
                      {[w.rating ? `${'★'.repeat(w.rating)}` : null, w.compliment ? 'Got a compliment' : null, w.notes].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </span>
                <ChevronRight size={18} className="ui-chevron" aria-hidden />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="ui-section">
        <div className="ui-list">
          <button type="button" className="ui-row justify-center !text-[var(--danger)]" onClick={() => { setDeleteCascade(false); setDeleteOpen(true); }}>
            <Trash2 size={18} aria-hidden /> Remove from collection
          </button>
        </div>
      </section>

      <Sheet open={deleteOpen} title="Remove bottle" onClose={() => setDeleteOpen(false)} labelledBy="delete-title">
        <p className="text-[var(--t-subhead)] text-[var(--label-2)] text-center px-2">
          {deleteCascade && childDecants.length > 0
            ? `This also removes ${childDecants.length} linked decant or travel bottle${childDecants.length !== 1 ? 's' : ''}. This can’t be undone.`
            : childDecants.length > 0
              ? `This bottle has ${childDecants.length} linked decant or travel bottle${childDecants.length !== 1 ? 's' : ''}.`
              : `${fragrance.brand} ${displayName} and its wear history link will be removed. This can’t be undone.`}
        </p>
        <div className="space-y-2 mt-5">
          {childDecants.length > 0 && !deleteCascade ? (
            <button type="button" className="ui-btn ui-btn--block !bg-[var(--danger)] !text-white" onClick={() => setDeleteCascade(true)}>
              Remove all linked bottles
            </button>
          ) : (
            <button type="button" className="ui-btn ui-btn--block !bg-[var(--danger)] !text-white" onClick={() => void confirmDelete()}>
              Remove
            </button>
          )}
          <button type="button" className="ui-btn ui-btn--gray ui-btn--block" onClick={() => setDeleteOpen(false)}>
            Keep
          </button>
        </div>
      </Sheet>

      <WearRatingModal
        open={Boolean(editWear)}
        fragranceName={`${fragrance.brand} ${displayName}`}
        catalogImage={fragrance.image}
        editMode
        initial={editWear ? { rating: editWear.rating, compliment: editWear.compliment, notes: editWear.notes } : undefined}
        onSubmit={saveWearEdit}
        onSkip={() => setEditWear(null)}
      />
    </div>
  );
}
