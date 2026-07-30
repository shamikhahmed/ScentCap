import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
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

function suggestCount(days: number): number {
  return days <= 3 ? 2 : days <= 7 ? 3 : 4;
}

export function TravelKit() {
  const { collection } = useApp();
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [picked, setPicked] = useState<{ f: Fragrance; itemId: string }[]>([]);
  const [allBottles, setAllBottles] = useState<{ f: Fragrance; itemId: string }[]>([]);

  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    getTravelKitPlan().then((plan) => {
      if (plan) {
        setTripName(plan.tripName);
        setStartDate(plan.startDate);
        setEndDate(plan.endDate);
        setManualMode(plan.manualMode ?? false);
        setPickedIds(plan.pickedIds ?? []);
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
      saveTravelKitPlan({ tripName, startDate, endDate, pickedIds, manualMode });
    }, 400);
    return () => clearTimeout(timer);
  }, [tripName, startDate, endDate, pickedIds, manualMode, loaded]);

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
      setAllBottles(sorted.map((x) => ({ f: x.f, itemId: x.c.id })));

      if (!manualMode) {
        setPickedIds(sorted.slice(0, suggestCount(days)).map((x) => x.c.id));
      }
    })();
  }, [collection, days, manualMode]);

  useEffect(() => {
    const rows = pickedIds
      .map((id) => allBottles.find((b) => b.itemId === id))
      .filter(Boolean) as { f: Fragrance; itemId: string }[];
    setPicked(rows);
  }, [pickedIds, allBottles]);

  const togglePick = (itemId: string) => {
    setPickedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const dateLabel = startDate && endDate
    ? `${new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : null;

  return (
    <div className="atelier-page space-y-6">
      <header>
        <p className="atelier-page__brand">Pack</p>
        <h1 className="atelier-page__title">Travel kit</h1>
        <p className="atelier-page__sub">Pack light — max projection, TSA-friendly picks. General guidance only — check airline rules.</p>
      </header>

      <Card className="space-y-4">
        <div>
          <label htmlFor="trip-name" className="text-xs uppercase text-[var(--sc-text-muted)]">Trip name</label>
          <input
            id="trip-name"
            type="text"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            placeholder="e.g. Dubai work trip"
            className="atelier-input mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="trip-start" className="text-xs uppercase text-[var(--sc-text-muted)]">Start</label>
            <input
              id="trip-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="atelier-input mt-1"
            />
          </div>
          <div>
            <label htmlFor="trip-end" className="text-xs uppercase text-[var(--sc-text-muted)]">End</label>
            <input
              id="trip-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="atelier-input mt-1"
            />
          </div>
        </div>
        <div className="flex gap-2" role="group" aria-label="Kit mode">
          <Button size="sm" className="min-h-[44px]" aria-pressed={!manualMode} variant={!manualMode ? 'default' : 'ghost'} onClick={() => setManualMode(false)}>
            Auto suggest
          </Button>
          <Button size="sm" className="min-h-[44px]" aria-pressed={manualMode} variant={manualMode ? 'default' : 'ghost'} onClick={() => setManualMode(true)}>
            Pick manually
          </Button>
        </div>
        <p className="text-sm text-[var(--sc-text-soft)]">
          {tripName ? <strong className="text-[var(--sc-text)]">{tripName}</strong> : 'Your trip'}
          {dateLabel ? ` · ${dateLabel}` : ''}
          {' · '}
          <strong className="text-[var(--sc-text)]">{days} days</strong>
          {' · '}
          {picked.length} bottle{picked.length !== 1 ? 's' : ''} {manualMode ? 'picked' : 'recommended'}
        </p>
      </Card>

      {manualMode && (
        <Card className="space-y-2">
          <p className="text-xs uppercase text-[var(--sc-text-muted)] mb-2">Your collection</p>
          {allBottles.map(({ f, itemId }) => {
            const selected = pickedIds.includes(itemId);
            return (
              <button
                key={itemId}
                type="button"
                onClick={() => togglePick(itemId)}
                className={`w-full flex items-center gap-3 py-2 px-2 rounded-xl text-left transition-colors ${
                  selected ? 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40' : 'hover:bg-[var(--sc-surface)]'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${selected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--sc-border)]'}`}>
                  {selected && <Check size={14} className="text-white" />}
                </span>
                <FamilyIcon family={f.family} size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--sc-text-muted)]">{f.brand}</p>
                  <p className="font-medium truncate text-sm">{f.name}</p>
                </div>
              </button>
            );
          })}
          {!allBottles.length && <p className="text-sm text-[var(--sc-text-muted)]">Add bottles to your wardrobe first.</p>}
        </Card>
      )}

      <div className="space-y-3">
        {picked.map(({ f, itemId }, i) => (
          <Link key={itemId} to={`/fragrance/${itemId}`}>
            <Card className="flex items-center gap-4 py-4">
              <span className="text-2xl font-bold text-[var(--sc-text-muted)]">{i + 1}</span>
              <FamilyIcon family={f.family} size={18} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--sc-text-muted)]">{f.brand}</p>
                <p className="font-medium truncate">{f.name}</p>
                <p className="text-xs text-[var(--color-accent)]">{f.concentration}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {!picked.length && <Card className="text-center py-8 text-[var(--sc-text-soft)]">Add bottles to plan a travel kit.</Card>}
      <Button to="/" variant="ghost" className="w-full">Back to Today</Button>
    </div>
  );
}
