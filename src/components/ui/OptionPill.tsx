import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticSelection } from '@/lib/premium/haptics';
import { SPRING_PRESS } from '@/lib/premium/motion';

export function OptionPill({
  label,
  selected,
  onSelect,
  className,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      transition={SPRING_PRESS}
      onClick={() => {
        if (!selected) hapticSelection();
        onSelect();
      }}
      className={cn(
        'relative rounded-full px-4 py-2 text-sm font-medium min-h-[40px] transition-colors overflow-hidden',
        selected
          ? 'bg-[var(--color-accent)] text-white'
          : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]',
        className,
      )}
    >
      <span className="relative z-10 flex items-center gap-1.5">
        <AnimatePresence mode="wait" initial={false}>
          {selected && (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="inline-flex"
            >
              <Check size={14} strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
        {label}
      </span>
    </motion.button>
  );
}
