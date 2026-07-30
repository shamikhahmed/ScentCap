import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Share2, Bookmark, UserRound, Layers } from 'lucide-react';
import { GlassCard } from '@/components/premium/GlassCard';
import { Button } from '@/components/ui/button';
import { OptionPill } from '@/components/ui/OptionPill';
import { LoadingCard } from '@/components/ui/LoadingCard';
import { ADVISOR_LOADING_MESSAGES } from '@/components/ui/CyclingShimmerText';
import { useApp } from '@/context/AppContext';
import { defaultAdvisorInput, runAdvisor } from '@/engines/advisor';
import { logWear, updateWearRecord } from '@/db';
import type { AdvisorInput, AdvisorResult } from '@/types';
import { uid } from '@/lib/utils';
import { fragranceDisplayName } from '@/services/onlineCatalog';
import { WearRatingModal } from '@/components/ui/WearRatingModal';
import { SprayBodyMap } from '@/components/advisor/SprayBodyMap';
import { ScoreRing } from '@/components/home/ScoreRing';
import { FAMILY_COLORS } from '@/lib/stats';
import { weatherUnavailableMessage } from '@/services/weather';
import { advisorToShareInput, downloadBlob, exportShareCardPng, shareWearCard } from '@/lib/shareCard';
import { saveAdvisorLayering } from '@/lib/layeringSave';
import { EmptyState } from '@/components/ui/EmptyState';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { hapticSuccess } from '@/lib/premium/haptics';
import { hydrateAdvisorResult } from '@/services/seed';
import { bodyVariantLabel, genderToBodyVariant } from '@/lib/sprayZones';

const FIELDS: { key: keyof AdvisorInput; label: string; options: { v: string; l: string }[] }[] = [
  { key: 'timeOfDay', label: 'Time', options: [
    { v: 'morning', l: 'Morning' }, { v: 'afternoon', l: 'Afternoon' }, { v: 'evening', l: 'Evening' }, { v: 'night', l: 'Night' },
  ]},
  { key: 'occasion', label: 'Occasion', options: [
    { v: 'work', l: 'Work' }, { v: 'casual', l: 'Casual' }, { v: 'date', l: 'Date' }, { v: 'event', l: 'Event' }, { v: 'home', l: 'Home' },
  ]},
  { key: 'dressLevel', label: 'Dress', options: [
    { v: 'casual', l: 'Casual' }, { v: 'smart_casual', l: 'Smart casual' }, { v: 'semi_formal', l: 'Semi-formal' }, { v: 'formal', l: 'Formal' }, { v: 'professional', l: 'Professional' },
  ]},
  { key: 'vibe', label: 'Vibe', options: [
    { v: 'fresh', l: 'Fresh' }, { v: 'warm', l: 'Warm' }, { v: 'bold', l: 'Bold' }, { v: 'subtle', l: 'Subtle' }, { v: 'romantic', l: 'Romantic' }, { v: 'confident', l: 'Confident' },
  ]},
];

export function AdvisorPage() {
  const { profile, prefs, collection, history, weather, weatherUnavailable, refresh } = useApp();
  const location = useLocation();
  const preset = location.state as { occasion?: AdvisorInput['occasion']; dress?: AdvisorInput['dressLevel']; vibe?: AdvisorInput['vibe'] } | null;
  const weatherNotice = !weather ? weatherUnavailableMessage(weatherUnavailable) : null;
  const bodyVariant = profile ? genderToBodyVariant(profile.gender) : 'neutral';

  const [input, setInput] = useState<AdvisorInput>(() => {
    const d = defaultAdvisorInput();
    if (preset?.occasion) d.occasion = preset.occasion;
    if (preset?.dress) d.dressLevel = preset.dress;
    if (preset?.vibe) d.vibe = preset.vibe;
    return d;
  });
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [pendingWear, setPendingWear] = useState<{ id: string; collectionId: string; fragranceId: string; name: string; sprays: number; wornAt: string } | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [layerSaved, setLayerSaved] = useState(false);
  const [wearRatingImage, setWearRatingImage] = useState<string | null>(null);
  const presetRan = useRef(false);

  const run = async () => {
    if (!profile) return;
    setLoading(true);
    const r = await runAdvisor(collection, input, profile, prefs, weather, history);
    setLoading(false);
    if (!r) {
      setResult(null);
      return;
    }
    setResult(r);
    void hydrateAdvisorResult(r).then(setResult);
  };

  useEffect(() => {
    if (!preset || presetRan.current || !collection.length || !profile) return;
    presetRan.current = true;
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, collection.length, profile]);

  if (!collection.length) {
    return (
      <div className="atelier-page">
        <EmptyState
          eyebrow="Advisor"
          title="Add bottles first"
          description="The Scent Advisor needs at least one bottle in your wardrobe to recommend a match."
          action={{ label: 'Add a bottle', to: '/add' }}
        />
      </div>
    );
  }

  const wear = async () => {
    if (!result || !profile) return;
    const wearId = uid();
    const sprays = result.spray.totalSprays;
    const wornAt = new Date().toISOString();
    await logWear({
      id: wearId,
      collectionId: result.primary.collectionId,
      fragranceId: result.primary.fragrance.id,
      wornAt,
      occasion: input.occasion,
      dressLevel: input.dressLevel,
      sprays,
      weatherTempC: weather?.tempC,
      weatherHumidity: weather?.humidity,
      weatherCondition: weather?.condition,
      zones: result.spray.pulsePoints?.slice(0, 6),
    });
    await refresh();
    hapticSuccess();
    setPendingWear({
      id: wearId,
      collectionId: result.primary.collectionId,
      fragranceId: result.primary.fragrance.id,
      name: `${result.primary.fragrance.brand} ${fragranceDisplayName(result.primary.fragrance.name)}`,
      sprays,
      wornAt,
    });
    setWearRatingImage(result.primary.fragrance.image ?? null);
    setRatingOpen(true);
  };

  const saveRating = async (rating: number, compliment: boolean, notes?: string) => {
    if (!pendingWear) return;
    await updateWearRecord({
      id: pendingWear.id,
      collectionId: pendingWear.collectionId,
      fragranceId: pendingWear.fragranceId,
      wornAt: pendingWear.wornAt,
      occasion: input.occasion,
      dressLevel: input.dressLevel,
      sprays: pendingWear.sprays,
      rating,
      compliment,
      notes,
    });
    await refresh();
    setRatingOpen(false);
    setPendingWear(null);
  };

  const familyColor = result
    ? FAMILY_COLORS[result.primary.fragrance.family] ?? 'var(--sc-accent)'
    : 'var(--sc-accent)';

  const shareResult = async () => {
    if (!result) return;
    try {
      const shareInput = advisorToShareInput(result);
      const outcome = await shareWearCard(shareInput, familyColor, { format: 'square' });
      const msg = outcome === 'shared' ? 'Shared!' : outcome === 'copied' ? 'Copied to clipboard' : 'Saved as PNG';
      setShareMsg(msg);
      setTimeout(() => setShareMsg(null), 2500);
    } catch {
      const blob = await exportShareCardPng(advisorToShareInput(result), familyColor, { format: 'square' });
      downloadBlob(blob, 'scentcap-today-square.png');
      setShareMsg('Saved as PNG');
      setTimeout(() => setShareMsg(null), 2500);
    }
  };

  const saveLayering = async () => {
    if (!result?.layering) return;
    await saveAdvisorLayering(result);
    hapticSuccess();
    setLayerSaved(true);
    setTimeout(() => setLayerSaved(false), 2500);
  };

  return (
    <div className="atelier-page pb-4">
      <header className="mb-6">
        <p className="atelier-page__brand">Smart Assistant</p>
        <h1 className="atelier-page__title">Scent Advisor</h1>
        <p className="atelier-page__sub">Match wardrobe to moment — personal spray map.</p>
      </header>

      {profile?.gender === 'prefer_not' && (
        <GlassCard className="flex items-start gap-3 !p-4 mb-5" delay={0.02}>
          <UserRound size={18} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Set your profile for a tailored body map</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              We use male or female anatomy based on your gender in Settings.
            </p>
            <Link to="/settings" className="text-xs text-[var(--color-accent)] font-semibold mt-2 inline-block">
              Update profile →
            </Link>
          </div>
        </GlassCard>
      )}

      {weatherNotice && (
        <GlassCard className="flex items-start gap-3 !p-4 mb-5" delay={0.03}>
          <MapPin className="text-[var(--color-text-secondary)] shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium">No weather data</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{weatherNotice}</p>
            <Link to="/settings" className="text-[var(--color-accent)] text-sm font-medium mt-2 inline-block">
              Set your city in Settings
            </Link>
          </div>
        </GlassCard>
      )}

      {prefs.officeSafeMode && (
        <GlassCard className="flex items-start gap-3 !p-4 mb-5 border-[var(--color-accent)]/25" delay={0.04}>
          <Briefcase className="text-[var(--color-accent)] shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium">Office Safe is on</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Work and professional picks stay low-projection and desk-friendly.
            </p>
            <Link to="/settings" className="text-[var(--color-accent)] text-sm font-medium mt-2 inline-block">
              Adjust in Settings
            </Link>
          </div>
        </GlassCard>
      )}

      <GlassCard className="!p-5 mb-5" delay={0.05}>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold mb-4">
          Your moment
        </p>
        <div className="space-y-5">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2 font-semibold">{field.label}</p>
              <div className="flex flex-wrap gap-2">
                {field.options.map((o) => (
                  <OptionPill
                    key={o.v}
                    label={o.l}
                    selected={input[field.key] === o.v}
                    onSelect={() => setInput({ ...input, [field.key]: o.v })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full btn-glow mt-6" size="lg" onClick={run} disabled={loading || !collection.length} haptic="medium">
          {loading ? 'Working…' : 'Get recommendation'}
        </Button>
      </GlassCard>

      {loading && <LoadingCard messages={ADVISOR_LOADING_MESSAGES} />}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <GlassCard
            className="flex gap-4 items-center !p-5 border-[var(--color-accent)]/30"
            delay={0.05}
          >
            <FragranceThumb
              brand={result.primary.fragrance.brand}
              name={result.primary.fragrance.name}
              family={result.primary.fragrance.family}
              catalogImage={result.primary.fragrance.image}
              fragrance={result.primary.fragrance}
              size="md"
              className="w-20 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--color-accent)] uppercase tracking-wider font-semibold">Primary pick</p>
              <h2 className="text-xl font-semibold mt-1 tracking-tight">{result.primary.fragrance.brand}</h2>
              <p className="text-base text-[var(--color-text-secondary)]">{fragranceDisplayName(result.primary.fragrance.name)}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {result.primary.fragrance.concentration} · {result.primary.fragrance.family}
              </p>
            </div>
            <ScoreRing score={result.fragranceScore} color={familyColor} size={72} />
          </GlassCard>

          <GlassCard className="!p-5 md:!p-6" delay={0.1}>
            <SprayBodyMap
              bodyVariant={result.spray.bodyVariant ?? bodyVariant}
              activeZones={result.spray.activeZones ?? []}
              sprays={result.spray.totalSprays}
              isLayered={result.spray.isLayered}
              applicationSteps={result.spray.applicationSteps}
              techniqueNote={result.spray.techniqueNote}
            />
            <p className="text-xs text-[var(--color-text-tertiary)] mt-5 text-center leading-relaxed">
              {result.spray.concentrationNote}
            </p>
            {result.spray.warnings.map((w) => (
              <p key={w} className="text-[var(--sc-warning)] text-sm mt-2 text-center">⚠ {w}</p>
            ))}
          </GlassCard>

          {result.layering && result.spray.isLayered && result.spray.layeringRoles && (
            <GlassCard className="!p-5" delay={0.12}>
              <p className="font-medium flex items-center gap-2">
                <Layers size={16} className="text-[var(--color-accent)]" />
                Layering · {result.layering.compatibilityScore}% match
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">{result.layering.order}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-2">{result.layering.guidance}</p>
              <Button variant="ghost" className="w-full mt-3" onClick={saveLayering}>
                <Bookmark size={16} />
                {layerSaved ? 'Saved to Layering Lab!' : 'Save to Layering Lab'}
              </Button>
            </GlassCard>
          )}

          {result.layering && !result.spray.isLayered && (
            <GlassCard className="!p-5" delay={0.12}>
              <p className="font-medium">Layering · {result.layering.compatibilityScore}% match</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">{result.layering.order}</p>
              <div className="flex items-center gap-3 mt-3">
                <FragranceThumb
                  brand={result.layering.secondary.brand}
                  name={result.layering.secondary.name}
                  family={result.layering.secondary.family}
                  catalogImage={result.layering.secondary.image}
                  fragrance={result.layering.secondary}
                  size="sm"
                  className="w-12 shrink-0"
                />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  + {result.layering.secondary.brand} {fragranceDisplayName(result.layering.secondary.name)}
                </p>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-2">{result.layering.guidance}</p>
              <Button variant="ghost" className="w-full mt-3" onClick={saveLayering}>
                <Bookmark size={16} />
                {layerSaved ? 'Saved to Layering Lab!' : 'Save to Layering Lab'}
              </Button>
            </GlassCard>
          )}

          {result.backups.length > 0 && (
            <GlassCard className="!p-5" delay={0.14}>
              <p className="font-medium mb-3">Backup picks</p>
              <div className="space-y-2">
                {result.backups.map((b) => (
                  <div key={b.collectionId} className="flex justify-between items-center gap-3 text-sm">
                    <FragranceThumb
                      brand={b.fragrance.brand}
                      name={b.fragrance.name}
                      family={b.fragrance.family}
                      catalogImage={b.fragrance.image}
                      fragrance={b.fragrance}
                      size="sm"
                      className="w-12 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{b.fragrance.brand} {fragranceDisplayName(b.fragrance.name)}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">{b.fragrance.concentration} · {b.fragrance.family}</p>
                    </div>
                    <span className="text-[var(--color-accent)] text-xs font-semibold shrink-0">{Math.round(b.score)}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <GlassCard className="!p-5" delay={0.16} data-testid="advisor-why">
            <p className="font-medium mb-2">Why this bottle?</p>
            <p className="text-sm text-[var(--sc-text-soft)] mb-3">Recommended because:</p>
            <ul className="text-sm text-[var(--color-text-secondary)] space-y-1.5">
              {result.reasoning.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
            {result.primary.breakdown && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--sc-text-muted)]">
                <span>Occasion {result.primary.breakdown.occasion}</span>
                <span>Weather {result.primary.breakdown.weather}</span>
                <span>Dress {result.primary.breakdown.dress}</span>
                <span>Vibe {result.primary.breakdown.vibe}</span>
                <span>Rotation {result.primary.breakdown.rotation}</span>
                <span>Personal {result.primary.breakdown.personalBonus}</span>
              </div>
            )}
          </GlassCard>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={wear} haptic="success">Log today&apos;s wear</Button>
            <Button variant="ghost" className="px-4" onClick={shareResult} aria-label="Share recommendation">
              <Share2 size={16} />
            </Button>
          </div>
          {shareMsg && <p className="text-center text-xs text-[var(--color-accent)]">{shareMsg}</p>}
        </motion.div>
      )}

      {!result && !loading && (
        <GlassCard className="!p-6 text-center" delay={0.08}>
          <p className="text-headline text-sm">Your spray map is ready</p>
          <p className="text-subhead text-[var(--color-text-secondary)] mt-2 max-w-sm mx-auto leading-relaxed">
            {bodyVariantLabel(bodyVariant)} will guide each spray once you get a recommendation.
          </p>
        </GlassCard>
      )}

      <WearRatingModal
        open={ratingOpen}
        fragranceName={pendingWear?.name ?? ''}
        catalogImage={wearRatingImage}
        onSubmit={saveRating}
        onSkip={() => { setRatingOpen(false); setPendingWear(null); setWearRatingImage(null); }}
      />
    </div>
  );
}
