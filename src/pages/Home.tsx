import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, BarChart3, Briefcase, CalendarDays, ChevronRight, Cloud, Flame, Layers, LayoutGrid, Luggage,
  MapPin, Plus, RefreshCw, Sparkles, Sun, Wind,
} from 'lucide-react';
import { PressableLink } from '@/components/ui/PressableScale';
import { useApp } from '@/context/AppContext';
import { runAdvisor } from '@/engines/advisor';
import { getFragrance, getPhoto, logWear, updateWearRecord } from '@/db';
import type { AdvisorInput, AdvisorResult, Fragrance } from '@/types';
import { HeroPick } from '@/components/premium/HeroPick';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { BottleCard, PageHeader, Section } from '@/components/kit';
import { timeGreeting } from '@/lib/greetings';
import { FAMILY_COLORS, rotationHealth, wearStreak, wearsThisMonth, daysSinceWear } from '@/lib/stats';
import { weatherUnavailableMessage } from '@/services/weather';
import { uid } from '@/lib/utils';
import { fragranceDisplayName } from '@/lib/fragranceName';
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

const WearRatingModal = lazy(() =>
  import('@/components/ui/WearRatingModal').then((m) => ({ default: m.WearRatingModal })),
);

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
  const pickSeq = useRef(0);
  const resultRef = useRef<AdvisorResult | null>(null);

  const greeting = timeGreeting();
  const streak = wearStreak(history);
  const monthWears = wearsThisMonth(history);
  const rotation = rotationHealth(collection, history);
  const rotationLow = rotation < 50 && collection.length >= 3;

  const runPick = useCallback(async (input: AdvisorInput) => {
    if (!profile || !collection.length) return;
    const seq = ++pickSeq.current;
    // Only show the skeleton on first load; re-scoring after an action keeps the current card (no layout jump).
    setLoading((prevLoading) => prevLoading && !resultRef.current);
    setLogged(false);
    setShareMsg(null);
    const raw = await runAdvisor(collection, input, profile, prefs, weather, history);
    if (seq !== pickSeq.current) return;
    setLoading(false);
    if (!raw) {
      setResult(null);
      return;
    }
    setResult(raw);
    resultRef.current = raw;
    void hydrateAdvisorResult(raw).then((next) => {
      if (seq !== pickSeq.current) return;
      setResult(next);
    });
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
  }, [profile, collection, prefs, weather, runPick]);

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
    const { advisorToShareInput, downloadBlob, exportShareCardPng, shareWearCard } = await import('@/lib/shareCard');
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
        eyebrow="Welcome to ScentCap"
        title="Build your fragrance wardrobe"
        description="Add the bottles you own. Each morning ScentCap picks the right one for the weather, the plan and your mood."
        action={{ label: 'Add your first bottle', to: '/add' }}
        secondary={{ label: 'Explore a sample wardrobe', onClick: tryDemo, loading: loadingDemo }}
      />
    );
  }

  const dateLine = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="ui-page">
      <PageHeader
        eyebrow={dateLine}
        title={greeting.line}
        trailing={
          <>
            {weather && (
              <span
                className="ui-chip !cursor-default !bg-[var(--surface)] !shadow-[var(--shadow-1)]"
                aria-label={`${Math.round(weather.tempC)} degrees, ${weather.condition}`}
              >
                <WIcon size={16} className="text-[var(--tint)]" aria-hidden />
                <span className="tabular-nums font-semibold">{Math.round(weather.tempC)}°</span>
              </span>
            )}
            <PressableLink to="/add" className="ui-icon-btn ui-icon-btn--tint md:!hidden" aria-label="Add fragrance">
              <Plus size={20} strokeWidth={2.6} aria-hidden />
            </PressableLink>
          </>
        }
      />

      <div className="ui-segmented mb-4" role="group" aria-label="Occasion">
        {MOOD_PRESETS.map((p) => (
          <button key={p.id} type="button" aria-pressed={activePresetId === p.id} onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>

      {prefs.officeSafeMode && (
        <p className="ui-footnote mb-3 flex items-center gap-1.5">
          <Briefcase size={13} aria-hidden /> Office Safe is on — loud scents are held back.
        </p>
      )}

      {loading ? (
        <div className="ui-card ui-card--lg grid lg:grid-cols-2 gap-5" aria-busy="true" aria-label="Choosing today’s fragrance">
          <div className="ui-skeleton aspect-square" />
          <div className="space-y-3 py-2">
            <div className="ui-skeleton h-4 w-24" />
            <div className="ui-skeleton h-9 w-3/4" />
            <div className="ui-skeleton h-4 w-1/2" />
            <div className="ui-skeleton h-12 w-full mt-8" />
          </div>
        </div>
      ) : result ? (
        <HeroPick
          result={result}
          logged={logged}
          shareMsg={shareMsg}
          photoUrl={heroPhotoUrl}
          moodLabel={moodLabel(advisorInput)}
          onWear={wearToday}
          onShare={shareToday}
        />
      ) : (
        <div className="ui-card ui-card--lg text-center py-10">
          <p className="ui-title2">No match right now</p>
          <p className="ui-secondary mt-2 max-w-xs mx-auto text-[var(--t-subhead)]">
            {prefs.officeSafeMode ? 'Office Safe may be filtering your bottles.' : 'Try another occasion or fine-tune in Advisor.'}
          </p>
          <PressableLink to="/advisor" className="ui-btn ui-btn--secondary mt-6">
            Open Advisor
          </PressableLink>
        </div>
      )}

      {history.length === 0 && result && (
        <p className="ui-footnote mt-3 text-center">Tap <strong>Wear today</strong> to start your diary and streak.</p>
      )}

      <Section title="Overview">
        <div className="ui-widgets">
          <PressableLink to="/collection" className="ui-widget">
            <span className="ui-widget__label"><LayoutGrid size={14} aria-hidden /> Bottles</span>
            <span className="ui-widget__value">{collection.length}</span>
          </PressableLink>
          <PressableLink to="/calendar" className="ui-widget">
            <span className="ui-widget__label"><Flame size={14} aria-hidden className={streak > 0 ? 'text-[var(--warning)]' : ''} /> Streak</span>
            <span className="ui-widget__value">{streak}<span className="ui-widget__unit">{streak === 1 ? 'day' : 'days'}</span></span>
          </PressableLink>
          <PressableLink to="/calendar" className="ui-widget">
            <span className="ui-widget__label"><CalendarDays size={14} aria-hidden /> This month</span>
            <span className="ui-widget__value">{monthWears}<span className="ui-widget__unit">wears</span></span>
          </PressableLink>
          <PressableLink to="/analytics" className="ui-widget">
            <span className="ui-widget__label"><RefreshCw size={14} aria-hidden /> Rotation</span>
            <span className="ui-widget__value">{rotation}<span className="ui-widget__unit">%</span></span>
            <span className="ui-meter mt-1" aria-hidden><span style={{ width: `${rotation}%`, background: rotationLow ? 'var(--warning)' : undefined }} /></span>
          </PressableLink>
        </div>
        {rotationLow && (
          <p className="ui-footnote mt-3 flex items-start gap-1.5">
            <AlertCircle size={14} className="text-[var(--warning)] shrink-0 mt-px" aria-hidden />
            Rotation is low — a few bottles haven’t been worn in weeks. Try one from “Waiting for you”.
          </p>
        )}
      </Section>

      {result && result.backups.length > 0 && (
        <Section title="Also great today">
          <div className="ui-scroller">
            {result.backups.slice(0, 6).map((b) => (
              <BottleCard
                key={b.collectionId}
                fragrance={b.fragrance}
                to={`/fragrance/${b.collectionId}`}
                meta={`${Math.round(b.score)}% match`}
                className="w-[148px] md:w-[180px]"
              />
            ))}
          </div>
        </Section>
      )}

      {neglectedDetails.length > 0 && (
        <Section title="Waiting for you" action={{ label: 'All bottles', to: '/collection' }}>
          <div className="ui-scroller">
            {neglectedDetails.map((n) => (
              <BottleCard
                key={n.id}
                fragrance={n.f}
                to={`/fragrance/${n.id}`}
                meta={n.days === null ? 'Never worn' : `Last worn ${n.days} days ago`}
                className="w-[148px] md:w-[180px]"
              />
            ))}
          </div>
        </Section>
      )}

      {weatherNotice && !weather && (
        <Section>
          <PressableLink to="/settings" className="ui-list ui-row">
            <MapPin size={20} className="text-[var(--tint)] shrink-0" aria-hidden />
            <span className="ui-row__main">
              <span className="ui-row__title block">Add your city for weather picks</span>
              <span className="ui-row__sub block whitespace-normal">{weatherNotice}</span>
            </span>
            <ChevronRight size={18} className="ui-chevron" aria-hidden />
          </PressableLink>
        </Section>
      )}

      {history.length > 0 && (
        <Section title="Recently worn" action={{ label: 'Diary', to: '/calendar' }}>
          <RecentWears history={history.slice(-4).reverse()} collection={collection} />
        </Section>
      )}

      <Section title="Tools">
        <div className="ui-list">
          {[
            { to: '/advisor', icon: Sparkles, title: 'Advisor', sub: 'Pick for a specific plan' },
            { to: '/layering', icon: Layers, title: 'Layering lab', sub: 'Pair two bottles' },
            { to: '/travel', icon: Luggage, title: 'Travel kit', sub: 'Pack the right decants' },
            { to: '/analytics', icon: BarChart3, title: 'Insights', sub: 'Value, families and habits' },
          ].map(({ to, icon: Icon, title, sub }) => (
            <PressableLink key={to} to={to} className="ui-row">
              <span className="w-8 h-8 rounded-[9px] grid place-items-center bg-[var(--tint-soft)] text-[var(--tint)] shrink-0">
                <Icon size={17} aria-hidden />
              </span>
              <span className="ui-row__main">
                <span className="ui-row__title block">{title}</span>
                <span className="ui-row__sub block">{sub}</span>
              </span>
              <ChevronRight size={18} className="ui-chevron" aria-hidden />
            </PressableLink>
          ))}
        </div>
      </Section>

      {ratingOpen ? (
        <Suspense fallback={null}>
          <WearRatingModal
            open={ratingOpen}
            fragranceName={pendingWear?.name ?? ''}
            catalogImage={wearRatingImage}
            onSubmit={saveRating}
            onSkip={() => { setRatingOpen(false); setPendingWear(null); setWearRatingImage(null); }}
          />
        </Suspense>
      ) : null}
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
  type Row = { id: string; name: string; wornAt: string; collectionId?: string; f?: Fragrance };
  // Reserve row slots immediately so async fragrance lookups do not grow the section (CLS).
  const [rows, setRows] = useState<Row[]>(() =>
    history.map((h) => ({
      id: h.id,
      name: '…',
      wornAt: h.wornAt,
      collectionId: collection.find((x) => x.fragranceId === h.fragranceId)?.id,
    })),
  );

  useEffect(() => {
    let cancelled = false;
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
    })).then((next) => {
      if (!cancelled) setRows(next);
    });
    return () => {
      cancelled = true;
    };
  }, [history, collection]);

  return (
    <div className="ui-list" style={{ minHeight: history.length * 64 }}>
      {rows.map((row) => {
        const inner = (
          <>
            <div className="w-12 shrink-0">
              <FragranceThumb fragrance={row.f} variant="plinth" size="sm" className="!rounded-[10px]" />
            </div>
            <span className="ui-row__main">
              <span className="ui-row__title block">{row.name}</span>
            </span>
            <span className="ui-row__value text-[var(--t-subhead)]">
              {new Date(row.wornAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
            </span>
          </>
        );
        return row.collectionId ? (
          <PressableLink key={row.id} to={`/fragrance/${row.collectionId}`} className="ui-row ui-row--media">
            {inner}
          </PressableLink>
        ) : (
          <div key={row.id} className="ui-row ui-row--media">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
