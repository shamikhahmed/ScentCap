import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Layers, ArrowRight, Trash2, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PressableDiv } from '@/components/ui/PressableScale';
import { PageHeader } from '@/components/premium/PageHeader';
import { GlassCard } from '@/components/premium/GlassCard';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { ScoreRing } from '@/components/home/ScoreRing';
import { useApp } from '@/context/AppContext';
import { deleteLayeringProfile, getFragrance, getSavedLayeringProfiles, saveLayeringProfile } from '@/db';
import { findBestLayering } from '@/engines/layering';
import { computeLayeringSprayGuidance } from '@/engines/spray';
import { defaultAdvisorInput } from '@/engines/advisor';
import { SprayBodyMap } from '@/components/advisor/SprayBodyMap';
import { genderToBodyVariant } from '@/lib/sprayZones';
import { enrichFragranceImages } from '@/services/seed';
import type { Fragrance, LayeringProfile } from '@/types';
import { uid } from '@/lib/utils';
import { hapticLight, hapticSuccess } from '@/lib/premium/haptics';
import { textSubtle } from '@/lib/ui-classes';

export function LayeringLab() {
  const { collection, profile, prefs } = useApp();
  const navigate = useNavigate();
  const [items, setItems] = useState<{ id: string; f: Fragrance }[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof findBestLayering> | null>(null);
  const [sprayPlan, setSprayPlan] = useState<ReturnType<typeof computeLayeringSprayGuidance> | null>(null);
  const [saved, setSaved] = useState<LayeringProfile[]>([]);
  const [savedLabels, setSavedLabels] = useState<Record<string, { primary: string; secondary: string }>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

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
    ).then((rows) => {
      const loaded = rows.filter(Boolean) as { id: string; f: Fragrance }[];
      setItems(loaded);
      void enrichFragranceImages(loaded.map((i) => i.id)).then(async () => {
        const refreshed = await Promise.all(
          loaded.map(async ({ id }) => {
            const f = await getFragrance(id);
            return f ? { id, f } : null;
          }),
        );
        setItems(refreshed.filter(Boolean) as { id: string; f: Fragrance }[]);
      });
    });
    loadSaved();
  }, [collection]);

  const primary = items.find((i) => i.id === primaryId)?.f;

  const analyze = () => {
    if (!primary) return;
    hapticLight();
    setAnalyzing(true);
    const others = items.filter((i) => i.id !== primaryId).map((i) => i.f);
    const match = findBestLayering(primary, others);
    setResult(match);
    if (match && profile) {
      setSprayPlan(
        computeLayeringSprayGuidance(
          primary,
          match.secondary,
          defaultAdvisorInput(),
          profile,
          prefs.officeMaxSprays ?? 3,
        ),
      );
    } else {
      setSprayPlan(null);
    }
    setAnalyzing(false);
  };

  useEffect(() => {
    if (!result) return;
    const t = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [result]);

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
    hapticSuccess();
    await loadSaved();
  };

  const removeCombo = async (id: string) => {
    hapticLight();
    await deleteLayeringProfile(id);
    await loadSaved();
  };

  const loadCombo = async (p: LayeringProfile) => {
    hapticLight();
    setPrimaryId(p.primaryId);
    const sec = await getFragrance(p.secondaryId);
    const pri = await getFragrance(p.primaryId);
    if (!sec || !pri) return;
    setResult({
      secondary: sec,
      score: p.score,
      order: p.order,
      guidance: p.guidance,
      baseFragranceId: p.primaryId,
      accentFragranceId: p.secondaryId,
    });
    if (profile) {
      setSprayPlan(
        computeLayeringSprayGuidance(pri, sec, defaultAdvisorInput(), profile, prefs.officeMaxSprays ?? 3),
      );
    }
  };

  const pickPrimary = (id: string) => {
    hapticLight();
    setPrimaryId(id);
    setResult(null);
    setSprayPlan(null);
  };

  if (!items.length) {
    return (
      <div className="safe-pt px-5 py-8 max-w-lg mx-auto">
        <PageHeader
          eyebrow="ScentCap Lab"
          title="Layering Lab"
          subtitle="Stack two scents from your wardrobe and find pairings that actually work."
          large
        />
        <GlassCard className="mt-10 text-center py-12" delay={0.1}>
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl glass-premium flex items-center justify-center">
            <Layers size={24} className="text-[var(--color-accent)]" />
          </div>
          <p className="text-subhead font-medium">Your wardrobe is empty</p>
          <p className={`text-sm mt-2 max-w-[16rem] mx-auto ${textSubtle}`}>
            Add at least two bottles to experiment with layering combos.
          </p>
          <Button className="mt-8 min-w-[200px]" onClick={() => navigate('/add')} haptic="medium">
            <Plus size={18} />
            Add fragrance
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="safe-pt px-5 py-6 max-w-lg mx-auto space-y-8">
      <PageHeader
        eyebrow="ScentCap Lab"
        title="Layering Lab"
        subtitle="Pick a base from your wardrobe — we'll find the best partner."
        trailing={<Sparkles size={22} className="text-[var(--color-accent)] opacity-80 mt-1" />}
      />

      {saved.length > 0 && (
        <GlassCard delay={0.05}>
          <p className="text-caption text-[var(--color-text-tertiary)] mb-3">Saved combos</p>
          <div className="space-y-2">
            {saved.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <PressableDiv className="flex-1 min-w-0" onClick={() => loadCombo(p)} asButton>
                  <p className="text-sm truncate">
                    <span className="text-[var(--color-accent)] font-semibold tabular-nums">{p.score}%</span>
                    <span className="text-[var(--color-text-tertiary)]"> · </span>
                    {savedLabels[p.id]?.primary ?? '…'}
                    <span className="text-[var(--color-text-tertiary)]"> + </span>
                    {savedLabels[p.id]?.secondary ?? '…'}
                  </p>
                </PressableDiv>
                <button
                  type="button"
                  className="p-2 rounded-xl text-[var(--color-text-tertiary)] hover:text-red-400 pressable"
                  onClick={() => removeCombo(p.id)}
                  aria-label="Delete combo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <section>
        <p className="text-caption text-[var(--color-text-tertiary)] mb-3">Choose base scent</p>
        <div className="grid grid-cols-2 gap-3">
          {items.map(({ id, f }) => (
            <button
              key={id}
              type="button"
              onClick={() => pickPrimary(id)}
              className={`text-left rounded-2xl p-3 border transition-colors pressable touch-pan-y ${
                primaryId === id
                  ? 'border-[var(--color-accent)]/50 bg-[var(--color-accent)]/8'
                  : 'border-white/[0.06] bg-white/[0.03]'
              }`}
            >
              <FragranceThumb
                brand={f.brand}
                name={f.name}
                family={f.family}
                catalogImage={f.image}
                fragrance={f}
                size="sm"
                selected={primaryId === id}
                className="mb-2.5 w-full"
              />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] truncate">
                {f.brand}
              </p>
              <p className="text-sm font-medium leading-tight tracking-tight mt-0.5 line-clamp-2">{f.name}</p>
            </button>
          ))}
        </div>
      </section>

      {primary && !result && (
        <Button className="w-full btn-glow" onClick={analyze} disabled={items.length < 2 || analyzing} haptic="medium">
          {items.length < 2 ? 'Need at least 2 bottles' : 'Find layering partner'}
        </Button>
      )}

      <AnimatePresence mode="wait">
        {result && primary && (
          <motion.div
            ref={resultRef}
            key={`${primaryId}-${result.secondary.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <GlassCard glow="var(--color-accent)" className="space-y-5">
              {result.warn && (
                <p className="text-amber-400/90 text-sm rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                  {result.warn}
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1 text-center space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Base</p>
                  <FragranceThumb brand={primary.brand} name={primary.name} family={primary.family} catalogImage={primary.image} fragrance={primary} size="sm" className="mx-auto w-20" />
                  <p className="text-sm font-semibold leading-tight line-clamp-2">{primary.name}</p>
                </div>

                <ArrowRight className="text-[var(--color-accent)] shrink-0" size={20} />

                <div className="flex-1 text-center space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Layer</p>
                  <FragranceThumb brand={result.secondary.brand} name={result.secondary.name} family={result.secondary.family} catalogImage={result.secondary.image} fragrance={result.secondary} size="sm" className="mx-auto w-20" />
                  <p className="text-sm font-semibold leading-tight line-clamp-2">{result.secondary.name}</p>
                </div>
              </div>

              <div className="flex flex-col items-center py-2">
                <p className="text-xs uppercase tracking-wider text-[var(--sc-text-muted)] mb-2">Suggested pairing</p>
                <ScoreRing score={result.score} size={96} />
              </div>

              <div className="space-y-2 text-center">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{result.order}</p>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{result.guidance}</p>
              </div>

              {sprayPlan && profile && (
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/40 p-4">
                  <SprayBodyMap
                    bodyVariant={sprayPlan.bodyVariant ?? genderToBodyVariant(profile.gender)}
                    activeZones={sprayPlan.activeZones ?? []}
                    sprays={sprayPlan.totalSprays}
                    isLayered
                    applicationSteps={sprayPlan.applicationSteps}
                    techniqueNote={sprayPlan.techniqueNote}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="ghost" className="flex-1" onClick={() => { setResult(null); setSprayPlan(null); hapticLight(); }}>
                  Try another base
                </Button>
                <Button className="flex-1" onClick={saveCombo} haptic="success">
                  <Bookmark size={16} />
                  Save combo
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
