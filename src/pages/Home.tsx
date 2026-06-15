import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Cloud, Droplets, Flame, Layers, Sparkles, Sun, Wind, ChevronRight, Check, MapPin, Share2, Briefcase, AlertCircle, Bookmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { runAdvisor, defaultAdvisorInput } from '@/engines/advisor';
import { getFragrance, logWear, updateWearRecord } from '@/db';
import type { AdvisorResult, Fragrance } from '@/types';
import { WearRatingModal } from '@/components/ui/WearRatingModal';
import { BottleVisual } from '@/components/ui/BottleVisual';
import { MistBackground } from '@/components/home/MistBackground';
import { ScoreRing } from '@/components/home/ScoreRing';
import { timeGreeting, scentMood } from '@/lib/greetings';
import { FAMILY_COLORS, rotationHealth, wearStreak, wearsThisMonth, daysSinceWear } from '@/lib/stats';
import { weatherUnavailableMessage } from '@/services/weather';
import { uid } from '@/lib/utils';
import { advisorToShareInput, downloadBlob, exportShareCardPng, shareWearCard } from '@/lib/shareCard';
import { saveAdvisorLayering } from '@/lib/layeringSave';
import { loadDemoData } from '@/services/demo';
import { EmptyState } from '@/components/ui/EmptyState';

const PRESETS = [
  { label: 'Office', icon: '💼', occasion: 'work' as const, dress: 'professional' as const, vibe: 'subtle' as const },
  { label: 'Date', icon: '🌹', occasion: 'date' as const, dress: 'smart_casual' as const, vibe: 'romantic' as const },
  { label: 'Weekend', icon: '☕', occasion: 'casual' as const, dress: 'casual' as const, vibe: 'confident' as const },
  { label: 'Gala', icon: '✨', occasion: 'event' as const, dress: 'formal' as const, vibe: 'bold' as const },
];

const WEATHER_ICON: Record<string, typeof Sun> = {
  hot: Sun, clear: Sun, cold: Wind, rain: Cloud, cloudy: Cloud, windy: Wind, snow: Cloud,
};

export function Home() {
  const { profile, prefs, collection, history, weather, weatherUnavailable, refresh } = useApp();
  const navigate = useNavigate();
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [pendingWear, setPendingWear] = useState<{ id: string; name: string; wornAt: string } | null>(null);
  const [neglectedDetails, setNeglectedDetails] = useState<{ id: string; f: Fragrance; days: number | null }[]>([]);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [layerSaved, setLayerSaved] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const greeting = timeGreeting();
  const streak = wearStreak(history);
  const monthWears = wearsThisMonth(history);
  const rotation = rotationHealth(collection, history);
  const mood = scentMood(weather);
  const rotationLow = rotation < 50 && collection.length >= 3;

  useEffect(() => {
    (async () => {
      if (!profile || !collection.length) {
        setLoading(false);
        return;
      }
      const input = defaultAdvisorInput();
      if (profile.workContext === 'office') {
        input.occasion = 'work';
        input.dressLevel = 'professional';
      }
      setResult(await runAdvisor(collection, input, profile, prefs, weather, history));
      setLoading(false);
    })();
  }, [profile, collection, prefs, weather, history]);

  const neglected = useMemo(() =>
    collection
      .map((c) => ({ c, days: daysSinceWear(c.fragranceId, history) }))
      .filter((x) => x.days === null || x.days > 21)
      .slice(0, 6),
  [collection, history]);

  useEffect(() => {
    Promise.all(
      neglected.map(async ({ c, days }) => {
        const f = await getFragrance(c.fragranceId);
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
    });
    await refresh();
    setLogged(true);
    setPendingWear({
      id: wearId,
      name: `${result.primary.fragrance.brand} ${result.primary.fragrance.name}`,
      wornAt,
    });
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
    <div className="relative pb-8">
      <MistBackground />

      {/* Hero welcome */}
      <section className="safe-pt px-5 md:px-0 pt-4 pb-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                  <span>{greeting.emoji}</span>
                  {greeting.line}{profile?.gender === 'man' ? ', sir' : profile?.gender === 'woman' ? '' : ''}
                </p>
                {prefs.officeSafeMode && (
                  <span className="office-safe-badge" title="Office-safe mode is on">
                    <Briefcase size={12} />
                    Office Safe
                  </span>
                )}
              </div>
              <h1 className="text-[1.75rem] md:text-3xl font-semibold tracking-tight mt-1 leading-tight">
                {mood}
              </h1>
            </div>
            {weather && (
              <div className="weather-orb shrink-0">
                <WIcon size={18} className="text-[var(--color-accent)]" />
                <span className="text-base font-semibold tabular-nums">{Math.round(weather.tempC)}°</span>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Rotation health alert */}
      {rotationLow && (
        <section className="px-5 md:px-0 mt-3">
          <div className="rotation-banner rotation-banner--low rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle size={18} className="text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Rotation at {rotation}%</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {collection.length - Math.round((rotation / 100) * collection.length)} bottles haven&apos;t been worn yet. Try a neglected pick below.
              </p>
            </div>
            <Link to="/collection" className="text-xs text-[var(--color-accent)] font-medium shrink-0">
              View all
            </Link>
          </div>
        </section>
      )}

      {/* Stats strip */}
      <motion.div
        className="px-5 md:px-0 flex gap-2 overflow-x-auto py-4 scrollbar-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.25 }}
      >
        <StatChip icon={<Droplets size={14} />} label="Bottles" value={String(collection.length)} />
        <StatChip icon={<Flame size={14} />} label="Streak" value={`${streak}d`} accent={streak > 0} />
        <StatChip icon={<Sparkles size={14} />} label="This month" value={String(monthWears)} />
        <StatChip
          icon={<Layers size={14} />}
          label="Rotation"
          value={`${rotation}%`}
          warn={rotationLow}
          good={rotation >= 70}
        />
      </motion.div>

      {/* Today's pick — hero card */}
      <section className="px-5 md:px-0">
        {loading ? (
          <div className="hero-pick-card animate-pulse h-56 rounded-2xl" />
        ) : result ? (
          <motion.div
            className="hero-pick-card relative overflow-hidden rounded-2xl p-6 md:p-8"
            style={{ '--aura': familyColor } as React.CSSProperties}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="hero-pick-accent" />
            <div className="relative z-10 flex gap-5 items-start">
              <div className="hidden sm:block shrink-0 pt-1">
                <BottleVisual
                  brand={result.primary.fragrance.brand}
                  name={result.primary.fragrance.name}
                  family={result.primary.fragrance.family}
                  size="md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Today&apos;s scent</p>
                <h2 className="text-2xl md:text-3xl font-semibold mt-2 truncate">{result.primary.fragrance.brand}</h2>
                <p className="text-lg text-[var(--color-text-secondary)] truncate">{result.primary.fragrance.name}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="tag-pill">{result.primary.fragrance.concentration}</span>
                  <span className="tag-pill">{result.primary.fragrance.family}</span>
                  <span className="tag-pill">{result.spray.totalSprays} sprays</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mt-4 line-clamp-2">{result.reasoning[0]}</p>
                {result.layering && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs text-[var(--color-accent)] flex items-center gap-1">
                      <Layers size={12} /> Layer with {result.layering.secondary.name}
                    </p>
                    <button
                      type="button"
                      onClick={saveLayering}
                      className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] flex items-center gap-1 transition-colors"
                    >
                      <Bookmark size={12} />
                      {layerSaved ? 'Saved!' : 'Save to Layering Lab'}
                    </button>
                  </div>
                )}
              </div>
              <ScoreRing score={result.fragranceScore} color={familyColor} size={88} />
            </div>
            <div className="relative z-10 flex gap-3 mt-6">
              <Button className="flex-1" onClick={wearToday} disabled={logged}>
                {logged ? <><Check size={16} /> Logged</> : 'Wear this today'}
              </Button>
              <Button variant="ghost" className="px-4" onClick={shareToday} aria-label="Share today's pick">
                <Share2 size={16} />
              </Button>
              <Link to="/advisor" className="flex-1">
                <Button variant="ghost" className="w-full">
                  <Sparkles size={16} /> Customize
                </Button>
              </Link>
            </div>
            {shareMsg && <p className="relative z-10 text-center text-xs text-[var(--color-accent)] mt-2">{shareMsg}</p>}
          </motion.div>
        ) : (
          <div className="hero-pick-card rounded-2xl p-6 text-center">
            <p className="text-sm font-medium">No match for today&apos;s filters</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              {prefs.officeSafeMode
                ? 'Office Safe is on — try turning it off in Settings or customize in Advisor.'
                : 'Open Advisor to customize occasion and vibe.'}
            </p>
            <Link to="/advisor" className="inline-block mt-4">
              <Button variant="outline">Open Advisor</Button>
            </Link>
          </div>
        )}

        {result && result.backups.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">Backup picks</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {result.backups.slice(0, 3).map((b) => (
                <Link
                  key={b.collectionId}
                  to={`/fragrance/${b.collectionId}`}
                  className="shrink-0 surface-card rounded-xl px-4 py-3 min-w-[140px]"
                >
                  <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">{b.fragrance.brand}</p>
                  <p className="text-sm font-medium truncate">{b.fragrance.name}</p>
                  <p className="text-[10px] text-[var(--color-accent)] mt-1">{Math.round(b.score)}% match</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <WearRatingModal
        open={ratingOpen}
        fragranceName={pendingWear?.name ?? ''}
        onSubmit={saveRating}
        onSkip={() => { setRatingOpen(false); setPendingWear(null); }}
      />

      {/* Neglected bottles — moved up for visibility */}
      {neglectedDetails.length > 0 && (
        <section className="mt-6">
          <div className="px-5 md:px-0 flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">Needs attention</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                {neglectedDetails.length} bottle{neglectedDetails.length !== 1 ? 's' : ''} not worn in 3+ weeks
              </p>
            </div>
            <Link to="/collection" className="text-xs text-[var(--color-accent)] flex items-center gap-0.5">
              All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 md:px-0 pb-2 scrollbar-none">
            {neglectedDetails.map((n) => (
              <Link key={n.id} to={`/fragrance/${n.id}`} className="neglected-card block w-[148px] rounded-xl p-4 shrink-0">
                <div
                  className="w-10 h-10 rounded-lg mb-3"
                  style={{ background: `linear-gradient(135deg, ${FAMILY_COLORS[n.f.family] ?? '#0a84ff'}33, transparent)` }}
                />
                <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">{n.f.brand}</p>
                <p className="text-sm font-medium truncate">{n.f.name}</p>
                <p className="text-[11px] font-medium text-orange-400 mt-2">
                  {n.days === null ? 'Never worn' : `${n.days} days ago`}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick presets */}
      <section className="px-5 md:px-0 mt-8">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">One tap mood</p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <Link
              key={p.label}
              to="/advisor"
              state={p}
              className="preset-tile flex flex-col items-center gap-1.5 rounded-xl py-4 text-center"
            >
              <span className="text-xl">{p.icon}</span>
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">{p.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Weather detail */}
      {weather ? (
        <section className="px-5 md:px-0 mt-6">
          <div className="surface-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center">
              <WIcon className="text-[var(--color-accent)]" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium capitalize">{weather.condition} · {profile?.cityLabel ?? 'Local'}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {weather.tempC}°C · {weather.humidity}% humidity · wind {Math.round(weather.windKmh)} km/h
              </p>
            </div>
            <Link to="/layering" className="text-[var(--color-accent)] text-sm font-medium">Layer lab</Link>
          </div>
        </section>
      ) : weatherNotice ? (
        <section className="px-5 md:px-0 mt-6">
          <div className="surface-card rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0">
              <MapPin className="text-[var(--color-text-secondary)]" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Weather unavailable</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">{weatherNotice}</p>
              <Link to="/settings" className="inline-block text-[var(--color-accent)] text-sm font-medium mt-2">
                Open Settings
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Recent wears */}
      {history.length > 0 && (
        <section className="px-5 md:px-0 mt-8">
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">Recent wears</p>
          <RecentWears history={history.slice(-4).reverse()} />
        </section>
      )}

      {/* Explore row */}
      <section className="px-5 md:px-0 mt-8 grid grid-cols-2 gap-3">
        <Link to="/analytics" className="explore-tile rounded-xl p-4">
          <p className="text-sm font-medium">Analytics</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Value & rotation</p>
        </Link>
        <Link to="/calendar" className="explore-tile rounded-xl p-4">
          <p className="text-sm font-medium">Calendar</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Wear patterns</p>
        </Link>
      </section>
    </div>
  );
}

function StatChip({
  icon, label, value, accent, warn, good,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
  good?: boolean;
}) {
  const variant = warn ? 'stat-chip--warn' : good ? 'stat-chip--good' : accent ? 'stat-chip--hot' : '';
  return (
    <div className={`stat-chip shrink-0 rounded-xl px-4 py-3 min-w-[96px] ${variant}`}>
      <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">{icon}{label}</div>
      <p className="text-xl font-semibold mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function RecentWears({ history }: { history: { id: string; fragranceId: string; wornAt: string }[] }) {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    Promise.all(history.map(async (h) => {
      const f = await getFragrance(h.fragranceId);
      return [h.id, f ? `${f.brand} ${f.name}` : '…'] as const;
    })).then((pairs) => setNames(Object.fromEntries(pairs)));
  }, [history]);

  return (
    <div className="space-y-2">
      {history.map((h) => (
        <div key={h.id} className="flex justify-between items-center surface-card rounded-xl px-4 py-3 text-sm">
          <span className="truncate pr-4">{names[h.id] ?? '…'}</span>
          <span className="text-[var(--color-text-tertiary)] shrink-0 text-xs">
            {new Date(h.wornAt).toLocaleDateString(undefined, { weekday: 'short' })}
          </span>
        </div>
      ))}
    </div>
  );
}
