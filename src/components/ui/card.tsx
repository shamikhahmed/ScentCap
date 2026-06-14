import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: 'easeOut' }}
      className={cn('surface-card rounded-2xl p-5', className)}
    >
      {children}
    </motion.div>
  );
}
