import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartFrame } from '@/components/ui/ChartFrame';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApp } from '@/context/AppContext';
import { getFragrance } from '@/db';
import { formatCurrency } from '@/lib/utils';
import {
  FAMILY_COLORS,
  avgLongevityLabel,
  avgProjectionLabel,
  blindSpotBottles,
  complimentCount,
  costPerWearRows,
  leastWornIds,
  rotationHealth,
  versatileFragranceCount,
  wearStreak,
  wearsThisMonth,
} from '@/lib/stats';

const COLORS = ['#0c6b5c', '#3dbaa4', '#1a8f7a', '#5a9e92', '#94c9be'];

export function AnalyticsPage() {
  const { collection, history } = useApp();
  const [fragrances, setFragrances] = useState<Map<string, Awaited<ReturnType<typeof getFragrance>>>>(new Map());

  useEffect(() => {
    Promise.all(collection.map(async (c) => [c.fragranceId, await getFragrance(c.fragranceId)] as const))
      .then((pairs) => setFragrances(new Map(pairs)));
  }, [collection]);

  const allFragrances = useMemo(
    () => [...fragrances.values()].filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getFragrance>>>[],
    [fragrances],
  );

  const stats = useMemo(() => {
    const wearCount: Record<string, number> = {};
    for (const h of history) wearCount[h.fragranceId] = (wearCount[h.fragranceId] ?? 0) + 1;

    const familyDist: Record<string, number> = {};
    let designer = 0, niche = 0, me = 0;
    let totalValue = 0, totalMl = 0;

    for (const c of collection) {
      const f = fragrances.get(c.fragranceId);
      if (!f) continue;
      familyDist[f.family] = (familyDist[f.family] ?? 0) + 1;
      if (f.category === 'niche') niche++;
      else if (f.category === 'middleEastern') me++;
      else designer++;
      totalValue += c.purchasePrice ?? 0;
      totalMl += c.bottleSizeMl ?? 100;
    }

    const mostWorn = Object.entries(wearCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, count]) => {
        const f = fragrances.get(id);
        return { name: f ? f.name.slice(0, 12) : id, count };
      });

    const leastWorn = leastWornIds(collection, history, 5).map((id) => {
      const f = fragrances.get(id);
      return { name: f ? f.name.slice(0, 12) : id, count: wearCount[id] ?? 0 };
    });

    const pie = Object.entries(familyDist).map(([name, value]) => ({ name, value }));

    const nameById = new Map<string, string>();
    for (const [id, f] of fragrances) {
      if (f) nameById.set(id, `${f.brand} ${f.name}`);
    }

    const costRows = costPerWearRows(collection, history, nameById).slice(0, 6);
    const blindSpots = blindSpotBottles(collection, history, nameById);

    return {
      designer, niche, me, totalValue, totalMl,
      mostWorn, leastWorn, pie, costRows, blindSpots,
      rotation: rotationHealth(collection, history),
      streak: wearStreak(history),
      monthWears: wearsThisMonth(history),
      compliments: complimentCount(history),
      versatile: versatileFragranceCount(history),
      avgProjection: avgProjectionLabel(allFragrances),
      avgLongevity: avgLongevityLabel(allFragrances),
    };
  }, [collection, history, fragrances, allFragrances]);

  if (!collection.length) {
    return (
      <div className="atelier-page">
        <EmptyState
          eyebrow="Analytics"
          title="Nothing to analyze yet"
          description="Add bottles to your wardrobe and log a few wears. Rotation health, family breakdown, and value insights appear here."
          action={{ label: 'Add a bottle', to: '/add' }}
        />
      </div>
    );
  }

  return (
    <div className="atelier-page space-y-6">
      <header>
        <p className="atelier-page__brand">Insights</p>
        <h1 className="atelier-page__title">Analytics</h1>
        <p className="atelier-page__sub">Wardrobe health, value, and wear patterns.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card><p className="text-xs text-[var(--sc-text-muted)]">Value</p><p className="text-2xl font-semibold">{formatCurrency(stats.totalValue)}</p></Card>
        <Card><p className="text-xs text-[var(--sc-text-muted)]">Volume</p><p className="text-2xl font-semibold">{stats.totalMl} ml</p></Card>
        <Card><p className="text-xs text-[var(--sc-text-muted)]">Rotation health</p><p className="text-2xl font-semibold">{stats.rotation}%</p>
          <p className="text-[11px] text-[var(--sc-text-muted)] mt-1">Share of wardrobe worn at least once — a fragrance journal, not a streak score.</p>
        </Card>
        <Card><p className="text-xs text-[var(--sc-text-muted)]">Designer / Niche / ME</p><p className="text-lg font-semibold">{stats.designer} / {stats.niche} / {stats.me}</p></Card>
        <Card><p className="text-xs text-[var(--sc-text-muted)]">Wear streak</p><p className="text-2xl font-semibold">{stats.streak}d</p></Card>
        <Card><p className="text-xs text-[var(--sc-text-muted)]">This month</p><p className="text-2xl font-semibold">{stats.monthWears}</p></Card>
        <Card><p className="text-xs text-[var(--sc-text-muted)]">Compliments</p><p className="text-2xl font-semibold">{stats.compliments}</p></Card>
        <Card><p className="text-xs text-[var(--sc-text-muted)]">Versatile scents</p><p className="text-2xl font-semibold">{stats.versatile}</p></Card>
        <Card><p className="text-xs text-[var(--sc-text-muted)]">Avg projection</p><p className="text-lg font-semibold">{stats.avgProjection}</p></Card>
        <Card><p className="text-xs text-[var(--sc-text-muted)]">Avg longevity</p><p className="text-lg font-semibold">{stats.avgLongevity}</p></Card>
      </div>

      {stats.costRows.length > 0 && (
        <Card>
          <p className="font-medium mb-1">Cost per wear</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Bottles with a logged price — higher means under-worn spend.</p>
          <ul className="space-y-3">
            {stats.costRows.map((row) => (
              <li key={row.collectionId}>
                <Link to={`/fragrance/${row.collectionId}`} className="flex justify-between items-center gap-3 text-sm hover:text-[var(--color-accent)]">
                  <span className="truncate">{row.name}</span>
                  <span className="shrink-0 text-right">
                    {row.costPerWear != null ? (
                      <span className="font-semibold">{formatCurrency(row.costPerWear)}<span className="text-[var(--color-text-tertiary)] font-normal">/wear</span></span>
                    ) : (
                      <span className="text-[var(--color-text-tertiary)]">No wears yet</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {stats.blindSpots.length > 0 && (
        <Card className="border-orange-500/20">
          <p className="font-medium mb-1">Blind spots</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Pricier bottles not worn in 30+ days — money on the shelf.</p>
          <ul className="space-y-3">
            {stats.blindSpots.map((row) => (
              <li key={row.collectionId}>
                <Link to={`/fragrance/${row.collectionId}`} className="flex justify-between items-center gap-3 text-sm hover:text-[var(--color-accent)]">
                  <span className="truncate">{row.name}</span>
                  <span className="shrink-0 text-orange-400 text-xs font-semibold">
                    {row.daysSince == null ? 'Never worn' : `${row.daysSince}d idle`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {stats.mostWorn.length > 0 && (
        <Card>
          <p className="font-medium mb-4">Most worn</p>
          <ChartFrame height={192}>
            {(w, h) => (
              <BarChart width={w} height={h} data={stats.mostWorn}>
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }} />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ChartFrame>
        </Card>
      )}

      {stats.leastWorn.length > 0 && (
        <Card>
          <p className="font-medium mb-4">Least worn</p>
          <ChartFrame height={192}>
            {(w, h) => (
              <BarChart width={w} height={h} data={stats.leastWorn}>
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }} />
                <Bar dataKey="count" fill="var(--color-text-secondary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ChartFrame>
        </Card>
      )}

      {stats.pie.length > 0 && (
        <Card>
          <p className="font-medium mb-4">Family breakdown</p>
          <ChartFrame height={192}>
            {(w, h) => (
              <PieChart width={w} height={h}>
                <Pie data={stats.pie} dataKey="value" nameKey="name" cx={w / 2} cy={h / 2} outerRadius={70} label={({ name, value }) => `${name} (${value})`}>
                  {stats.pie.map((entry, i) => (
                    <Cell key={entry.name} fill={FAMILY_COLORS[entry.name] ?? COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ChartFrame>
        </Card>
      )}
    </div>
  );
}
