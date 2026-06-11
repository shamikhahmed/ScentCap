import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FamilyIcon } from '@/components/ui/FamilyIcon';
import { addToCollection, putFragrance, savePhoto, searchFragranceGroups } from '@/db';
import { enrichFragranceOnce } from '@/services/seed';
import { useApp } from '@/context/AppContext';
import type { Concentration, Fragrance, GenderLean, Longevity, Projection } from '@/types';
import { CONCENTRATIONS } from '@/types';
import { estimateWearsRemaining, uid } from '@/lib/utils';

export function AddFragrance() {
  const { refresh } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'search' | 'manual'>('search');
  const [q, setQ] = useState('');
  const [groups, setGroups] = useState<Awaited<ReturnType<typeof searchFragranceGroups>>>([]);
  const [picked, setPicked] = useState<Fragrance | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ sizeMl: '100', price: '', opened: '', purchase: '' });

  const search = async (query: string) => {
    setQ(query);
    setPicked(null);
    setGroups(await searchFragranceGroups(query));
  };

  const confirmAdd = async (f: Fragrance) => {
    await enrichFragranceOnce(f);
    const colId = uid();
    let photoBlobId: string | undefined;
    if (photoFile) {
      photoBlobId = `photo-${colId}`;
      await savePhoto(photoBlobId, photoFile);
    }
    await addToCollection({
      id: colId,
      fragranceId: f.id,
      bottleLevel: 'full',
      bottleSizeMl: Number(meta.sizeMl) || 100,
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
    setPicked(f);
    await confirmAdd(f);
  };

  return (
    <div className="safe-pt px-5 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Add bottle</h1>
      <div className="flex gap-2">
        <Button variant={tab === 'search' ? 'default' : 'ghost'} onClick={() => setTab('search')}>Search</Button>
        <Button variant={tab === 'manual' ? 'default' : 'ghost'} onClick={() => setTab('manual')}>Manual</Button>
      </div>

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

      {tab === 'search' ? (
        <>
          <input
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-[var(--color-accent)]"
            placeholder="Search 2,300+ fragrances…"
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
              <Button className="w-full" onClick={() => confirmAdd(picked)}>Add to wardrobe</Button>
              <Button variant="ghost" className="w-full" onClick={() => setPicked(null)}>Back</Button>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {groups.map((g) => (
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
              ))}
            </div>
          )}
        </>
      ) : (
        <Card className="space-y-4">
          {(['name', 'brand'] as const).map((k) => (
            <input key={k} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 capitalize" placeholder={k} value={manual[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })} />
          ))}
          <select className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3" value={manual.concentration} onChange={(e) => setManual({ ...manual, concentration: e.target.value as Concentration })}>
            {CONCENTRATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button className="w-full" onClick={addManual} disabled={!manual.name || !manual.brand}>Save to wardrobe</Button>
        </Card>
      )}
    </div>
  );
}
