import { useEffect, useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday } from 'date-fns';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react';
import { PageHeader, Sheet } from '@/components/kit';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { WearRatingModal } from '@/components/ui/WearRatingModal';
import { useApp } from '@/context/AppContext';
import { getFragrance, logWear, updateWearRecord } from '@/db';
import { wearStreak, wearsThisMonth } from '@/lib/stats';
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
    Promise.all(
      ids.map(async (id) => {
        const f = await getFragrance(id);
        return [id, { name: f ? `${f.brand} ${f.name}` : id, family: f?.family ?? 'Fresh', image: f?.image }] as const;
      }),
    ).then((pairs) => setLabels(Object.fromEntries(pairs)));
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
    <div className="ui-page">
      <PageHeader
        eyebrow="Journal"
        title="Wear calendar"
        subtitle={`${wearStreak(history)}d streak · ${wearsThisMonth(history)} this month`}
        trailing={
          !loggedToday && collection.length > 0 ? (
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => setQuickLogOpen(true)}>
              <Plus size={16} aria-hidden /> Log today
            </button>
          ) : undefined
        }
      />

      {monthInsights && (
        <div className="ui-card mb-4">
          <p className="ui-eyebrow">{format(month, 'MMMM')} MVP</p>
          <p className="font-semibold mt-1">{monthInsights.name}</p>
          <p className="ui-secondary text-[var(--t-subhead)]">{monthInsights.count} wears</p>
        </div>
      )}

      <div className="ui-card">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Previous month"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <p className="text-sm font-medium">{format(month, 'MMMM yyyy')}</p>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[var(--t-caption)]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="text-[var(--label-3)] py-1 font-medium">
              {d}
            </span>
          ))}
          {Array.from({ length: padStart }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const worn = byDay[key] ?? [];
            const primary = worn[0];
            const today = isToday(day);
            return (
              <div
                key={key}
                className={`min-h-[56px] rounded-[var(--r-md)] flex flex-col items-center justify-start pt-1.5 border ${
                  today ? 'border-[var(--tint)]' : 'border-transparent'
                } ${worn.length ? 'bg-[var(--tint-soft)]' : 'bg-[var(--fill)]'}`}
                title={primary ? labels[primary]?.name : undefined}
              >
                <span className={worn.length || today ? 'font-semibold' : 'text-[var(--label-3)]'}>
                  {format(day, 'd')}
                </span>
                {primary && (
                  <span className="text-[var(--t-caption2)] leading-tight px-0.5 mt-0.5 line-clamp-2 text-[var(--label-2)] max-w-full">
                    {labels[primary]?.name.split(' ').slice(-1)[0]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="ui-list-header mt-6">Timeline</p>
      <div className="ui-list">
        {monthTimeline.map((h) => (
          <button key={h.id} type="button" className="ui-row ui-row--media w-full text-left" onClick={() => setEditWear(h)}>
            <FragranceThumb
              name={labels[h.fragranceId]?.name}
              family={labels[h.fragranceId]?.family}
              catalogImage={labels[h.fragranceId]?.image}
              size="sm"
              className="w-11 shrink-0"
            />
            <div className="ui-row__main">
              <p className="ui-row__title">{labels[h.fragranceId]?.name ?? '…'}</p>
              {h.compliment && <p className="ui-row__sub text-[var(--tint)]">Compliment</p>}
              {h.rating && <p className="ui-row__sub">Rated {h.rating}/5</p>}
              {h.notes && <p className="ui-row__sub line-clamp-2">{h.notes}</p>}
            </div>
            <span className="ui-row__value flex items-center gap-1">
              {format(new Date(h.wornAt), 'MMM d')}
              <Pencil size={12} aria-hidden />
            </span>
          </button>
        ))}
        {!monthTimeline.length && (
          <div className="ui-row !items-start !py-3">
            <p className="ui-row__sub">
              No wears logged in {format(month, 'MMMM yyyy')}. Use “Log today” or wear from Today.
            </p>
          </div>
        )}
      </div>

      <Link to="/analytics" className="ui-section-link mt-4">
        View full analytics
      </Link>

      <Sheet open={quickLogOpen} title="Log wear for today" onClose={() => setQuickLogOpen(false)}>
        <p className="ui-secondary text-[var(--t-subhead)] mb-3 px-1">Pick a bottle from your wardrobe.</p>
        <div className="ui-list">
          {collection.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={logging}
              className="ui-row ui-row--media w-full text-left disabled:opacity-50"
              onClick={() => void quickLog(c.id, c.fragranceId)}
            >
              <FragranceThumb
                name={labels[c.fragranceId]?.name}
                family={labels[c.fragranceId]?.family}
                catalogImage={labels[c.fragranceId]?.image}
                size="sm"
                className="w-11 shrink-0"
              />
              <span className="ui-row__title truncate">{labels[c.fragranceId]?.name ?? '…'}</span>
            </button>
          ))}
        </div>
      </Sheet>

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
