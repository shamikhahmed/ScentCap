import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Cloud, Droplets, Flame, Layers, Sparkles, Sun, Wind, ChevronRight, MapPin, Briefcase, AlertCircle,
} from 'lucide-react';
import { PressableLink } from '@/components/ui/PressableScale';
import { LoadingCard } from '@/components/ui/LoadingCard';
import { HOME_LOADING_MESSAGES } from '@/components/ui/CyclingShimmerText';
import { useApp } from '@/context/AppContext';
import { runAdvisor } from '@/engines/advisor';
import { getFragrance, getPhoto, logWear, updateWearRecord } from '@/db';
import type { AdvisorInput, AdvisorResult, Fragrance } from '@/types';
import { WearRatingModal } from '@/components/ui/WearRatingModal';
import { HeroPick } from '@/components/premium/HeroPick';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { StatPill } from '@/components/premium/StatPill';
import { GlassCard } from '@/components/premium/GlassCard';
import { timeGreeting, scentMood } from '@/lib/greetings';
import { CapKineticHeadline } from '@/components/premium/CapKineticHeadline';
import { FAMILY_COLORS, rotationHealth, wearStreak, wearsThisMonth, daysSinceWear } from '@/lib/stats';
import { weatherUnavailableMessage } from '@/services/weather';
import { uid } from '@/lib/utils';
import { advisorToShareInput, downloadBlob, exportShareCardPng, shareWearCard } from '@/lib/shareCard';
import { saveAdvisorLayering } from '@/lib/layeringSave';
import { loadDemoData } from '@/services/demo';
import { EmptyState } from '@/components/ui/EmptyState';
import { hapticSuccess, hapticLight } from '@/lib/premium/haptics';
import { enrichFragranceImages, hydrateAdvisorResult, enrichFragranceOnce } from '@/services/seed';
import {
  MOOD_PRESETS,
  initialAdvisorInput,
  advisorInputFromPreset,
  moodLabel,
  type MoodPreset,
} from '@/lib/advisorPresets';

const WEATHER_ICON: Record<string, typeof Sun> = {
  hot: Sun, clear: Sun, cold: Wind, rain: Cloud, cloudy: Cloud, windy: Wind, snow: Cloud,
};

export function Home() {
  const { profile, prefs, collection, history, weather, weatherUnavailable, refresh } = useApp();
  const navigate = useNavigate();
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [advisorInput, setAdvisorInput] = useState<AdvisorInput>(() => initialAdvisorInput());
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [pendingWear, setPendingWear] = useState<{ id: string; name: string; wornAt: string } | null>(null);
  const [neglectedDetails, setNeglectedDetails] = useState<{ id: string; f: Fragrance; days: number | null }[]>([]);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [layerSaved, setLayerSaved] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [heroPhotoUrl, setHeroPhotoUrl] = useState<string | null>(null);
  const [wearRatingImage, setWearRatingImage] = useState<string | null>(null);

  const greeting = timeGreeting();
  const streak = wearStreak(history);
  const monthWears = wearsThisMonth(history);
  const rotation = rotationHealth(collection, history);
  const mood = scentMood(weather);
  const rotationLow = rotation < 50 && collection.length >= 3;

  const runPick = useCallback(async (input: AdvisorInput) => {
    if (!profile || !collection.length) return;
    setLoading(true);
    setLogged(false);
    setLayerSaved(false);
    setShareMsg(null);
    const raw = await runAdvisor(collection, input, profile, prefs, weather, history);
    setLoading(false);
    if (!raw) {
      setResult(null);
      return;
    }
    setResult(raw);
    void hydrateAdvisorResult(raw).then(setResult);
  }, [profile, collection, prefs, weather, history]);

  useEffect(() => {
    if (!profile || !collection.length) {
      setLoading(false);
      return;
    }
    const input = initialAdvisorInput(profile);
    setAdvisorInput(input);
    setActivePresetId(null);
    void runPick(input);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on wardrobe/weather, not every wear log
  }, [profile, collection, prefs, weather]);

  const applyPreset = (preset: MoodPreset) => {
    hapticLight();
    const input = advisorInputFromPreset(preset);
    setAdvisorInput(input);
    setActivePresetId(preset.id);
    void runPick(input);
  };

  useEffect(() => {
    let cancelled = false;
    void enrichFragranceImages(collection.map((c) => c.fragranceId)).then(() => {
      if (cancelled) return;
      setResult((prev) => {
        if (!prev) return prev;
        void hydrateAdvisorResult(prev).then((next) => {
          if (!cancelled) setResult(next);
        });
        return prev;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [collection]);

  useEffect(() => {
    if (!result || (result.primary.fragrance.image && !result.primary.fragrance.image.includes('perfume-nobg'))) return;
    let cancelled = false;
    void enrichFragranceOnce(result.primary.fragrance).then((primary) => {
      if (cancelled) return;
      if (primary.image && primary.image !== result.primary.fragrance.image) {
        setResult((prev) =>
          prev ? { ...prev, primary: { ...prev.primary, fragrance: primary } } : prev,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [result?.primary.fragrance.id, result?.primary.fragrance.image]);

  useEffect(() => {
    if (!result) {
      setHeroPhotoUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | undefined;
    (async () => {
      const colItem = collection.find((c) => c.id === result.primary.collectionId);
      if (colItem?.photoBlobId) {
        const blob = await getPhoto(colItem.photoBlobId);
        if (cancelled) return;
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setHeroPhotoUrl(objectUrl);
          return;
        }
      }
      if (!cancelled) setHeroPhotoUrl(null);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [result, collection]);

  const neglected = useMemo(() =>
    collection
      .map((c) => ({ c, days: daysSinceWear(c.fragranceId, history) }))
      .filter((x) => x.days === null || x.days > 21)
      .slice(0, 6),
  [collection, history]);

  useEffect(() => {
    Promise.all(
      neglected.map(async ({ c, days }) => {
        let f = await getFragrance(c.fragranceId);
        if (f && !f.image) f = await enrichFragranceOnce(f);
        return f ? { id: c.id, f, days } : null;
      }),
    ).then((rows) => setNeglectedDetails(rows.filter(Boolean) as { id: string; f: Fragrance; days: number | null }[]));
  }, [neglected]);

  const wearToday = async () => {
    if (!result) return;
    const wearId = uid();
    const wornAt = new Date().toISOString();
    await logWear({
      id: wearId,
      collectionId: result.primary.collectionId,
      fragranceId: result.primary.fragrance.id,
      wornAt,
      sprays: result.spray.totalSprays,
      weatherTempC: weather?.tempC,
      weatherHumidity: weather?.humidity,
      weatherCondition: weather?.condition,
      zones: result.spray.pulsePoints?.slice(0, 6),
    });
    await refresh();
    hapticSuccess();
    setLogged(true);
    void runPick(advisorInput);
    setPendingWear({
      id: wearId,
      name: `${result.primary.fragrance.brand} ${result.primary.fragrance.name}`,
      wornAt,
    });
    setWearRatingImage(result.primary.fragrance.image ?? null);
    setRatingOpen(true);
    setTimeout(() => setLogged(false), 2500);
  };

  const shareToday = async () => {
    if (!result) return;
    try {
      const input = advisorToShareInput(result);
      const outcome = await shareWearCard(input, familyColor, { format: 'square' });
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

  const saveRating = async (rating: number, compliment: boolean, notes?: string) => {
    if (!pendingWear || !result) return;
    await updateWearRecord({
      id: pendingWear.id,
      collectionId: result.primary.collectionId,
      fragranceId: result.primary.fragrance.id,
      wornAt: pendingWear.wornAt,
      sprays: result.spray.totalSprays,
      rating,
      compliment,
      notes,
    });
    await refresh();
    setRatingOpen(false);
    setPendingWear(null);
  };

  const familyColor = result
    ? FAMILY_COLORS[result.primary.fragrance.family] ?? '#0a84ff'
    : '#0a84ff';

  const WIcon = weather ? (WEATHER_ICON[weather.condition] ?? Cloud) : Cloud;
  const weatherNotice = !weather ? weatherUnavailableMessage(weatherUnavailable) : null;

  const tryDemo = async () => {
    setLoadingDemo(true);
    try {
      await loadDemoData();
      await refresh();
      navigate('/');
    } finally {
      setLoadingDemo(false);
    }
  };

  if (!collection.length) {
    return (
      <EmptyState
        eyebrow="ScentCap"
        title="Your wardrobe awaits"
        description="Add the bottles you own. Every morning, ScentCap tells you exactly what to wear."
        action={{ label: 'Add first bottle', to: '/add' }}
        secondary={{ label: 'Try demo collection', onClick: tryDemo, loading: loadingDemo }}
      />
    );
  }

  return (
    <div className="home-blotter relative pb-10">
      <div className="home-blotter__strip" aria-hidden="true" />
      {history.length === 0 && (
        <div className="home-blotter-coach">
          <p className="text-sm font-semibold tracking-tight">Start here</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
            Tap <span className="text-[var(--color-accent)] font-semibold">Wear this today</span> on your pick,
            or open Collection to browse bottles. Advisor retunes picks by mood and weather.
          </p>
        </div>
      )}
      <div className="home-blotter-layout">
        <aside className="home-blotter-rail home-blotter-rail--tools" aria-label="Counter tools">
          <p className="home-blotter-rail__label">Counter</p>
          <section className="px-5 md:px-0 pt-3 pb-1 home-blotter-greeting">
            <div className="flex items-start justify-between gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <p className="text-subhead text-[var(--color-text-secondary)]">{greeting.line}</p>
                <h1 className="text-display mt-1.5">
                  <CapKineticHeadline lines={[mood]} gradient />
                </h1>
                {prefs.officeSafeMode && (
                  <span className="inline-flex items-center gap-1.5 mt-3 text-caption text-[var(--color-accent)] bg-[var(--color-accent-muted)] px-2.5 py-1 rounded-full">
                    <Briefcase size={11} /> Office Safe
                  </span>
                )}
              </motion.div>
              {weather && (
                <motion.div
                  className="weather-chip-premium shrink-0 home-blotter-weather-chip"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <WIcon size={18} className="text-[var(--color-accent)]" strokeWidth={2} />
                  <span className="text-base font-semibold tabular-nums tracking-tight">{Math.round(weather.tempC)}°</span>
                </motion.div>
              )}
            </div>
          </section>

          {rotationLow && (
            <section className="px-5 md:px-0 mt-4">
              <GlassCard className="flex items-start gap-3 !p-4 border-orange-500/20" glow="rgba(255,159,10,0.12)">
                <AlertCircle size={18} className="text-orange-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-headline text-sm">Rotation at {rotation}%</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    Try a neglected bottle below — {collection.length - Math.round((rotation / 100) * collection.length)} haven&apos;t been worn yet.
                  </p>
                </div>
                <PressableLink to="/collection" className="text-xs text-[var(--color-accent)] font-semibold shrink-0">
                  View
                </PressableLink>
              </GlassCard>
            </section>
          )}

          <div className="px-5 md:px-0 flex gap-2.5 overflow-x-auto py-5 scrollbar-none home-blotter-stats">
            <StatPill icon={<Droplets size={15} strokeWidth={2} />} label="Bottles" value={String(collection.length)} to="/collection" delay={0.05} />
            <StatPill icon={<Flame size={15} strokeWidth={2} />} label="Streak" value={`${streak}d`} tone={streak > 0 ? 'hot' : 'default'} to="/calendar" delay={0.1} />
            <StatPill icon={<Sparkles size={15} strokeWidth={2} />} label="Month" value={String(monthWears)} to="/calendar" delay={0.15} />
            <StatPill icon={<Layers size={15} strokeWidth={2} />} label="Rotation" value={`${rotation}%`} tone={rotationLow ? 'warn' : rotation >= 70 ? 'good' : 'default'} to="/analytics" delay={0.2} />
          </div>

          <section className="px-5 md:px-0 mt-4 home-blotter-moods">
            <div className="flex items-center justify-between mb-3">
              <p className="text-caption text-[var(--color-text-tertiary)]">One-tap mood</p>
              {activePresetId && (
                <span className="text-[11px] font-semibold text-[var(--color-accent)]">
                  {moodLabel(advisorInput)} · re-scored
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 home-blotter-mood-grid">
              {MOOD_PRESETS.map((p) => {
                const Icon = p.Icon;
                return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`tile-premium flex flex-col items-center gap-2 !py-4 text-center pressable transition-all ${
                    activePresetId === p.id ? 'ring-2 ring-[var(--color-accent)]/60 bg-[var(--color-accent-muted)]/30' : ''
                  }`}
                >
                  <Icon size={22} strokeWidth={1.75} className="text-[var(--color-accent)]" aria-hidden />
                  <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">{p.label}</span>
                </button>
                );
              })}
            </div>
          </section>
        </aside>

        <div className="home-blotter-main px-5 md:px-0">
          <p className="home-blotter-main__label">Today&apos;s blotter</p>
          {loading ? (
            <LoadingCard messages={HOME_LOADING_MESSAGES} />
          ) : result ? (
            <HeroPick
              result={result}
              familyColor={familyColor}
              logged={logged}
              layerSaved={layerSaved}
              shareMsg={shareMsg}
              photoUrl={heroPhotoUrl}
              moodLabel={moodLabel(advisorInput)}
              onWear={wearToday}
              onShare={shareToday}
              onSaveLayer={saveLayering}
            />
          ) : (
            <GlassCard className="text-center !py-10">
              <p className="text-headline">No match today</p>
              <p className="text-subhead text-[var(--color-text-secondary)] mt-2 max-w-xs mx-auto">
                {prefs.officeSafeMode ? 'Office Safe may be limiting picks.' : 'Customize occasion and vibe in Advisor.'}
              </p>
              <PressableLink to="/advisor" className="inline-flex mt-6 btn-glow text-white rounded-2xl px-8 py-3.5 font-semibold text-sm">
                Open Advisor
              </PressableLink>
            </GlassCard>
          )}

          {result && result.backups.length > 0 && (
            <div className="mt-5">
              <p className="text-caption text-[var(--color-text-tertiary)] mb-2.5 px-0.5">Backup picks</p>
              <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
                {result.backups.slice(0, 3).map((b) => (
                  <PressableLink key={b.collectionId} to={`/fragrance/${b.collectionId}`} className="shrink-0 min-w-[148px]">
                    <div className="tile-premium !py-3 !px-4">
                      <FragranceThumb
                        brand={b.fragrance.brand}
                        name={b.fragrance.name}
                        family={b.fragrance.family}
                        catalogImage={b.fragrance.image}
                        fragrance={b.fragrance}
                        size="sm"
                        className="mb-2.5 w-full"
                      />
                      <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">{b.fragrance.brand}</p>
                      <p className="text-sm font-semibold truncate tracking-tight">{b.fragrance.name}</p>
                      <p className="text-xs font-semibold text-[var(--color-accent)] mt-1.5">{Math.round(b.score)}% match</p>
                    </div>
                  </PressableLink>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="home-blotter-rail home-blotter-rail--ledger" aria-label="Wear ledger">
          <p className="home-blotter-rail__label">Ledger</p>

          {neglectedDetails.length > 0 && (
            <section className="mt-8 md:mt-0">
              <div className="px-5 md:px-0 flex items-end justify-between mb-3">
                <div>
                  <p className="text-caption text-[var(--color-text-tertiary)]">Needs attention</p>
                  <p className="text-subhead text-[var(--color-text-secondary)] mt-1">
                    {neglectedDetails.length} not worn in 3+ weeks
                  </p>
                </div>
                <PressableLink to="/collection" className="text-xs text-[var(--color-accent)] font-semibold flex items-center gap-0.5">
                  All <ChevronRight size={14} />
                </PressableLink>
              </div>
              <div className="flex gap-3 overflow-x-auto px-5 md:px-0 pb-2 scrollbar-none home-blotter-neglected">
                {neglectedDetails.map((n, i) => (
                  <PressableLink key={n.id} to={`/fragrance/${n.id}`} className="shrink-0 w-[156px] md:w-full">
                    <motion.div
                      className="tile-premium h-full"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <FragranceThumb
                        brand={n.f.brand}
                        name={n.f.name}
                        family={n.f.family}
                        catalogImage={n.f.image}
                        fragrance={n.f}
                        size="sm"
                        className="mb-3 w-full"
                      />
                      <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">{n.f.brand}</p>
                      <p className="text-sm font-semibold truncate tracking-tight">{n.f.name}</p>
                      <p className="text-[11px] font-semibold text-orange-400 mt-2">
                        {n.days === null ? 'Never worn' : `${n.days}d ago`}
                      </p>
                    </motion.div>
                  </PressableLink>
                ))}
              </div>
            </section>
          )}

          {weather ? (
            <section className="px-5 md:px-0 mt-8 md:mt-5">
              <GlassCard className="flex items-center gap-4 !p-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-muted)] flex items-center justify-center shrink-0">
                  <WIcon className="text-[var(--color-accent)]" size={22} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold capitalize tracking-tight">{weather.condition}</p>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                    {profile?.cityLabel ?? 'Local'} · {weather.tempC}° · {weather.humidity}% humidity
                  </p>
                </div>
                <PressableLink to="/layering" className="text-[var(--color-accent)] text-sm font-semibold shrink-0">Layer</PressableLink>
              </GlassCard>
            </section>
          ) : weatherNotice ? (
            <section className="px-5 md:px-0 mt-8 md:mt-5">
              <GlassCard className="flex items-start gap-3 !p-4">
                <MapPin className="text-[var(--color-text-secondary)] shrink-0 mt-0.5" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-headline text-sm">Weather unavailable</p>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">{weatherNotice}</p>
                  <PressableLink to="/settings" className="inline-block text-[var(--color-accent)] text-sm font-semibold mt-2">
                    Add your city in Settings
                  </PressableLink>
                </div>
              </GlassCard>
            </section>
          ) : null}

          {history.length > 0 && (
            <section className="px-5 md:px-0 mt-10 md:mt-5">
              <p className="text-caption text-[var(--color-text-tertiary)] mb-3">Recent wears</p>
              <RecentWears history={history.slice(-4).reverse()} collection={collection} />
            </section>
          )}

          <section className="px-5 md:px-0 mt-8 md:mt-5 grid grid-cols-2 gap-3">
            <PressableLink to="/analytics">
              <div className="tile-premium h-full">
                <p className="text-headline text-sm">Analytics</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Value & rotation</p>
              </div>
            </PressableLink>
            <PressableLink to="/calendar">
              <div className="tile-premium h-full">
                <p className="text-headline text-sm">Calendar</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Wear patterns</p>
              </div>
            </PressableLink>
          </section>
        </aside>
      </div>

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

function RecentWears({
  history,
  collection,
}: {
  history: { id: string; fragranceId: string; wornAt: string }[];
  collection: { id: string; fragranceId: string }[];
}) {
  const [rows, setRows] = useState<{ id: string; name: string; wornAt: string; collectionId?: string; f?: Fragrance }[]>([]);

  useEffect(() => {
    Promise.all(history.map(async (h) => {
      const f = await getFragrance(h.fragranceId);
      const c = collection.find((x) => x.fragranceId === h.fragranceId);
      return {
        id: h.id,
        name: f ? `${f.brand} ${f.name}` : '…',
        wornAt: h.wornAt,
        collectionId: c?.id,
        f,
      };
    })).then(setRows);
  }, [history, collection]);

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const inner = (
          <>
            <FragranceThumb
              brand={row.f?.brand}
              name={row.f?.name}
              family={row.f?.family}
              catalogImage={row.f?.image}
              fragrance={row.f}
              size="sm"
              className="w-12 shrink-0"
            />
            <span className="truncate pr-4 flex-1 text-sm">{row.name}</span>
            <span className="text-[var(--color-text-tertiary)] shrink-0 text-xs">
              {new Date(row.wornAt).toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
          </>
        );
        return row.collectionId ? (
          <PressableLink
            key={row.id}
            to={`/fragrance/${row.collectionId}`}
            className="flex items-center gap-3 tile-premium !py-3 !px-4"
          >
            {inner}
          </PressableLink>
        ) : (
          <div key={row.id} className="flex items-center gap-3 tile-premium !py-3 !px-4 text-sm">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
