import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { timeGreeting } from '@/lib/greetings';
import { FAMILY_COLORS, rotationHealth, wearStreak, wearsThisMonth, daysSinceWear } from '@/lib/stats';
import { weatherUnavailableMessage } from '@/services/weather';
import { uid } from '@/lib/utils';
import { fragranceDisplayName } from '@/services/onlineCatalog';
import { advisorToShareInput, downloadBlob, exportShareCardPng, shareWearCard } from '@/lib/shareCard';
import { loadDemoData } from '@/services/demo';
import { EmptyState } from '@/components/ui/EmptyState';
import { hapticSuccess, hapticLight } from '@/lib/premium/haptics';
import { enrichFragranceImages, hydrateAdvisorResult, enrichFragranceOnce } from '@/services/seed';
import { needsCatalogImageRefresh } from '@/lib/catalogImage';
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
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [heroPhotoUrl, setHeroPhotoUrl] = useState<string | null>(null);
  const [wearRatingImage, setWearRatingImage] = useState<string | null>(null);

  const greeting = timeGreeting();
  const streak = wearStreak(history);
  const monthWears = wearsThisMonth(history);
  const rotation = rotationHealth(collection, history);
  const rotationLow = rotation < 50 && collection.length >= 3;

  const runPick = useCallback(async (input: AdvisorInput) => {
    if (!profile || !collection.length) return;
    setLoading(true);
    setLogged(false);
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
    if (!result || !needsCatalogImageRefresh(result.primary.fragrance.image, result.primary.fragrance.catalogSlug)) return;
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
        if (f && needsCatalogImageRefresh(f.image, f.catalogSlug)) f = await enrichFragranceOnce(f);
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
    ? FAMILY_COLORS[result.primary.fragrance.family] ?? 'var(--sc-accent)'
    : 'var(--sc-accent)';

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
    <div className="home-atelier">
      <header className="museum-topbar">
        <div className="min-w-0">
          <p className="home-atelier__brand">ScentCap</p>
          <p className="museum-topbar__sub">
            {greeting.line}
            {weather ? ` · ${Math.round(weather.tempC)}°` : ''}
          </p>
          {prefs.officeSafeMode && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-[var(--sc-accent)] bg-[var(--sc-accent-soft)] px-2.5 py-1 rounded-lg">
              <Briefcase size={12} /> Office Safe
            </span>
          )}
        </div>
        {weather && (
          <div className="shrink-0 rounded-xl border border-[var(--sc-border-soft)] bg-[var(--sc-panel)] px-2.5 py-1.5 flex items-center gap-1.5">
            <WIcon size={14} className="text-[var(--sc-accent)]" strokeWidth={2} />
            <span className="text-sm font-semibold tabular-nums">{Math.round(weather.tempC)}°</span>
          </div>
        )}
      </header>

      {history.length === 0 && (
        <div className="home-atelier__coach">
          <p className="text-sm font-semibold tracking-tight">Start here</p>
          <p className="text-xs text-[var(--sc-text-soft)] mt-1 leading-relaxed">
            Tap <span className="font-semibold text-[var(--sc-accent)]">Wear this today</span> — or open Bottles.
          </p>
        </div>
      )}

      {rotationLow && (
        <div className="mt-3 rounded-2xl border border-orange-500/25 bg-orange-500/10 p-3.5 flex items-start gap-3">
          <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Rotation at {rotation}%</p>
            <p className="text-xs text-[var(--sc-text-soft)] mt-1 leading-relaxed">
              Try a neglected bottle.
            </p>
          </div>
          <PressableLink to="/collection" className="text-xs text-[var(--sc-accent)] font-semibold shrink-0">
            View
          </PressableLink>
        </div>
      )}

      {loading ? (
        <LoadingCard messages={HOME_LOADING_MESSAGES} />
      ) : result ? (
        <HeroPick
          result={result}
          familyColor={familyColor}
          logged={logged}
          shareMsg={shareMsg}
          photoUrl={heroPhotoUrl}
          moodLabel={moodLabel(advisorInput)}
          onWear={wearToday}
          onShare={shareToday}
        />
      ) : (
        <div className="rounded-2xl border border-[var(--sc-border-soft)] bg-[var(--sc-panel)] text-center py-10 px-5 mt-4">
          <p className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>No match today</p>
          <p className="text-sm text-[var(--sc-text-soft)] mt-2 max-w-xs mx-auto">
            {prefs.officeSafeMode ? 'Office Safe may be limiting picks.' : 'Customize occasion in Advisor.'}
          </p>
          <PressableLink to="/advisor" className="inline-flex mt-6 btn-glow rounded-xl px-8 py-3.5 font-semibold text-sm">
            Open Advisor
          </PressableLink>
        </div>
      )}

      {result && result.reasoning[0] && (
        <p className="museum-why mt-5 text-sm text-[var(--sc-text-soft)] leading-relaxed">
          {result.reasoning[0]}
        </p>
      )}

      <p className="home-atelier__section-label">Mood</p>
      <div className="home-atelier__moods">
        {MOOD_PRESETS.map((p) => {
          const Icon = p.Icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-2xl border px-2 py-3 flex flex-col items-center gap-1.5 text-center transition-colors ${
                activePresetId === p.id
                  ? 'border-[var(--sc-accent)] bg-[var(--sc-accent-soft)]'
                  : 'border-[var(--sc-border-soft)] bg-[var(--sc-panel)]'
              }`}
            >
              <Icon size={18} strokeWidth={1.85} className="text-[var(--sc-accent)]" aria-hidden />
              <span className="text-[11px] font-semibold text-[var(--sc-text-soft)]">{p.label}</span>
            </button>
          );
        })}
      </div>

      <div className="home-atelier__stats">
        <StatPill icon={<Droplets size={15} strokeWidth={2} />} label="Bottles" value={String(collection.length)} to="/collection" delay={0.05} />
        <StatPill icon={<Flame size={15} strokeWidth={2} />} label="Streak" value={`${streak}d`} tone={streak > 0 ? 'hot' : 'default'} to="/calendar" delay={0.1} />
        <StatPill icon={<Sparkles size={15} strokeWidth={2} />} label="Month" value={String(monthWears)} to="/calendar" delay={0.15} />
        <StatPill icon={<Layers size={15} strokeWidth={2} />} label="Rotation" value={`${rotation}%`} tone={rotationLow ? 'warn' : rotation >= 70 ? 'good' : 'default'} to="/analytics" delay={0.2} />
      </div>

      {result && result.backups.length > 0 && (
        <div className="mt-5">
          <p className="home-atelier__section-label !mt-0">Backup picks</p>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
            {result.backups.slice(0, 3).map((b) => (
              <PressableLink key={b.collectionId} to={`/fragrance/${b.collectionId}`} className="shrink-0 min-w-[140px]">
                <div className="rounded-2xl border border-[var(--sc-border-soft)] bg-[var(--sc-panel)] p-3">
                  <FragranceThumb
                    brand={b.fragrance.brand}
                    name={b.fragrance.name}
                    family={b.fragrance.family}
                    catalogImage={b.fragrance.image}
                    fragrance={b.fragrance}
                    size="sm"
                    className="mb-2.5 w-full"
                  />
                  <p className="text-[10px] text-[var(--sc-text-muted)] truncate">{b.fragrance.brand}</p>
                  <p className="text-sm font-semibold truncate tracking-tight">{fragranceDisplayName(b.fragrance.name)}</p>
                  <p className="text-xs font-semibold text-[var(--sc-accent)] mt-1">{Math.round(b.score)}%</p>
                </div>
              </PressableLink>
            ))}
          </div>
        </div>
      )}

      {neglectedDetails.length > 0 && (
        <section className="mt-2">
          <div className="flex items-end justify-between">
            <p className="home-atelier__section-label !mt-4">Needs attention</p>
            <PressableLink to="/collection" className="text-xs text-[var(--sc-accent)] font-semibold flex items-center gap-0.5 mb-2">
              All <ChevronRight size={14} />
            </PressableLink>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {neglectedDetails.map((n) => (
              <PressableLink key={n.id} to={`/fragrance/${n.id}`} className="shrink-0 w-[148px]">
                <div className="rounded-2xl border border-[var(--sc-border-soft)] bg-[var(--sc-panel)] p-3 h-full">
                  <FragranceThumb
                    brand={n.f.brand}
                    name={n.f.name}
                    family={n.f.family}
                    catalogImage={n.f.image}
                    fragrance={n.f}
                    size="sm"
                    className="mb-3 w-full"
                  />
                  <p className="text-[10px] text-[var(--sc-text-muted)] truncate">{n.f.brand}</p>
                  <p className="text-sm font-semibold truncate">{fragranceDisplayName(n.f.name)}</p>
                  <p className="text-[11px] font-semibold text-orange-500 mt-2">
                    {n.days === null ? 'Never worn' : `${n.days}d ago`}
                  </p>
                </div>
              </PressableLink>
            ))}
          </div>
        </section>
      )}

      {weatherNotice && !weather && (
        <div className="mt-6 rounded-2xl border border-[var(--sc-border-soft)] bg-[var(--sc-panel)] p-4 flex items-start gap-3">
          <MapPin className="text-[var(--sc-text-muted)] shrink-0 mt-0.5" size={18} />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Weather unavailable</p>
            <p className="text-sm text-[var(--sc-text-soft)] mt-1 leading-relaxed">{weatherNotice}</p>
            <PressableLink to="/settings" className="inline-block text-[var(--sc-accent)] text-sm font-semibold mt-2">
              Add city in Settings
            </PressableLink>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <section className="mt-2">
          <p className="home-atelier__section-label">Recent wears</p>
          <RecentWears history={history.slice(-4).reverse()} collection={collection} />
        </section>
      )}

      <section className="mt-6 grid grid-cols-2 gap-3">
        <PressableLink to="/analytics" className="rounded-2xl border border-[var(--sc-border-soft)] bg-[var(--sc-panel)] p-4">
          <p className="text-sm font-semibold">Analytics</p>
          <p className="text-xs text-[var(--sc-text-muted)] mt-1">Value & rotation</p>
        </PressableLink>
        <PressableLink to="/layering" className="rounded-2xl border border-[var(--sc-border-soft)] bg-[var(--sc-panel)] p-4">
          <p className="text-sm font-semibold">Layering</p>
          <p className="text-xs text-[var(--sc-text-muted)] mt-1">Pair bottles</p>
        </PressableLink>
      </section>

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
        name: f ? `${f.brand} ${fragranceDisplayName(f.name)}` : '…',
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
