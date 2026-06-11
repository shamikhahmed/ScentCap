import { motion } from 'framer-motion';

const ORBS = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  x: 10 + (i * 17) % 80,
  y: 5 + (i * 23) % 60,
  size: 120 + (i % 3) * 80,
  delay: i * 0.4,
}));

export function MistBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {ORBS.map((o) => (
        <motion.div
          key={o.id}
          className="absolute rounded-full blur-3xl opacity-[0.18]"
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: o.size,
            height: o.size,
            background: o.id % 2 ? 'radial-gradient(circle, #c9a87c, transparent)' : 'radial-gradient(circle, #7c5cbf, transparent)',
          }}
          animate={{ y: [0, -18, 0], x: [0, 8, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 8 + o.id, repeat: Infinity, ease: 'easeInOut', delay: o.delay }}
        />
      ))}
    </div>
  );
}
