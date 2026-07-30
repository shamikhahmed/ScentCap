import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Camera, Sparkles, Share2, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WearRatingModal } from '@/components/ui/WearRatingModal';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import {
  deleteCollectionItem,
  getAllCollection,
  getCollectionByParent,
  getFragrance,
  getPhoto,
  savePhoto,
  updateCollectionItem,
  updateWearRecord,
} from '@/db';
import type { CollectionItem, Fragrance, SignatureRole, WearRecord } from '@/types';
import { getPreferences, savePreferences } from '@/db';
import { useApp } from '@/context/AppContext';
import { FAMILY_COLORS } from '@/lib/stats';
import { estimateWearsRemaining, formatCurrency } from '@/lib/utils';
import { downloadBlob, exportShareCardPng, fragranceToShareInput, shareWearCard } from '@/lib/shareCard';
import { scrim, textMuted } from '@/lib/ui-classes';
import { FragranceWearGuide } from '@/components/fragrance/FragranceWearGuide';
import { format } from 'date-fns';
import { fragranceDisplayName } from '@/services/onlineCatalog';

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

  const wearHistory = item
    ? history.filter((h) => h.collectionId === item.id).sort((a, b) => b.wornAt.localeCompare(a.wornAt))
    : [];

  const saveWearEdit = async (rating: number, compliment: boolean, notes?: string) => {
    if (!editWear || !item) return;
    await updateWearRecord({ ...editWear, rating, compliment, notes });
    await refresh();
    setEditWear(null);
  };

  if (!item || !fragrance) return <p className="atelier-page text-[var(--sc-text-muted)]">Loading…</p>;

  const aura = FAMILY_COLORS[fragrance.family] ?? 'var(--sc-accent)';

  const shareBottle = async () => {
    try {
      const outcome = await shareWearCard(fragranceToShareInput(fragrance), aura);
      const msg = outcome === 'shared' ? 'Shared!' : outcome === 'copied' ? 'Copied to clipboard' : 'Saved as PNG';
      setShareMsg(msg);
    } catch {
      const blob = await exportShareCardPng(fragranceToShareInput(fragrance), aura);
      downloadBlob(blob, `scentcap-${fragrance.brand}-${fragrance.name}.png`.replace(/\s+/g, '-').toLowerCase());
      setShareMsg('Saved as PNG');
    }
    setTimeout(() => setShareMsg(null), 2500);
  };

  return (
    <div className="atelier-page overflow-x-hidden">
      <div
        className="atelier-detail-hero"
        style={{ '--hero-aura': aura } as React.CSSProperties}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pt-4 pb-20 px-6">
            <FragranceThumb
              brand={fragrance.brand}
              name={fragrance.name}
              family={fragrance.family}
              catalogImage={fragrance.image}
              fragrance={fragrance}
              size="hero"
              className="w-full max-w-[11rem] !h-[200px] !bg-transparent"
            />
          </div>
        )}
        <div className="atelier-detail-scrim" />
        <button
          type="button"
          className="absolute top-4 right-4 w-10 h-10 rounded-xl border border-[var(--sc-border-soft)] bg-[var(--sc-panel)] flex items-center justify-center pressable z-10"
          onClick={() => fileRef.current?.click()}
        >
          <Camera size={18} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPhoto(f);
        }} />
        <div className="absolute bottom-0 inset-x-0 p-6 z-10">
          <Link to="/collection" className="text-xs font-semibold text-[var(--sc-accent)]">← Collection</Link>
          <p className={`text-sm ${textMuted} mt-2 font-medium`}>{fragrance.brand}</p>
          <h1 className="atelier-page__title !mt-0.5">{fragranceDisplayName(fragrance.name)}</h1>
          {(item.bottleType === 'decant' || item.bottleType === 'travel') && (
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
              {item.bottleType === 'decant' ? 'Decant' : 'Travel bottle'}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-5 mt-4">
        {parentItem && parentFragrance && (
          <Card className="text-sm">
            <p className="text-xs uppercase text-[var(--sc-text-muted)] mb-1">Linked to parent bottle</p>
            <Link to={`/fragrance/${parentItem.id}`} className="text-[var(--color-accent)] font-medium">
              {parentFragrance.brand} — {parentFragrance.name}
            </Link>
          </Card>
        )}
        {childDecants.length > 0 && (
          <Card>
            <p className="text-xs uppercase text-[var(--sc-text-muted)] mb-2">Decants & travel sizes</p>
            <div className="space-y-2">
              {childDecants.map(({ item: child, f }) => (
                <Link key={child.id} to={`/fragrance/${child.id}`} className="flex justify-between items-center text-sm hover:text-[var(--color-accent)]">
                  <span>{f?.name ?? '…'} · {child.bottleType === 'travel' ? 'Travel' : 'Decant'}</span>
                  <span className="text-[var(--sc-text-muted)] text-xs">{child.bottleSizeMl ?? '—'}ml</span>
                </Link>
              ))}
            </div>
          </Card>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={item.isFavorite ? 'default' : 'ghost'} onClick={toggleFavorite}>
            <Star size={14} fill={item.isFavorite ? 'currentColor' : 'none'} /> Favorite
          </Button>
          <Button size="sm" variant="ghost" onClick={shareBottle}>
            <Share2 size={14} /> Share
          </Button>
          <Button size="sm" variant={editing ? 'default' : 'ghost'} onClick={() => setEditing(!editing)}>
            <Pencil size={14} /> Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-[var(--sc-danger)]" onClick={() => { setDeleteCascade(false); setDeleteOpen(true); }}>
            <Trash2 size={14} /> Delete
          </Button>
          {shareMsg && <span className="text-xs text-[var(--color-accent)] self-center">{shareMsg}</span>}
          {item.purchasePrice != null && !editing && (
            <span className="text-sm text-[var(--sc-text-muted)] self-center ml-auto">{formatCurrency(item.purchasePrice)}</span>
          )}
        </div>

        {editing && (
          <Card className="space-y-3">
            <p className="text-xs uppercase text-[var(--sc-text-muted)]">Bottle details</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="atelier-input !py-2" placeholder="Size (ml)" value={editMeta.sizeMl} onChange={(e) => setEditMeta({ ...editMeta, sizeMl: e.target.value })} />
              <input className="atelier-input !py-2" placeholder="Price $" value={editMeta.price} onChange={(e) => setEditMeta({ ...editMeta, price: e.target.value })} />
              <input type="date" className="atelier-input !py-2" title="Purchased" value={editMeta.purchase} onChange={(e) => setEditMeta({ ...editMeta, purchase: e.target.value })} />
              <input type="date" className="atelier-input !py-2" title="Opened" value={editMeta.opened} onChange={(e) => setEditMeta({ ...editMeta, opened: e.target.value })} />
            </div>
            <Button className="w-full" onClick={saveEdits}>Save details</Button>
          </Card>
        )}

        <Card>
          <p className="text-xs uppercase text-[var(--sc-text-muted)] mb-2">Pyramid</p>
          <div className="space-y-2 text-sm">
            <p><span className="text-[var(--color-accent)]">Top</span> · {fragrance.top_notes.join(', ') || '—'}</p>
            <p><span className="text-[var(--color-accent)]">Heart</span> · {fragrance.heart_notes.join(', ') || '—'}</p>
            <p><span className="text-[var(--color-accent)]">Base</span> · {fragrance.base_notes.join(', ') || '—'}</p>
          </div>
        </Card>

        {profile && (
          <FragranceWearGuide
            fragrance={fragrance}
            wardrobe={wardrobeFragrances}
            profile={profile}
            prefs={prefs}
          />
        )}

        <Card>
          <p className="font-medium mb-1">Bottle level</p>
          <p className="text-xs text-[var(--sc-text-muted)] mb-3">Tap to update</p>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => updateLevel(l)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold ${
                  item.bottleLevel === l ? 'bg-[var(--sc-accent)] text-white' : 'bg-[var(--sc-surface)] text-[var(--sc-text-soft)]'
                }`}
              >
                {l === 'full' ? 'Full' : `${l}%`}
              </button>
            ))}
          </div>
          {item.estimatedWearsRemaining != null && (
            <p className="text-xs text-[var(--sc-text-muted)] mt-3">~{item.estimatedWearsRemaining} wears remaining</p>
          )}
        </Card>

        <Card>
          <p className="font-medium mb-3">Signature role</p>
          <div className="flex flex-wrap gap-2">
            {SIG_ROLES.map(({ role, label }) => (
              <button
                key={role}
                type="button"
                onClick={() => setSignature(role)}
                className={`text-xs px-3 py-2 rounded-full border ${
                  sigRole === role ? 'border-[var(--sc-accent)] bg-[var(--sc-accent-soft)] text-[var(--sc-accent)]' : 'border-[var(--sc-border-soft)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        {wearHistory.length > 0 && (
          <Card>
            <p className="font-medium mb-3">Wear history</p>
            <ul className="space-y-3">
              {wearHistory.slice(0, 8).map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    className="w-full flex justify-between items-start text-sm gap-3 text-left hover:text-[var(--color-accent)]"
                    onClick={() => setEditWear(w)}
                  >
                    <div>
                      <span className="block">{format(new Date(w.wornAt), 'MMM d, yyyy')}</span>
                      {w.compliment && <span className="text-xs text-[var(--color-accent)]">★ compliment</span>}
                      {w.rating && <span className="text-xs text-[var(--sc-text-muted)]">Rated {w.rating}/5</span>}
                      {w.notes && <span className="text-xs text-[var(--sc-text-soft)] block mt-0.5 line-clamp-2">{w.notes}</span>}
                    </div>
                    <Pencil size={14} className="shrink-0 text-[var(--sc-text-muted)] mt-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="grid grid-cols-3 gap-2 text-center text-sm">
          <div><p className="text-[var(--sc-text-muted)] text-xs">Office</p><p className="font-semibold">{fragrance.office_score}</p></div>
          <div><p className="text-[var(--sc-text-muted)] text-xs">Date</p><p className="font-semibold">{fragrance.date_score}</p></div>
          <div><p className="text-[var(--sc-text-muted)] text-xs">Casual</p><p className="font-semibold">{fragrance.casual_score}</p></div>
        </Card>

        <Button to="/advisor" className="w-full"><Sparkles size={16} /> Wear today</Button>
        <Button to="/layering" linkState={{ primaryId: fragrance.id }} variant="ghost" className="w-full">Open in Layer Lab</Button>
      </div>

      <AnimatePresence>
        {deleteOpen && (
          <motion.div
            className={`fixed inset-0 z-[100] flex items-end md:items-center justify-center ${scrim} p-4`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="atelier-panel !rounded-2xl p-6 w-full max-w-md space-y-4"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
            >
              <p className="font-semibold">Remove from wardrobe?</p>
              <p className="text-sm text-[var(--sc-text-soft)]">
                {deleteCascade && childDecants.length > 0
                  ? `This will also delete ${childDecants.length} linked decant${childDecants.length !== 1 ? 's' : ''}/travel bottle${childDecants.length !== 1 ? 's' : ''}.`
                  : childDecants.length > 0
                    ? `This bottle has ${childDecants.length} linked decant${childDecants.length !== 1 ? 's' : ''}/travel size${childDecants.length !== 1 ? 's' : ''}. Delete them too?`
                    : `${fragrance.brand} ${fragrance.name} will be removed from your collection.`}
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                {childDecants.length > 0 && !deleteCascade ? (
                  <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => setDeleteCascade(true)}>
                    Delete all
                  </Button>
                ) : (
                  <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
                    {deleteCascade ? 'Delete all' : 'Delete'}
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WearRatingModal
        open={Boolean(editWear)}
        fragranceName={`${fragrance.brand} ${fragrance.name}`}
        catalogImage={fragrance.image}
        editMode
        initial={editWear ? { rating: editWear.rating, compliment: editWear.compliment, notes: editWear.notes } : undefined}
        onSubmit={saveWearEdit}
        onSkip={() => setEditWear(null)}
      />
    </div>
  );
}
