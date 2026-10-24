import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Briefcase, MapPin, Share2, UserRound } from 'lucide-react';
import { PageHeader, Ring, Section } from '@/components/kit';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { SprayBodyMap } from '@/components/advisor/SprayBodyMap';
import { useApp } from '@/context/AppContext';
import { defaultAdvisorInput, runAdvisor } from '@/engines/advisor';
import { logWear, updateWearRecord } from '@/db';
import type { AdvisorInput, AdvisorResult } from '@/types';
import { uid } from '@/lib/utils';
import { fragranceDisplayName } from '@/lib/fragranceName';
import { weatherUnavailableMessage } from '@/services/weather';
import { advisorToShareInput, downloadBlob, exportShareCardPng, shareWearCard } from '@/lib/shareCard';
import { saveAdvisorLayering } from '@/lib/layeringSave';
import { hapticSuccess } from '@/lib/premium/haptics';
import { hydrateAdvisorResult } from '@/services/seed';
import { bodyVariantLabel, genderToBodyVariant } from '@/lib/sprayZones';

const WearRatingModal = lazy(() =>
  import('@/components/ui/WearRatingModal').then((m) => ({ default: m.WearRatingModal })),
);

const FIELDS: { key: keyof AdvisorInput; label: string; options: { v: string; l: string }[] }[] = [
  {
    key: 'timeOfDay',
    label: 'Time',
    options: [
      { v: 'morning', l: 'Morning' },
      { v: 'afternoon', l: 'Afternoon' },
      { v: 'evening', l: 'Evening' },
      { v: 'night', l: 'Night' },
    ],
  },
  {
    key: 'occasion',
    label: 'Occasion',
    options: [
      { v: 'work', l: 'Work' },
      { v: 'casual', l: 'Casual' },
      { v: 'date', l: 'Date' },
      { v: 'event', l: 'Event' },
      { v: 'home', l: 'Home' },
    ],
  },
  {
    key: 'dressLevel',
    label: 'Dress',
    options: [
      { v: 'casual', l: 'Casual' },
      { v: 'smart_casual', l: 'Smart casual' },
      { v: 'semi_formal', l: 'Semi-formal' },
      { v: 'formal', l: 'Formal' },
      { v: 'professional', l: 'Professional' },
    ],
  },
  {
    key: 'vibe',
    label: 'Vibe',
    options: [
      { v: 'fresh', l: 'Fresh' },
      { v: 'warm', l: 'Warm' },
      { v: 'bold', l: 'Bold' },
      { v: 'subtle', l: 'Subtle' },
      { v: 'romantic', l: 'Romantic' },
      { v: 'confident', l: 'Confident' },
    ],
  },
];

export function AdvisorPage() {
  const { profile, prefs, collection, history, weather, weatherUnavailable, refresh } = useApp();
  const weatherNotice = !weather ? weatherUnavailableMessage(weatherUnavailable) : null;
  const bodyVariant = profile ? genderToBodyVariant(profile.gender) : 'neutral';

  const [input, setInput] = useState<AdvisorInput>(() => defaultAdvisorInput());
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [pendingWear, setPendingWear] = useState<{
    id: string;
    collectionId: string;
    fragranceId: string;
    name: string;
    sprays: number;
    wornAt: string;
  } | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [layerSaved, setLayerSaved] = useState(false);
  const [wearRatingImage, setWearRatingImage] = useState<string | null>(null);
  const pickSeq = useRef(0);

  const run = useCallback(async () => {
    if (!profile) return;
    const seq = ++pickSeq.current;
    setLoading(true);
    const r = await runAdvisor(collection, input, profile, prefs, weather, history);
    if (seq !== pickSeq.current) return;
    setLoading(false);
    if (!r) {
      setResult(null);
      return;
    }
    setResult(r);
    void hydrateAdvisorResult(r).then((next) => {
      if (seq !== pickSeq.current) return;
      setResult(next);
    });
  }, [profile, collection, input, prefs, weather, history]);

  useEffect(() => {
    // no auto-run — user taps Get recommendation
  }, []);

  if (!collection.length) {
    return (
      <EmptyState
        eyebrow="Advisor"
        title="Add bottles first"
        description="The Scent Advisor needs at least one bottle in your wardrobe to recommend a match."
        action={{ label: 'Add a bottle', to: '/add' }}
      />
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

  const shareResult = async () => {
    if (!result) return;
    const accent =
      getComputedStyle(document.body).getPropertyValue('--tint').trim() ||
      getComputedStyle(document.documentElement).getPropertyValue('--tint').trim() ||
      '#9a6a2f';
    try {
      const shareInput = advisorToShareInput(result);
      const outcome = await shareWearCard(shareInput, accent, { format: 'square' });
      const msg = outcome === 'shared' ? 'Shared' : outcome === 'copied' ? 'Copied to clipboard' : 'Saved as PNG';
      setShareMsg(msg);
      setTimeout(() => setShareMsg(null), 2500);
    } catch {
      const blob = await exportShareCardPng(advisorToShareInput(result), accent, { format: 'square' });
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
    <div className="ui-page">
      <PageHeader
        eyebrow="Smart Assistant"
        title="Scent Advisor"
        subtitle="Match wardrobe to moment — personal spray map."
      />

      {profile?.gender === 'prefer_not' && (
        <div className="ui-card flex gap-3 items-start mb-4">
          <UserRound size={18} className="text-[var(--tint)] shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold text-[var(--t-subhead)]">Set your profile for a tailored body map</p>
            <p className="ui-secondary text-[var(--t-footnote)] mt-1">We use anatomy based on your gender in Settings.</p>
            <Link to="/settings" className="ui-section-link mt-2">
              Update profile
            </Link>
          </div>
        </div>
      )}

      {weatherNotice && (
        <div className="ui-card flex gap-3 items-start mb-4">
          <MapPin size={18} className="text-[var(--label-3)] shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-semibold text-[var(--t-subhead)]">No weather data</p>
            <p className="ui-secondary text-[var(--t-footnote)] mt-1">{weatherNotice}</p>
            <Link to="/settings" className="ui-section-link mt-2">
              Set your city in Settings
            </Link>
          </div>
        </div>
      )}

      {prefs.officeSafeMode && (
        <div className="ui-card flex gap-3 items-start mb-4">
          <Briefcase size={18} className="text-[var(--tint)] shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-semibold text-[var(--t-subhead)]">Office Safe is on</p>
            <p className="ui-secondary text-[var(--t-footnote)] mt-1">
              Work and professional picks stay low-projection and desk-friendly.
            </p>
            <Link to="/settings" className="ui-section-link mt-2">
              Adjust in Settings
            </Link>
          </div>
        </div>
      )}

      <Section title="Your moment">
        <div className="ui-card space-y-5">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <p className="ui-footnote font-semibold mb-2">{field.label}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={field.label}>
                {field.options.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    className="ui-chip"
                    aria-pressed={input[field.key] === o.v}
                    onClick={() => setInput({ ...input, [field.key]: o.v })}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="ui-btn ui-btn--primary ui-btn--block"
            onClick={() => void run()}
            disabled={loading || !collection.length}
          >
            {loading ? 'Working…' : 'Get recommendation'}
          </button>
        </div>
      </Section>

      {loading && (
        <div className="ui-card mt-6 text-center py-10">
          <div className="ui-skeleton mx-auto mb-3 w-16 h-16 rounded-full" />
          <p className="ui-secondary">Finding a match…</p>
        </div>
      )}

      {result && !loading && (
        <div className="ui-rise space-y-4 mt-6">
          <div className="ui-card flex gap-4 items-center">
            <FragranceThumb fragrance={result.primary.fragrance} variant="plinth" size="md" className="w-20 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="ui-eyebrow">Primary pick</p>
              <h2 className="text-[var(--t-title3)] font-semibold mt-1 tracking-tight">{result.primary.fragrance.brand}</h2>
              <p className="serif text-[var(--t-body)] text-[var(--label-2)]">
                {fragranceDisplayName(result.primary.fragrance.name)}
              </p>
              <p className="ui-footnote mt-1">
                {result.primary.fragrance.concentration} · {result.primary.fragrance.family}
              </p>
            </div>
            <Ring value={result.fragranceScore} size={72} label={`Match ${Math.round(result.fragranceScore)}%`} />
          </div>

          <div className="ui-card">
            <SprayBodyMap
              bodyVariant={result.spray.bodyVariant ?? bodyVariant}
              activeZones={result.spray.activeZones ?? []}
              sprays={result.spray.totalSprays}
              isLayered={result.spray.isLayered}
              applicationSteps={result.spray.applicationSteps}
              techniqueNote={result.spray.techniqueNote}
            />
            <p className="ui-footnote mt-5 text-center">{result.spray.concentrationNote}</p>
            {result.spray.warnings.map((w) => (
              <p key={w} className="text-[var(--warning)] text-[var(--t-subhead)] mt-2 text-center">
                {w}
              </p>
            ))}
          </div>

          {result.layering && (
            <div className="ui-card space-y-3">
              <p className="font-semibold">Layering · {result.layering.compatibilityScore}% match</p>
              <p className="ui-secondary text-[var(--t-subhead)]">{result.layering.order}</p>
              {!result.spray.isLayered && (
                <div className="flex items-center gap-3">
                  <FragranceThumb fragrance={result.layering.secondary} variant="plinth" size="sm" className="w-12 shrink-0" />
                  <p className="text-[var(--t-subhead)] text-[var(--label-2)]">
                    + {result.layering.secondary.brand} {fragranceDisplayName(result.layering.secondary.name)}
                  </p>
                </div>
              )}
              <p className="ui-footnote">{result.layering.guidance}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--block" onClick={() => void saveLayering()}>
                <Bookmark size={16} aria-hidden />
                {layerSaved ? 'Saved to Layering Lab' : 'Save to Layering Lab'}
              </button>
            </div>
          )}

          {result.backups.length > 0 && (
            <Section title="Backup picks">
              <div className="ui-list">
                {result.backups.map((b) => (
                  <div key={b.collectionId} className="ui-row ui-row--media">
                    <FragranceThumb fragrance={b.fragrance} variant="plinth" size="sm" className="w-12 shrink-0" />
                    <div className="ui-row__main">
                      <p className="ui-row__title truncate">
                        {b.fragrance.brand} {fragranceDisplayName(b.fragrance.name)}
                      </p>
                      <p className="ui-row__sub">
                        {b.fragrance.concentration} · {b.fragrance.family}
                      </p>
                    </div>
                    <span className="ui-row__value text-[var(--tint)]">{Math.round(b.score)}%</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div className="ui-card" data-testid="advisor-why">
            <p className="font-semibold mb-2">Why this bottle?</p>
            <ul className="text-[var(--t-subhead)] text-[var(--label-2)] space-y-1.5">
              {result.reasoning.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
            {result.primary.breakdown && (
              <div className="mt-4 grid grid-cols-2 gap-2 ui-footnote">
                <span>Occasion {result.primary.breakdown.occasion}</span>
                <span>Weather {result.primary.breakdown.weather}</span>
                <span>Dress {result.primary.breakdown.dress}</span>
                <span>Vibe {result.primary.breakdown.vibe}</span>
                <span>Rotation {result.primary.breakdown.rotation}</span>
                <span>Personal {result.primary.breakdown.personalBonus}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" className="ui-btn ui-btn--primary flex-1" onClick={() => void wear()}>
              Log today&apos;s wear
            </button>
            <button type="button" className="ui-icon-btn" onClick={() => void shareResult()} aria-label="Share recommendation">
              <Share2 size={18} aria-hidden />
            </button>
          </div>
          {shareMsg && <p className="text-center ui-footnote text-[var(--tint)]">{shareMsg}</p>}
        </div>
      )}

      {!result && !loading && (
        <div className="ui-card mt-6 text-center py-8">
          <p className="font-semibold text-[var(--t-subhead)]">Your spray map is ready</p>
          <p className="ui-secondary mt-2 max-w-sm mx-auto text-[var(--t-subhead)]">
            {bodyVariantLabel(bodyVariant)} will guide each spray once you get a recommendation.
          </p>
        </div>
      )}

      <Suspense fallback={null}>
        <WearRatingModal
          open={ratingOpen}
          fragranceName={pendingWear?.name ?? ''}
          catalogImage={wearRatingImage}
          onSubmit={saveRating}
          onSkip={() => {
            setRatingOpen(false);
            setPendingWear(null);
            setWearRatingImage(null);
          }}
        />
      </Suspense>
    </div>
  );
}
