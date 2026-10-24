import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Bookmark, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { BottleCard, PageHeader, Ring, Section } from '@/components/kit';
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
import { fragranceDisplayName } from '@/lib/fragranceName';

export function LayeringLab() {
  const { collection, profile, prefs } = useApp();
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
      const deduped = [...new Map(loaded.map((row) => [row.id, row])).values()];
      setItems(deduped);
      void enrichFragranceImages(deduped.map((i) => i.id)).then(async () => {
        const refreshed = await Promise.all(
          deduped.map(async ({ id }) => {
            const f = await getFragrance(id);
            return f ? { id, f } : null;
          }),
        );
        setItems(
          [...new Map((refreshed.filter(Boolean) as { id: string; f: Fragrance }[]).map((row) => [row.id, row])).values()],
        );
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
      <EmptyState
        eyebrow="Lab"
        title="Layering Lab"
        description="Add at least two bottles to your wardrobe and we will find pairings that work together."
        action={{ label: 'Add fragrance', to: '/add' }}
      />
    );
  }

  const needTwo = items.length < 2;

  return (
    <div className="ui-page">
      <PageHeader eyebrow="Lab" title="Layering Lab" subtitle="Pick a base and find the best partner from your wardrobe." />

      {saved.length > 0 && (
        <Section title="Saved combos" id="layering-saved">
          <div className="ui-list">
            {saved.map((p) => (
              <div key={p.id} className="ui-row">
                <button
                  type="button"
                  className="ui-row__main bg-transparent border-0 p-0 text-left text-inherit font-[inherit] cursor-pointer min-h-[44px] flex items-center"
                  onClick={() => void loadCombo(p)}
                  aria-label={`Open combo ${savedLabels[p.id]?.primary ?? ''} plus ${savedLabels[p.id]?.secondary ?? ''}`}
                >
                  <span className="min-w-0">
                    <span className="ui-row__title block">
                      {savedLabels[p.id]?.primary ?? '…'} + {savedLabels[p.id]?.secondary ?? '…'}
                    </span>
                    <span className="ui-row__sub block">{p.score}% match</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="ui-icon-btn"
                  onClick={() => void removeCombo(p.id)}
                  aria-label="Delete combo"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Choose base scent" id="layering-base">
        <div className="ui-grid">
          {items.map(({ id, f }) => (
            <BottleCard
              key={id}
              fragrance={f}
              selected={primaryId === id}
              onClick={() => pickPrimary(id)}
            />
          ))}
        </div>
      </Section>

      {primary && !result && (
        <div className="ui-section">
          <button
            type="button"
            className="ui-btn ui-btn--primary ui-btn--block"
            onClick={analyze}
            disabled={needTwo || analyzing}
          >
            {needTwo ? 'Need at least 2 bottles' : 'Find layering partner'}
          </button>
        </div>
      )}

      {result && primary && (
        <section
          ref={resultRef}
          key={`${primaryId}-${result.secondary.id}`}
          className="ui-section ui-rise"
          aria-label="Layering result"
        >
          <div className="ui-card ui-card--lg space-y-5">
            {result.warn && (
              <div className="flex items-start gap-2 text-[var(--warning)]" role="status">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden />
                <p className="text-[var(--t-subhead)]">{result.warn}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 text-center space-y-2">
                <p className="ui-eyebrow">Base</p>
                <div className="mx-auto w-24">
                  <FragranceThumb fragrance={primary} variant="plinth" size="sm" />
                </div>
                <p className="serif text-[var(--t-callout)] leading-tight line-clamp-2">{fragranceDisplayName(primary.name)}</p>
              </div>

              <ArrowRight className="text-[var(--label-3)] shrink-0" size={20} aria-hidden />

              <div className="flex-1 min-w-0 text-center space-y-2">
                <p className="ui-eyebrow">Layer</p>
                <div className="mx-auto w-24">
                  <FragranceThumb fragrance={result.secondary} variant="plinth" size="sm" />
                </div>
                <p className="serif text-[var(--t-callout)] leading-tight line-clamp-2">
                  {fragranceDisplayName(result.secondary.name)}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="relative" style={{ width: 96, height: 96 }}>
                <Ring value={result.score} size={96} stroke={8} label={`${result.score}% pairing score`} />
                <span className="absolute inset-0 flex items-center justify-center text-[var(--t-title2)] font-semibold tabular-nums">
                  {result.score}%
                </span>
              </div>
              <p className="ui-secondary text-[var(--t-subhead)]">Suggested pairing</p>
            </div>

            <div className="space-y-1.5 text-center">
              <p className="font-semibold">{result.order}</p>
              <p className="ui-secondary leading-relaxed">{result.guidance}</p>
            </div>

            {sprayPlan && profile && (
              <div className="rounded-[var(--r-md)] bg-[var(--surface-2)] p-4">
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

            <div className="flex gap-2">
              <button
                type="button"
                className="ui-btn ui-btn--gray flex-1"
                onClick={() => {
                  setResult(null);
                  setSprayPlan(null);
                  hapticLight();
                }}
              >
                Try another base
              </button>
              <button type="button" className="ui-btn ui-btn--primary flex-1" onClick={() => void saveCombo()}>
                <Bookmark size={16} aria-hidden />
                Save combo
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
