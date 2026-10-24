import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { PageHeader, Section } from '@/components/kit';
import { fragranceDisplayName } from '@/lib/fragranceName';
import { useApp } from '@/context/AppContext';
import { getFragrance, getTravelKitPlan, saveTravelKitPlan } from '@/db';
import type { Fragrance } from '@/types';

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
    <div className="ui-page">
      <PageHeader
        eyebrow="Pack"
        title="Travel kit"
        subtitle="Pack light with max-projection, travel-friendly picks. General guidance only — check airline rules."
      />

      <Section title="Trip" id="travel-trip">
        <div className="ui-list">
          <div className="ui-row">
            <label htmlFor="trip-name" className="ui-row__title shrink-0 w-24">
              Trip name
            </label>
            <input
              id="trip-name"
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="e.g. Dubai work trip"
              className="ui-field ui-field--left"
              autoComplete="off"
            />
          </div>
          <div className="ui-row">
            <label htmlFor="trip-start" className="ui-row__title shrink-0 w-24">
              Start
            </label>
            <input
              id="trip-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="ui-field ui-field--left"
            />
          </div>
          <div className="ui-row">
            <label htmlFor="trip-end" className="ui-row__title shrink-0 w-24">
              End
            </label>
            <input
              id="trip-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="ui-field ui-field--left"
            />
          </div>
          <div className="ui-row" role="group" aria-label="Kit mode">
            <div className="ui-segmented w-full">
              <button type="button" aria-pressed={!manualMode} onClick={() => setManualMode(false)}>
                Auto suggest
              </button>
              <button type="button" aria-pressed={manualMode} onClick={() => setManualMode(true)}>
                Pick manually
              </button>
            </div>
          </div>
        </div>
        <p className="ui-list-footer" aria-live="polite">
          {tripName || 'Your trip'}
          {dateLabel ? ` · ${dateLabel}` : ''}
          {' · '}
          {days} {days === 1 ? 'day' : 'days'}
          {' · '}
          {picked.length} bottle{picked.length !== 1 ? 's' : ''} {manualMode ? 'picked' : 'recommended'}
        </p>
      </Section>

      {manualMode && (
        <Section title="Your collection" id="travel-collection">
          {allBottles.length > 0 ? (
            <div className="ui-list">
              {allBottles.map(({ f, itemId }) => {
                const selected = pickedIds.includes(itemId);
                return (
                  <button
                    key={itemId}
                    type="button"
                    className="ui-row ui-row--media"
                    aria-pressed={selected}
                    onClick={() => togglePick(itemId)}
                  >
                    <div className="w-12 shrink-0">
                      <FragranceThumb fragrance={f} variant="plinth" size="sm" />
                    </div>
                    <div className="ui-row__main">
                      <p className="ui-row__sub">{f.brand}</p>
                      <p className="ui-row__title serif">{fragranceDisplayName(f.name)}</p>
                    </div>
                    <span
                      className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${
                        selected
                          ? 'bg-[var(--tint)] border-[var(--tint)] text-[var(--on-tint)]'
                          : 'border-[var(--label-4)]'
                      }`}
                      aria-hidden
                    >
                      {selected && <Check size={14} />}
                    </span>
                    <span className="sr-only">{selected ? 'Selected' : 'Not selected'}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="ui-secondary">Add bottles to your wardrobe first.</p>
          )}
        </Section>
      )}

      <Section title={manualMode ? 'Your kit' : 'Recommended kit'} id="travel-kit">
        {picked.length > 0 ? (
          <div className="ui-list">
            {picked.map(({ f, itemId }, i) => (
              <Link key={itemId} to={`/fragrance/${itemId}`} className="ui-row ui-row--media">
                <div className="w-12 shrink-0">
                  <FragranceThumb fragrance={f} variant="plinth" size="sm" />
                </div>
                <div className="ui-row__main">
                  <p className="ui-row__sub">
                    {i + 1} · {f.brand}
                  </p>
                  <p className="ui-row__title serif">{fragranceDisplayName(f.name)}</p>
                  <p className="ui-row__sub text-[var(--tint)]">{f.concentration}</p>
                </div>
                <ChevronRight className="ui-chevron" size={18} aria-hidden />
              </Link>
            ))}
          </div>
        ) : (
          <div className="ui-card text-center py-8">
            <p className="ui-secondary">Add bottles to plan a travel kit.</p>
          </div>
        )}
      </Section>

      <Link to="/" className="ui-btn ui-btn--gray ui-btn--block">
        Back to Today
      </Link>
    </div>
  );
}
