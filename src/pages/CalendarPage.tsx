import { useEffect, useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday } from 'date-fns';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { WearRatingModal } from '@/components/ui/WearRatingModal';
import { useApp } from '@/context/AppContext';
import { getFragrance, logWear, updateWearRecord } from '@/db';
import { FAMILY_COLORS, wearStreak, wearsThisMonth } from '@/lib/stats';
import { uid } from '@/lib/utils';
import { hapticSuccess } from '@/lib/premium/haptics';
import type { WearRecord } from '@/types';

export function CalendarPage() {
  const { history, collection, refresh } = useApp();
  const [labels, setLabels] = useState<Record<string, { name: string; family: string; image?: string }>>({});
  const [month, setMonth] = useState(() => new Date());
  const [editWear, setEditWear] = useState<WearRecord | null>(null);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [logging, setLogging] = useState(false);
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const monthKey = format(month, 'yyyy-MM');
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const loggedToday = history.some((h) => h.wornAt.slice(0, 10) === todayKey);

  const byDay = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const h of history) {
      const d = h.wornAt.slice(0, 10);
      if (!m[d]) m[d] = [];
      if (!m[d].includes(h.fragranceId)) m[d].push(h.fragranceId);
    }
    return m;
  }, [history]);

  useEffect(() => {
    const ids = [...new Set([...history.map((h) => h.fragranceId), ...collection.map((c) => c.fragranceId)])];
    Promise.all(ids.map(async (id) => {
      const f = await getFragrance(id);
      return [id, { name: f ? `${f.brand} ${f.name}` : id, family: f?.family ?? 'Fresh', image: f?.image }] as const;
    })).then((pairs) => setLabels(Object.fromEntries(pairs)));
  }, [history, collection]);

  const monthInsights = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const h of history) {
      if (!h.wornAt.startsWith(monthKey)) continue;
      counts[h.fragranceId] = (counts[h.fragranceId] ?? 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: labels[top[0]]?.name ?? '…', count: top[1] } : null;
  }, [history, labels, monthKey]);

  const monthTimeline = useMemo(
    () => history.filter((h) => h.wornAt.startsWith(monthKey)).slice(-20).reverse(),
    [history, monthKey],
  );

  const saveWearEdit = async (rating: number, compliment: boolean, notes?: string) => {
    if (!editWear) return;
    await updateWearRecord({ ...editWear, rating, compliment, notes });
    await refresh();
    setEditWear(null);
  };

  const quickLog = async (collectionId: string, fragranceId: string) => {
    setLogging(true);
    try {
      await logWear({
        id: uid(),
        collectionId,
        fragranceId,
        wornAt: new Date().toISOString(),
      });
      await refresh();
      hapticSuccess();
      setQuickLogOpen(false);
    } finally {
      setLogging(false);
    }
  };

  const padStart = startOfMonth(month).getDay();

  return (
    <div className="atelier-page space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="atelier-page__brand">Journal</p>
          <h1 className="atelier-page__title">Wear calendar</h1>
          <p className="atelier-page__sub">
            {wearStreak(history)}d streak · {wearsThisMonth(history)} this month
          </p>
        </div>
        {!loggedToday && collection.length > 0 && (
          <Button size="sm" className="btn-glow shrink-0" onClick={() => setQuickLogOpen(true)}>
            <Plus size={16} /> Log today
          </Button>
        )}
      </div>

      {monthInsights && (
        <Card className="border-[var(--color-accent)]/20 bg-[var(--color-accent-muted)]/20">
          <p className="text-xs uppercase text-[var(--color-text-tertiary)]">{format(month, 'MMMM')} MVP</p>
          <p className="font-semibold mt-1">{monthInsights.name}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{monthInsights.count} wears</p>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <Button size="sm" variant="ghost" aria-label="Previous month" onClick={() => setMonth((m) => subMonths(m, 1))}>
            <ChevronLeft size={18} />
          </Button>
          <p className="text-sm font-medium">{format(month, 'MMMM yyyy')}</p>
          <Button size="sm" variant="ghost" aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight size={18} />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="text-[var(--color-text-tertiary)] py-1 font-medium">{d}</span>)}
          {Array.from({ length: padStart }).map((_, i) => <span key={`pad-${i}`} />)}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const worn = byDay[key] ?? [];
            const primary = worn[0];
            // Hex only — style appends alpha (`${color}22` / `${color}44`).
            const color = primary ? FAMILY_COLORS[labels[primary]?.family ?? ''] ?? '#0a5f52' : undefined;
            const today = isToday(day);
            return (
              <div
                key={key}
                className={`min-h-[56px] rounded-xl flex flex-col items-center justify-start pt-1.5 text-[11px] border ${
                  today ? 'ring-1 ring-[var(--color-accent)]/50' : 'border-transparent'
                }`}
                style={color ? { background: `${color}22`, borderColor: `${color}44` } : { background: 'var(--sc-surface)', borderColor: 'var(--sc-border-soft)' }}
                title={primary ? labels[primary]?.name : undefined}
              >
                <span className={`${worn.length || today ? 'font-semibold' : 'text-[var(--color-text-tertiary)]'}`}>
                  {format(day, 'd')}
                </span>
                {primary && (
                  <span className="text-[8px] leading-tight px-0.5 mt-0.5 line-clamp-2 text-[var(--color-text-secondary)] max-w-full">
                    {labels[primary]?.name.split(' ').slice(-1)[0]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <p className="font-medium mb-3">Timeline</p>
        <ul className="space-y-3">
          {monthTimeline.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className="w-full flex justify-between items-center text-sm gap-3 text-left hover:text-[var(--color-accent)] pressable"
                onClick={() => setEditWear(h)}
              >
                <FragranceThumb
                  name={labels[h.fragranceId]?.name}
                  family={labels[h.fragranceId]?.family}
                  catalogImage={labels[h.fragranceId]?.image}
                  size="sm"
                  className="w-11 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="block">{labels[h.fragranceId]?.name ?? '…'}</span>
                  {h.compliment && <span className="text-xs text-[var(--color-accent)]">★ compliment</span>}
                  {h.rating && <span className="text-xs text-[var(--color-text-secondary)]">Rated {h.rating}/5</span>}
                  {h.notes && <span className="text-xs text-[var(--color-text-tertiary)] block mt-0.5 line-clamp-2">{h.notes}</span>}
                </div>
                <span className="text-[var(--color-text-tertiary)] shrink-0 text-xs flex items-center gap-1">
                  {format(new Date(h.wornAt), 'MMM d')}
                  <Pencil size={12} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!monthTimeline.length && (
          <p className="text-[var(--color-text-secondary)] text-sm">
            No wears logged in {format(month, 'MMMM yyyy')}. Use &quot;Log today&quot; or wear from Today.
          </p>
        )}
      </Card>
      <Link to="/analytics" className="text-sm text-[var(--color-accent)] font-semibold">View full analytics →</Link>

      {quickLogOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-4">
          <div className="glass-card rounded-3xl p-5 w-full max-w-md max-h-[70vh] overflow-y-auto space-y-3">
            <p className="font-semibold">Log wear for today</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Pick a bottle from your wardrobe.</p>
            <ul className="space-y-2">
              {collection.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={logging}
                    className="w-full flex items-center gap-3 tile-premium !py-3 !px-4 text-left pressable disabled:opacity-50"
                    onClick={() => void quickLog(c.id, c.fragranceId)}
                  >
                    <FragranceThumb
                      name={labels[c.fragranceId]?.name}
                      family={labels[c.fragranceId]?.family}
                      catalogImage={labels[c.fragranceId]?.image}
                      size="sm"
                      className="w-11 shrink-0"
                    />
                    <span className="text-sm truncate">{labels[c.fragranceId]?.name ?? '…'}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Button variant="ghost" className="w-full" onClick={() => setQuickLogOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <WearRatingModal
        open={Boolean(editWear)}
        fragranceName={editWear ? labels[editWear.fragranceId]?.name ?? '…' : ''}
        catalogImage={editWear ? labels[editWear.fragranceId]?.image : null}
        editMode
        initial={editWear ? { rating: editWear.rating, compliment: editWear.compliment, notes: editWear.notes } : undefined}
        onSubmit={saveWearEdit}
        onSkip={() => setEditWear(null)}
      />
    </div>
  );
}
