import { Droplets, Flower2, TreePine, Flame, Candy } from 'lucide-react';
import { FAMILY_COLORS } from '@/lib/stats';
import { SC_ACCENT } from '@/design/tokens';

const MAP: Record<string, typeof Droplets> = {
  Fresh: Droplets,
  Floral: Flower2,
  Woody: TreePine,
  Oriental: Flame,
  Gourmand: Candy,
};

export function FamilyIcon({ family, size = 20 }: { family?: string; size?: number }) {
  const Icon = MAP[family ?? ''] ?? Droplets;
  // Hex only — callers append alpha suffixes (`${color}22`).
  const color = FAMILY_COLORS[family ?? ''] ?? SC_ACCENT;
  return (
    <div
      className="rounded-xl flex items-center justify-center"
      style={{ width: size * 2, height: size * 2, background: `${color}22`, color }}
    >
      <Icon size={size} />
    </div>
  );
}
