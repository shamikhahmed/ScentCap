import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { PageHeader, Ring, Section } from '@/components/kit';
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
import { ANALYTICS_COLORS as COLORS } from '@/design/tokens';

export function AnalyticsPage() {
  const { collection, history } = useApp();
  const [fragrances, setFragrances] = useState<Map<string, Awaited<ReturnType<typeof getFragrance>>>>(new Map());

  useEffect(() => {
    Promise.all(collection.map(async (c) => [c.fragranceId, await getFragrance(c.fragranceId)] as const)).then((pairs) =>
      setFragrances(new Map(pairs)),
    );
  }, [collection]);

  const allFragrances = useMemo(
    () => [...fragrances.values()].filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getFragrance>>>[],
    [fragrances],
  );

  const stats = useMemo(() => {
    const wearCount: Record<string, number> = {};
    for (const h of history) wearCount[h.fragranceId] = (wearCount[h.fragranceId] ?? 0) + 1;

    const familyDist: Record<string, number> = {};
    let designer = 0,
      niche = 0,
      me = 0;
    let totalValue = 0,
      totalMl = 0;

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

    const mostWorn = Object.entries(wearCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
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
      designer,
      niche,
      me,
      totalValue,
      totalMl,
      mostWorn,
      leastWorn,
      pie,
      costRows,
      blindSpots,
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

  const widgets: { label: string; value: string; unit?: string }[] = [
    { label: 'Value', value: formatCurrency(stats.totalValue) },
    { label: 'Volume', value: String(stats.totalMl), unit: 'ml' },
    { label: 'This month', value: String(stats.monthWears) },
    { label: 'Wear streak', value: String(stats.streak), unit: 'd' },
    { label: 'Compliments', value: String(stats.compliments) },
    { label: 'Versatile', value: String(stats.versatile) },
    { label: 'Avg projection', value: stats.avgProjection },
    { label: 'Avg longevity', value: stats.avgLongevity },
  ];

  return (
    <div className="ui-page">
      <PageHeader eyebrow="Insights" title="Analytics" subtitle="Wardrobe health, value, and wear patterns." />

      <div className="ui-card flex items-center gap-4 mb-4">
        <Ring value={stats.rotation} size={64} label={`Rotation ${stats.rotation}%`} />
        <div>
          <p className="font-semibold">Rotation health</p>
          <p className="ui-footnote mt-1">Share of wardrobe worn at least once.</p>
          <p className="ui-footnote mt-2">
            Designer {stats.designer} · Niche {stats.niche} · ME {stats.me}
          </p>
        </div>
      </div>

      <div className="ui-widgets">
        {widgets.map((w) => (
          <div key={w.label} className="ui-widget">
            <p className="ui-widget__label">{w.label}</p>
            <p className="ui-widget__value">
              {w.value}
              {w.unit ? <span className="ui-widget__unit">{w.unit}</span> : null}
            </p>
          </div>
        ))}
      </div>

      {stats.costRows.length > 0 && (
        <Section title="Cost per wear" className="mt-2">
          <p className="ui-list-footer !mt-0 !mb-2">Bottles with a logged price — higher means under-worn spend.</p>
          <div className="ui-list">
            {stats.costRows.map((row) => (
              <Link key={row.collectionId} to={`/fragrance/${row.collectionId}`} className="ui-row">
                <div className="ui-row__main">
                  <p className="ui-row__title truncate">{row.name}</p>
                </div>
                <span className="ui-row__value">
                  {row.costPerWear != null ? `${formatCurrency(row.costPerWear)}/wear` : 'No wears yet'}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {stats.blindSpots.length > 0 && (
        <Section title="Blind spots">
          <p className="ui-list-footer !mt-0 !mb-2">Pricier bottles not worn in 30+ days.</p>
          <div className="ui-list">
            {stats.blindSpots.map((row) => (
              <Link key={row.collectionId} to={`/fragrance/${row.collectionId}`} className="ui-row">
                <div className="ui-row__main">
                  <p className="ui-row__title truncate">{row.name}</p>
                </div>
                <span className="ui-row__value text-[var(--warning)]">
                  {row.daysSince == null ? 'Never worn' : `${row.daysSince}d idle`}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {stats.mostWorn.length > 0 && (
        <Section title="Most worn">
          <div className="ui-card">
            <ChartFrame height={192}>
              {(w, h) => (
                <BarChart width={w} height={h} data={stats.mostWorn}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--label-3)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--label-3)', fontSize: 10 }} />
                  <Bar dataKey="count" fill="var(--tint)" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ChartFrame>
          </div>
        </Section>
      )}

      {stats.leastWorn.length > 0 && (
        <Section title="Least worn">
          <div className="ui-card">
            <ChartFrame height={192}>
              {(w, h) => (
                <BarChart width={w} height={h} data={stats.leastWorn}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--label-3)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--label-3)', fontSize: 10 }} />
                  <Bar dataKey="count" fill="var(--label-3)" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ChartFrame>
          </div>
        </Section>
      )}

      {stats.pie.length > 0 && (
        <Section title="Family breakdown">
          <div className="ui-card">
            <ChartFrame height={192}>
              {(w, h) => (
                <PieChart width={w} height={h}>
                  <Pie
                    data={stats.pie}
                    dataKey="value"
                    nameKey="name"
                    cx={w / 2}
                    cy={h / 2}
                    outerRadius={70}
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {stats.pie.map((entry, i) => (
                      <Cell key={entry.name} fill={FAMILY_COLORS[entry.name] ?? COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ChartFrame>
          </div>
        </Section>
      )}
    </div>
  );
}
