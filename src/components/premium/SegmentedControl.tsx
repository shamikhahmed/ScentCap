import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { hapticSelection } from '@/lib/premium/haptics';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('segment-premium', className)} role="tablist" aria-label="View options">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!active) {
                hapticSelection();
                onChange(opt.value);
              }
            }}
            className={cn('segment-premium-item min-h-[44px]', active && 'segment-premium-item--active')}
          >
            {active && (
              <motion.span
                layoutId="segment-pill"
                className="segment-premium-indicator"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
