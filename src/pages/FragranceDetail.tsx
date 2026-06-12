import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Camera, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllCollection, getCollectionByParent, getFragrance, getPhoto, savePhoto } from '@/db';
import type { CollectionItem, Fragrance, SignatureRole } from '@/types';
import { getDb, getPreferences, savePreferences } from '@/db';
import { FAMILY_COLORS } from '@/lib/stats';
import { estimateWearsRemaining, formatCurrency } from '@/lib/utils';

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [item, setItem] = useState<CollectionItem | null>(null);
  const [fragrance, setFragrance] = useState<Fragrance | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sigRole, setSigRole] = useState<SignatureRole | undefined>();
  const [parentItem, setParentItem] = useState<CollectionItem | null>(null);
  const [parentFragrance, setParentFragrance] = useState<Fragrance | null>(null);
  const [childDecants, setChildDecants] = useState<{ item: CollectionItem; f?: Fragrance }[]>([]);

  useEffect(() => {
    (async () => {
      const col = await getAllCollection();
      const c = col.find((x) => x.id === id);
      if (!c) return;
      setItem(c);
      setSigRole(c.signatureRole);
      const f = await getFragrance(c.fragranceId);
      setFragrance(f ?? null);
      if (c.photoBlobId) {
        const blob = await getPhoto(c.photoBlobId);
        if (blob) setPhotoUrl(URL.createObjectURL(blob));
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
      const children = await getCollectionByParent(c.id);
      const childRows = await Promise.all(
        children.map(async (child) => ({ item: child, f: await getFragrance(child.fragranceId) })),
      );
      setChildDecants(childRows);
    })();
  }, [id]);

  const save = async (next: CollectionItem) => {
    await (await getDb()).put('collection', next);
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
    setPhotoUrl(URL.createObjectURL(file));
  };

  if (!item || !fragrance) return <p className="p-8 text-stone-400">Loading…</p>;

  const aura = FAMILY_COLORS[fragrance.family] ?? '#c9a87c';

  return (
    <div className="safe-pt pb-8 max-w-lg mx-auto">
      <div
        className="relative h-56 md:h-64 rounded-b-[2rem] overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${aura}33, #0c0a09)` }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="welcome-orb scale-75" />
          </div>
        )}
        <button
          type="button"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          onClick={() => fileRef.current?.click()}
        >
          <Camera size={18} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPhoto(f);
        }} />
        <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-[#0c0a09] to-transparent">
          <Link to="/collection" className="text-xs text-[var(--color-accent)]">← Wardrobe</Link>
          <p className="text-stone-400 text-sm">{fragrance.brand}</p>
          <h1 className="text-2xl font-semibold">{fragrance.name}</h1>
          {(item.bottleType === 'decant' || item.bottleType === 'travel') && (
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
              {item.bottleType === 'decant' ? 'Decant' : 'Travel bottle'}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 space-y-5 -mt-2">
        {parentItem && parentFragrance && (
          <Card className="text-sm">
            <p className="text-xs uppercase text-stone-500 mb-1">Linked to parent bottle</p>
            <Link to={`/fragrance/${parentItem.id}`} className="text-[var(--color-accent)] font-medium">
              {parentFragrance.brand} — {parentFragrance.name}
            </Link>
          </Card>
        )}
        {childDecants.length > 0 && (
          <Card>
            <p className="text-xs uppercase text-stone-500 mb-2">Decants & travel sizes</p>
            <div className="space-y-2">
              {childDecants.map(({ item: child, f }) => (
                <Link key={child.id} to={`/fragrance/${child.id}`} className="flex justify-between items-center text-sm hover:text-[var(--color-accent)]">
                  <span>{f?.name ?? '…'} · {child.bottleType === 'travel' ? 'Travel' : 'Decant'}</span>
                  <span className="text-stone-500 text-xs">{child.bottleSizeMl ?? '—'}ml</span>
                </Link>
              ))}
            </div>
          </Card>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant={item.isFavorite ? 'default' : 'ghost'} onClick={toggleFavorite}>
            <Star size={14} fill={item.isFavorite ? 'currentColor' : 'none'} /> Favorite
          </Button>
          {item.purchasePrice != null && (
            <span className="text-sm text-stone-500 self-center ml-auto">{formatCurrency(item.purchasePrice)}</span>
          )}
        </div>

        <Card>
          <p className="text-xs uppercase text-stone-500 mb-2">Pyramid</p>
          <div className="space-y-2 text-sm">
            <p><span className="text-[var(--color-accent)]">Top</span> · {fragrance.top_notes.join(', ') || '—'}</p>
            <p><span className="text-[var(--color-accent)]">Heart</span> · {fragrance.heart_notes.join(', ') || '—'}</p>
            <p><span className="text-[var(--color-accent)]">Base</span> · {fragrance.base_notes.join(', ') || '—'}</p>
          </div>
        </Card>

        <Card>
          <p className="font-medium mb-1">Bottle level</p>
          <p className="text-xs text-stone-500 mb-3">Tap to update</p>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => updateLevel(l)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold ${
                  item.bottleLevel === l ? 'bg-[var(--color-accent)] text-stone-950' : 'bg-white/5 text-stone-400'
                }`}
              >
                {l === 'full' ? 'Full' : `${l}%`}
              </button>
            ))}
          </div>
          {item.estimatedWearsRemaining != null && (
            <p className="text-xs text-stone-500 mt-3">~{item.estimatedWearsRemaining} wears remaining</p>
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
                  sigRole === role ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15' : 'border-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="grid grid-cols-3 gap-2 text-center text-sm">
          <div><p className="text-stone-500 text-xs">Office</p><p className="font-semibold">{fragrance.office_score}</p></div>
          <div><p className="text-stone-500 text-xs">Date</p><p className="font-semibold">{fragrance.date_score}</p></div>
          <div><p className="text-stone-500 text-xs">Casual</p><p className="font-semibold">{fragrance.casual_score}</p></div>
        </Card>

        <Link to="/advisor"><Button className="w-full"><Sparkles size={16} /> Wear today</Button></Link>
        <Link to="/layering" state={{ primaryId: fragrance.id }}><Button variant="ghost" className="w-full">Open in Layer Lab</Button></Link>
      </div>
    </div>
  );
}
