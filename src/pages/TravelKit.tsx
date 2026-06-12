import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Luggage } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { getFragrance, getTravelKitPlan, saveTravelKitPlan } from '@/db';
import type { Fragrance } from '@/types';
import { FamilyIcon } from '@/components/ui/FamilyIcon';

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 3;
  const a = new Date(start);
  const b = new Date(end);
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(14, diff));
}

export function TravelKit() {
  const { collection } = useApp();
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [picked, setPicked] = useState<{ f: Fragrance; itemId: string }[]>([]);

  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    getTravelKitPlan().then((plan) => {
      if (plan) {
        setTripName(plan.tripName);
        setStartDate(plan.startDate);
        setEndDate(plan.endDate);
      } else {
        const today = new Date();
        const end = new Date(today);
        end.setDate(end.getDate() + 2);
        setStartDate(today.toISOString().slice(0, 10));
        setEndDate(end.toISOString().slice(0, 10));
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      saveTravelKitPlan({ tripName, startDate, endDate });
    }, 400);
    return () => clearTimeout(timer);
  }, [tripName, startDate, endDate, loaded]);

  useEffect(() => {
    (async () => {
      const items = await Promise.all(
        collection
          .filter((c) => c.bottleLevel !== 'empty')
          .map(async (c) => ({ c, f: await getFragrance(c.fragranceId) })),
      );
      const valid = items.filter((x) => x.f) as { c: typeof collection[0]; f: Fragrance }[];
      const sorted = valid.sort((a, b) => {
        const score = (f: Fragrance) => f.heat_score + f.casual_score + (f.concentration === 'EDP' ? 10 : 0);
        return score(b.f) - score(a.f);
      });
      const count = days <= 3 ? 2 : days <= 7 ? 3 : 4;
      setPicked(sorted.slice(0, count).map((x) => ({ f: x.f, itemId: x.c.id })));
    })();
  }, [collection, days]);

  const dateLabel = startDate && endDate
    ? `${new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : null;

  return (
    <div className="safe-pt py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Luggage className="text-[var(--color-accent)]" />
        <div>
          <h1 className="text-2xl font-semibold">Travel kit</h1>
          <p className="text-sm text-stone-400">Pack light — max projection, TSA-friendly picks</p>
        </div>
      </div>

      <Card className="space-y-4">
        <div>
          <label htmlFor="trip-name" className="text-xs uppercase text-stone-500">Trip name</label>
          <input
            id="trip-name"
            type="text"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            placeholder="e.g. Dubai work trip"
            className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="trip-start" className="text-xs uppercase text-stone-500">Start</label>
            <input
              id="trip-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]/50"
            />
          </div>
          <div>
            <label htmlFor="trip-end" className="text-xs uppercase text-stone-500">End</label>
            <input
              id="trip-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm outline-none focus:border-[var(--color-accent)]/50"
            />
          </div>
        </div>
        <p className="text-sm text-stone-400">
          {tripName ? <strong className="text-stone-200">{tripName}</strong> : 'Your trip'}
          {dateLabel ? ` · ${dateLabel}` : ''}
          {' · '}
          <strong className="text-stone-200">{days} days</strong>
          {' · '}
          {picked.length} bottle{picked.length !== 1 ? 's' : ''} recommended
        </p>
      </Card>

      <div className="space-y-3">
        {picked.map(({ f, itemId }, i) => (
          <Link key={itemId} to={`/fragrance/${itemId}`}>
            <Card className="flex items-center gap-4 py-4">
              <span className="text-2xl font-bold text-stone-600">{i + 1}</span>
              <FamilyIcon family={f.family} size={18} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-500">{f.brand}</p>
                <p className="font-medium truncate">{f.name}</p>
                <p className="text-xs text-[var(--color-accent)]">{f.concentration}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {!picked.length && <Card className="text-center py-8 text-stone-400">Add bottles to plan a travel kit.</Card>}
      <Link to="/"><Button variant="ghost" className="w-full">Back to Today</Button></Link>
    </div>
  );
}
