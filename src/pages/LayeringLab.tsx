import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Layers, ArrowRight, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { deleteLayeringProfile, getFragrance, getSavedLayeringProfiles, saveLayeringProfile } from '@/db';
import { findBestLayering } from '@/engines/layering';
import type { Fragrance, LayeringProfile } from '@/types';
import { FAMILY_COLORS } from '@/lib/stats';
import { uid } from '@/lib/utils';

export function LayeringLab() {
  const { collection } = useApp();
  const [items, setItems] = useState<{ id: string; f: Fragrance }[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof findBestLayering> | null>(null);
  const [saved, setSaved] = useState<LayeringProfile[]>([]);
  const [savedLabels, setSavedLabels] = useState<Record<string, { primary: string; secondary: string }>>({});

  const loadSaved = async () => {
    const profiles = await getSavedLayeringProfiles();
    setSaved(profiles);
    const labels: Record<string, { primary: string; secondary: string }> = {};
    await Promise.all(profiles.map(async (p) => {
      const [a, b] = await Promise.all([getFragrance(p.primaryId), getFragrance(p.secondaryId)]);
      labels[p.id] = { primary: a?.name ?? 'Unknown', secondary: b?.name ?? 'Unknown' };
    }));
    setSavedLabels(labels);
  };

  useEffect(() => {
    Promise.all(
      collection.map(async (c) => {
        const f = await getFragrance(c.fragranceId);
        return f ? { id: c.fragranceId, f } : null;
      }),
    ).then((rows) => setItems(rows.filter(Boolean) as { id: string; f: Fragrance }[]));
    loadSaved();
  }, [collection]);

  const primary = items.find((i) => i.id === primaryId)?.f;

  const analyze = () => {
    if (!primary) return;
    const others = items.filter((i) => i.id !== primaryId).map((i) => i.f);
    setResult(findBestLayering(primary, others));
  };

  const saveCombo = async () => {
    if (!result || !primaryId) return;
    const profile: LayeringProfile = {
      id: uid(),
      primaryId,
      secondaryId: result.secondary.id,
      score: result.score,
      order: result.order,
      guidance: result.guidance,
      savedAt: new Date().toISOString(),
      name: `${primary?.name ?? 'Base'} + ${result.secondary.name}`,
    };
    await saveLayeringProfile(profile);
    await loadSaved();
  };

  const removeCombo = async (id: string) => {
    await deleteLayeringProfile(id);
    await loadSaved();
  };

  const loadCombo = async (p: LayeringProfile) => {
    setPrimaryId(p.primaryId);
    setResult({
      secondary: (await getFragrance(p.secondaryId))!,
      score: p.score,
      order: p.order,
      guidance: p.guidance,
    });
  };

  return (
    <div className="safe-pt px-5 py-6 max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">ScentCap Lab</p>
        <h1 className="text-3xl font-semibold mt-1 flex items-center gap-2">
          <Layers size={28} /> Layering Lab
        </h1>
        <p className="text-stone-400 text-sm mt-2">Pick a base from your wardrobe — we&apos;ll find the best partner.</p>
      </div>

      {saved.length > 0 && (
        <Card>
          <p className="font-medium mb-3">Saved combos</p>
          <div className="space-y-2">
            {saved.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                <button type="button" className="flex-1 text-left text-sm" onClick={() => loadCombo(p)}>
                  <span className="text-[var(--color-accent)] font-semibold">{p.score}%</span>
                  {' · '}
                  {savedLabels[p.id]?.primary ?? '…'} + {savedLabels[p.id]?.secondary ?? '…'}
                </button>
                <button type="button" className="p-2 text-stone-500 hover:text-red-400" onClick={() => removeCombo(p.id)} aria-label="Delete combo">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto">
        {items.map(({ id, f }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setPrimaryId(id); setResult(null); }}
            className={`text-left rounded-2xl p-4 border transition-all ${
              primaryId === id
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div
              className="w-8 h-8 rounded-lg mb-2"
              style={{ background: FAMILY_COLORS[f.family] ?? '#c9a87c' }}
            />
            <p className="text-[10px] text-stone-500">{f.brand}</p>
            <p className="text-sm font-medium leading-tight">{f.name}</p>
          </button>
        ))}
      </div>

      {primary && (
        <Button className="w-full" onClick={analyze}>Find layering partner</Button>
      )}

      <AnimatePresence>
        {result && primary && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-[var(--color-accent)]/30 space-y-4">
              {result.warn && <p className="text-amber-400 text-sm">⚠ {result.warn}</p>}
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-stone-500">Base</p>
                  <p className="font-semibold">{primary.name}</p>
                </div>
                <ArrowRight className="text-[var(--color-accent)]" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-stone-500">Layer</p>
                  <p className="font-semibold">{result.secondary.name}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-[var(--color-accent)]">{result.score}%</p>
                <p className="text-xs text-stone-500">compatibility</p>
              </div>
              <p className="text-sm text-stone-300">{result.order}</p>
              <p className="text-sm text-stone-400">{result.guidance}</p>
              <Button variant="ghost" className="w-full" onClick={saveCombo}>
                <Bookmark size={16} /> Save combo
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!items.length && (
        <Card className="text-center py-10 text-stone-400">Add bottles to your wardrobe first.</Card>
      )}
    </div>
  );
}
