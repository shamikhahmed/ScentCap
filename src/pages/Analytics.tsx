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

const COLORS = ['#c9a87c', '#8b7355', '#6b5b45', '#a89070', '#d4bc96'];

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
      <EmptyState
        eyebrow="Analytics"
        title="Nothing to analyze yet"
        description="Add bottles to your wardrobe and log a few wears. Rotation health, family breakdown, and value insights appear here."
        action={{ label: 'Add a bottle', to: '/add' }}
      />
    );
  }

  return (
    <div className="safe-pt px-5 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card><p className="text-xs text-stone-500">Value</p><p className="text-2xl font-semibold">{formatCurrency(stats.totalValue)}</p></Card>
        <Card><p className="text-xs text-stone-500">Volume</p><p className="text-2xl font-semibold">{stats.totalMl} ml</p></Card>
        <Card><p className="text-xs text-stone-500">Rotation health</p><p className="text-2xl font-semibold">{stats.rotation}%</p></Card>
        <Card><p className="text-xs text-stone-500">Designer / Niche / ME</p><p className="text-lg font-semibold">{stats.designer} / {stats.niche} / {stats.me}</p></Card>
        <Card><p className="text-xs text-stone-500">Wear streak</p><p className="text-2xl font-semibold">{stats.streak}d</p></Card>
        <Card><p className="text-xs text-stone-500">This month</p><p className="text-2xl font-semibold">{stats.monthWears}</p></Card>
        <Card><p className="text-xs text-stone-500">Compliments</p><p className="text-2xl font-semibold">{stats.compliments}</p></Card>
        <Card><p className="text-xs text-stone-500">Versatile scents</p><p className="text-2xl font-semibold">{stats.versatile}</p></Card>
        <Card><p className="text-xs text-stone-500">Avg projection</p><p className="text-lg font-semibold">{stats.avgProjection}</p></Card>
        <Card><p className="text-xs text-stone-500">Avg longevity</p><p className="text-lg font-semibold">{stats.avgLongevity}</p></Card>
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
