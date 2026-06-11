import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { getFragrance } from '@/db';
import type { Fragrance } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { BottleCard } from '@/components/collection/BottleCard';
import { FAMILY_COLORS } from '@/lib/stats';

export function CollectionPage() {
  const { collection } = useApp();
  const [items, setItems] = useState<{ c: typeof collection[0]; f?: Fragrance }[]>([]);
  const [q, setQ] = useState('');
  const [family, setFamily] = useState<string | null>(null);

  useEffect(() => {
    Promise.all(collection.map(async (c) => ({ c, f: await getFragrance(c.fragranceId) }))).then(setItems);
  }, [collection]);

  const families = useMemo(() => [...new Set(items.map((i) => i.f?.family).filter(Boolean))] as string[], [items]);

  const filtered = items.filter(({ f }) => {
    if (family && f?.family !== family) return false;
    if (!q) return true;
    const s = `${f?.brand} ${f?.name}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const totalValue = collection.reduce((s, c) => s + (c.purchasePrice ?? 0), 0);

  return (
    <div className="safe-pt px-5 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Wardrobe</p>
          <h1 className="text-3xl font-semibold mt-1">{collection.length} bottles</h1>
          <p className="text-stone-400 text-sm">{formatCurrency(totalValue)} collection value</p>
        </div>
        <Link to="/add"><Button size="sm"><Plus size={16} /></Button></Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
        <input
          className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 outline-none focus:border-[var(--color-accent)]"
          placeholder="Search your wardrobe…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        <button type="button" onClick={() => setFamily(null)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${!family ? 'bg-[var(--color-accent)] text-stone-950' : 'bg-white/5'}`}>All</button>
        {families.map((fam) => (
          <button
            key={fam}
            type="button"
            onClick={() => setFamily(fam)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${family === fam ? 'bg-[var(--color-accent)] text-stone-950' : 'bg-white/5'}`}
            style={family === fam ? {} : { borderLeft: `3px solid ${FAMILY_COLORS[fam] ?? '#c9a87c'}` }}
          >
            {fam}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(({ c, f }, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <BottleCard c={c} f={f} />
          </motion.div>
        ))}
      </div>

      {!collection.length && (
        <Card className="text-center py-12">
          <p className="text-stone-400 mb-4">Your wardrobe is empty</p>
          <Link to="/add"><Button>Add your first bottle</Button></Link>
        </Card>
      )}
    </div>
  );
}
