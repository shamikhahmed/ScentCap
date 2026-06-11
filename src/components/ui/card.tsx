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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn('glass-card rounded-3xl p-5', className)}
    >
      {children}
    </motion.div>
  );
}
