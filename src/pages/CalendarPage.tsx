import { useEffect, useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { getFragrance } from '@/db';
import { FAMILY_COLORS } from '@/lib/stats';

export function CalendarPage() {
  const { history } = useApp();
  const [labels, setLabels] = useState<Record<string, { name: string; family: string }>>({});
  const month = new Date();
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });

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
    const ids = [...new Set(history.map((h) => h.fragranceId))];
    Promise.all(ids.map(async (id) => {
      const f = await getFragrance(id);
      return [id, { name: f ? `${f.brand} ${f.name}` : id, family: f?.family ?? 'Fresh' }] as const;
    })).then((pairs) => setLabels(Object.fromEntries(pairs)));
  }, [history]);

  const monthInsights = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const h of history) {
      if (!h.wornAt.startsWith(format(month, 'yyyy-MM'))) continue;
      counts[h.fragranceId] = (counts[h.fragranceId] ?? 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: labels[top[0]]?.name ?? '…', count: top[1] } : null;
  }, [history, labels, month]);

  return (
    <div className="safe-pt px-5 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Wear calendar</h1>

      {monthInsights && (
        <Card>
          <p className="text-xs uppercase text-stone-500">This month&apos;s MVP</p>
          <p className="font-semibold mt-1">{monthInsights.name}</p>
          <p className="text-sm text-stone-400">{monthInsights.count} wears</p>
        </Card>
      )}

      <Card>
        <p className="text-sm text-stone-400 mb-4">{format(month, 'MMMM yyyy')}</p>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="text-stone-500 py-1">{d}</span>)}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const worn = byDay[key] ?? [];
            const primary = worn[0];
            const color = primary ? FAMILY_COLORS[labels[primary]?.family ?? ''] ?? '#c9a87c' : undefined;
            return (
              <div
                key={key}
                className="min-h-[52px] rounded-xl flex flex-col items-center justify-start pt-1.5 text-[11px] border border-transparent"
                style={color ? { background: `${color}22`, borderColor: `${color}44` } : { background: 'rgba(255,255,255,0.04)' }}
                title={primary ? labels[primary]?.name : undefined}
              >
                <span className={worn.length ? 'font-semibold' : 'text-stone-500'}>{format(day, 'd')}</span>
                {primary && (
                  <span className="text-[8px] leading-tight px-0.5 mt-0.5 line-clamp-2 text-stone-400 max-w-full">
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
          {history.slice(-12).reverse().map((h) => (
            <li key={h.id} className="flex justify-between items-start text-sm gap-3">
              <div>
                <span className="block">{labels[h.fragranceId]?.name ?? '…'}</span>
                {h.compliment && <span className="text-xs text-[var(--color-accent)]">★ compliment</span>}
                {h.rating && <span className="text-xs text-stone-500">Rated {h.rating}/5</span>}
              </div>
              <span className="text-stone-500 shrink-0 text-xs">{format(new Date(h.wornAt), 'MMM d')}</span>
            </li>
          ))}
        </ul>
        {!history.length && <p className="text-stone-500 text-sm">No wears logged yet. Tap &quot;Wear this today&quot; on the home screen.</p>}
      </Card>
      <Link to="/analytics" className="text-sm text-[var(--color-accent)]">View full analytics →</Link>
    </div>
  );
}
