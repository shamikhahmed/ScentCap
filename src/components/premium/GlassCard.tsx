import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function GlassCard({
  className,
  children,
  delay = 0,
  glow,
  padding = 'default',
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  glow?: string;
  padding?: 'none' | 'default' | 'lg';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'glass-premium relative overflow-hidden',
        padding === 'default' && 'p-5',
        padding === 'lg' && 'p-6 md:p-8',
        padding === 'none' && 'p-0',
        className,
      )}
      style={glow ? { '--card-glow': glow } as React.CSSProperties : undefined}
    >
      {glow && <div className="glass-premium-glow" aria-hidden />}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
