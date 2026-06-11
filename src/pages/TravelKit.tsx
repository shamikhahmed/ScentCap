import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Luggage } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { getFragrance } from '@/db';
import type { Fragrance } from '@/types';
import { FamilyIcon } from '@/components/ui/FamilyIcon';

export function TravelKit() {
  const { collection } = useApp();
  const [days, setDays] = useState(3);
  const [picked, setPicked] = useState<{ f: Fragrance; itemId: string }[]>([]);

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

  return (
    <div className="safe-pt px-5 py-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Luggage className="text-[var(--color-accent)]" />
        <div>
          <h1 className="text-2xl font-semibold">Travel kit</h1>
          <p className="text-sm text-stone-400">Pack light — max projection, TSA-friendly picks</p>
        </div>
      </div>

      <Card>
        <p className="text-sm mb-3">Trip length: <strong>{days} days</strong></p>
        <input type="range" min={1} max={14} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full" />
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
