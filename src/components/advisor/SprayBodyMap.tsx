import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ZONES = [
  { id: 'neck', label: 'Neck', x: 50, y: 22, active: (s: string[]) => s.some((x) => /neck|ears/i.test(x)) },
  { id: 'chest', label: 'Chest', x: 50, y: 38, active: (s: string[]) => s.some((x) => /chest/i.test(x)) },
  { id: 'wrists', label: 'Wrists', x: 28, y: 52, active: (s: string[]) => s.some((x) => /wrist|pulse/i.test(x)) },
  { id: 'wrists-r', label: 'Wrists', x: 72, y: 52, active: (s: string[]) => s.some((x) => /wrist|pulse/i.test(x)) },
  { id: 'clothes', label: 'Clothes', x: 50, y: 68, active: (s: string[]) => s.some((x) => /cloth|collar|scarf/i.test(x)) },
];

export function SprayBodyMap({
  pulsePoints,
  skinAreas,
  clothingAreas,
  sprays,
}: {
  pulsePoints: string[];
  skinAreas: string[];
  clothingAreas: string[];
  sprays: number;
}) {
  const all = [...pulsePoints, ...skinAreas, ...clothingAreas];

  return (
    <div className="relative mx-auto w-full max-w-[200px]">
      <svg viewBox="0 0 100 120" className="w-full opacity-90">
        <ellipse cx="50" cy="18" rx="12" ry="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
        <path d="M35 32 Q50 28 65 32 L70 95 Q50 102 30 95 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      </svg>
      {ZONES.map((z, i) => {
        const on = z.active(all);
        return (
          <motion.div
            key={z.id + i}
            className={cn(
              'absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2',
              on ? 'bg-[var(--color-accent)] border-white/40 shadow-[0_0_12px_rgba(201,168,124,0.8)]' : 'bg-white/10 border-white/20',
            )}
            style={{ left: `${z.x}%`, top: `${z.y}%` }}
            animate={on ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: on ? Infinity : 0 }}
          />
        );
      })}
      <p className="text-center text-xs text-stone-500 mt-3">{sprays} spray{sprays !== 1 ? 's' : ''} · highlighted zones</p>
    </div>
  );
}
