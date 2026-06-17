import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.085, delayChildren: 0.06 },
  },
};

const line = {
  hidden: { y: '110%', opacity: 0, rotate: 2 },
  show: {
    y: 0,
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/** Apple-keynote kinetic headline — line-by-line reveal */
export function CapKineticHeadline({
  lines,
  className,
  gradient = false,
}: {
  lines: string[];
  className?: string;
  gradient?: boolean;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={className}>
        {lines.map((l) => (
          <span key={l} className="block">{l}</span>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn('cap-kinetic', gradient && 'cap-kinetic-gradient', className)}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {lines.map((text) => (
        <span key={text} className="cap-kinetic-line block overflow-hidden">
          <motion.span variants={line} className="inline-block">
            {text}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
}
