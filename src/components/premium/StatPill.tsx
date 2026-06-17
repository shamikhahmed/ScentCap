import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PressableLink } from '@/components/ui/PressableScale';

export function StatPill({
  icon,
  label,
  value,
  tone = 'default',
  delay = 0,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'hot' | 'warn' | 'good';
  delay?: number;
  to?: string;
}) {
  const className = cn('stat-pill', tone !== 'default' && `stat-pill--${tone}`);

  const inner = (
    <>
      <div className="stat-pill-icon">{icon}</div>
      <div>
        <p className="stat-pill-label">{label}</p>
        <p className="stat-pill-value">{value}</p>
      </div>
    </>
  );

  if (to) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PressableLink to={to} className={className} aria-label={`${label}: ${value}`}>
          {inner}
        </PressableLink>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {inner}
    </motion.div>
  );
}
