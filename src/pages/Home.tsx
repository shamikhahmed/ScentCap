import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Cloud, Droplets, Flame, Layers, Sparkles, Sun, Wind, ChevronRight, Check, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { runAdvisor, defaultAdvisorInput } from '@/engines/advisor';
import { getFragrance, logWear, updateWearRecord } from '@/db';
import type { AdvisorResult, Fragrance } from '@/types';
import { WearRatingModal } from '@/components/ui/WearRatingModal';
import { MistBackground } from '@/components/home/MistBackground';
import { ScoreRing } from '@/components/home/ScoreRing';
import { timeGreeting, scentMood } from '@/lib/greetings';
import { FAMILY_COLORS, rotationHealth, wearStreak, wearsThisMonth, daysSinceWear } from '@/lib/stats';
import { weatherUnavailableMessage } from '@/services/weather';
import { uid } from '@/lib/utils';

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
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [pendingWear, setPendingWear] = useState<{ id: string; name: string; wornAt: string } | null>(null);
  const [neglectedDetails, setNeglectedDetails] = useState<{ id: string; f: Fragrance; days: number | null }[]>([]);

  const greeting = timeGreeting();
  const streak = wearStreak(history);
  const monthWears = wearsThisMonth(history);
  const rotation = rotationHealth(collection, history);
  const mood = scentMood(weather);

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

  const saveRating = async (rating: number, compliment: boolean) => {
    if (!pendingWear || !result) return;
    await updateWearRecord({
      id: pendingWear.id,
      collectionId: result.primary.collectionId,
      fragranceId: result.primary.fragrance.id,
      wornAt: pendingWear.wornAt,
      sprays: result.spray.totalSprays,
      rating,
      compliment,
    });
    await refresh();
    setRatingOpen(false);
    setPendingWear(null);
  };

  const familyColor = result
    ? FAMILY_COLORS[result.primary.fragrance.family] ?? '#c9a87c'
    : '#c9a87c';

  const WIcon = weather ? (WEATHER_ICON[weather.condition] ?? Cloud) : Cloud;
  const weatherNotice = !weather ? weatherUnavailableMessage(weatherUnavailable) : null;

  if (!collection.length) {
    return (
      <div className="relative min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
        <MistBackground />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="welcome-orb mx-auto mb-8" />
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-accent)]">ScentCap</p>
          <h1 className="text-4xl font-semibold tracking-tight mt-3">Your wardrobe awaits</h1>
          <p className="text-stone-400 mt-4 max-w-sm mx-auto leading-relaxed">
            Add the bottles you own. Every morning, ScentCap tells you exactly what to wear.
          </p>
          <Link to="/add" className="inline-block mt-8">
            <Button size="lg" className="px-10">Add first bottle</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative pb-8">
      <MistBackground />

      {/* Hero welcome */}
      <section className="safe-pt px-5 md:px-0 pt-4 pb-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-400 flex items-center gap-2">
                <span>{greeting.emoji}</span>
                {greeting.line}{profile?.gender === 'man' ? ', sir' : profile?.gender === 'woman' ? '' : ''}
              </p>
              <h1 className="text-[2rem] md:text-4xl font-semibold tracking-tight mt-1 leading-tight">
                {mood}
              </h1>
            </div>
            {weather && (
              <motion.div
                className="weather-orb shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <WIcon size={20} className="text-[var(--color-accent)]" />
                <span className="text-lg font-semibold tabular-nums">{Math.round(weather.tempC)}°</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Stats strip */}
      <motion.div
        className="px-5 md:px-0 flex gap-3 overflow-x-auto pb-4 scrollbar-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <StatChip icon={<Droplets size={14} />} label="Bottles" value={String(collection.length)} />
        <StatChip icon={<Flame size={14} />} label="Streak" value={`${streak}d`} accent={streak > 0} />
        <StatChip icon={<Sparkles size={14} />} label="This month" value={String(monthWears)} />
        <StatChip icon={<Layers size={14} />} label="Rotation" value={`${rotation}%`} />
      </motion.div>

      {/* Today's pick — hero card */}
      <section className="px-5 md:px-0">
        {loading ? (
          <div className="hero-pick-card animate-pulse h-64 rounded-[2rem]" />
        ) : result ? (
          <motion.div
            className="hero-pick-card relative overflow-hidden rounded-[2rem] p-6 md:p-8"
            style={{ '--aura': familyColor } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-pick-glow" />
            <div className="relative z-10 flex gap-5">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Today&apos;s scent</p>
                <h2 className="text-2xl md:text-3xl font-semibold mt-2 truncate">{result.primary.fragrance.brand}</h2>
                <p className="text-lg text-white/70 truncate">{result.primary.fragrance.name}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="tag-pill">{result.primary.fragrance.concentration}</span>
                  <span className="tag-pill">{result.primary.fragrance.family}</span>
                  <span className="tag-pill">{result.spray.totalSprays} sprays</span>
                </div>
                <p className="text-sm text-white/55 mt-4 line-clamp-2">{result.reasoning[0]}</p>
                {result.layering && (
                  <p className="text-xs text-[var(--color-accent)] mt-2 flex items-center gap-1">
                    <Layers size={12} /> Layer with {result.layering.secondary.name}
                  </p>
                )}
              </div>
              <ScoreRing score={result.fragranceScore} color={familyColor} size={96} />
            </div>
            <div className="relative z-10 flex gap-3 mt-6">
              <Button className="flex-1" onClick={wearToday} disabled={logged}>
                {logged ? <><Check size={16} /> Logged</> : 'Wear this today'}
              </Button>
              <Link to="/advisor" className="flex-1">
                <Button variant="ghost" className="w-full border border-white/15 bg-white/5">
                  <Sparkles size={16} /> Customize
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : null}

        {result && result.backups.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase tracking-wider text-stone-500">Backup picks</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {result.backups.slice(0, 3).map((b) => (
                <Link
                  key={b.collectionId}
                  to={`/fragrance/${b.collectionId}`}
                  className="shrink-0 glass-card rounded-2xl px-4 py-3 min-w-[140px]"
                >
                  <p className="text-[10px] text-stone-500 truncate">{b.fragrance.brand}</p>
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

      {/* Quick presets */}
      <section className="px-5 md:px-0 mt-8">
        <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">One tap mood</p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p, i) => (
            <motion.div key={p.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
              <Link
                to="/advisor"
                state={p}
                className="preset-tile flex flex-col items-center gap-1.5 rounded-2xl py-4 text-center"
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-[11px] font-medium text-stone-300">{p.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Weather detail */}
      {weather ? (
        <section className="px-5 md:px-0 mt-6">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/15 flex items-center justify-center">
              <WIcon className="text-[var(--color-accent)]" size={22} />
            </div>
            <div className="flex-1">
              <p className="font-medium capitalize">{weather.condition} · {profile?.cityLabel ?? 'Local'}</p>
              <p className="text-sm text-stone-400">
                {weather.tempC}°C · {weather.humidity}% humidity · wind {Math.round(weather.windKmh)} km/h
              </p>
            </div>
            <Link to="/layering" className="text-[var(--color-accent)] text-sm font-medium">Layer lab</Link>
          </div>
        </section>
      ) : weatherNotice ? (
        <section className="px-5 md:px-0 mt-6">
          <div className="glass-card rounded-2xl p-4 flex items-start gap-3 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <MapPin className="text-stone-400" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-300">Weather unavailable</p>
              <p className="text-sm text-stone-500 mt-1 leading-relaxed">{weatherNotice}</p>
              <Link to="/settings" className="inline-block text-[var(--color-accent)] text-sm font-medium mt-2">
                Open Settings
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Neglected carousel */}
      {neglectedDetails.length > 0 && (
        <section className="mt-8">
          <div className="px-5 md:px-0 flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-stone-500">Sleeping in your shelf</p>
            <Link to="/collection" className="text-xs text-[var(--color-accent)] flex items-center gap-0.5">
              All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 md:px-0 pb-2 scrollbar-none">
            {neglectedDetails.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
              >
                <Link to={`/fragrance/${n.id}`} className="neglected-card block w-[140px] rounded-2xl p-4">
                  <div
                    className="w-10 h-10 rounded-xl mb-3"
                    style={{ background: `linear-gradient(135deg, ${FAMILY_COLORS[n.f.family] ?? '#c9a87c'}44, transparent)` }}
                  />
                  <p className="text-[10px] text-stone-500 truncate">{n.f.brand}</p>
                  <p className="text-sm font-medium truncate">{n.f.name}</p>
                  <p className="text-[10px] text-amber-400/80 mt-2">
                    {n.days === null ? 'Never worn' : `${n.days}d ago`}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Recent wears */}
      {history.length > 0 && (
        <section className="px-5 md:px-0 mt-8">
          <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">Recent wears</p>
          <RecentWears history={history.slice(-4).reverse()} />
        </section>
      )}

      {/* Explore row */}
      <section className="px-5 md:px-0 mt-8 grid grid-cols-2 gap-3">
        <Link to="/analytics" className="explore-tile rounded-2xl p-4">
          <p className="text-sm font-medium">Analytics</p>
          <p className="text-xs text-stone-500 mt-1">Value & rotation</p>
        </Link>
        <Link to="/calendar" className="explore-tile rounded-2xl p-4">
          <p className="text-sm font-medium">Calendar</p>
          <p className="text-xs text-stone-500 mt-1">Wear patterns</p>
        </Link>
      </section>
    </div>
  );
}

function StatChip({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`stat-chip shrink-0 rounded-2xl px-4 py-3 min-w-[100px] ${accent ? 'stat-chip--hot' : ''}`}>
      <div className="flex items-center gap-1.5 text-stone-500 text-[10px] uppercase tracking-wider">{icon}{label}</div>
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
        <div key={h.id} className="flex justify-between items-center glass-card rounded-xl px-4 py-3 text-sm">
          <span className="truncate pr-4">{names[h.id] ?? '…'}</span>
          <span className="text-stone-500 shrink-0 text-xs">
            {new Date(h.wornAt).toLocaleDateString(undefined, { weekday: 'short' })}
          </span>
        </div>
      ))}
    </div>
  );
}
