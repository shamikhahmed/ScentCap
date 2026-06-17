import { motion } from 'framer-motion';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  trailing,
  large,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  large?: boolean;
}) {
  return (
    <motion.header
      className="flex items-start justify-between gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className={`font-semibold tracking-tight leading-[1.1] ${large ? 'text-display' : 'text-title'}`}>
          {title}
        </h1>
        {subtitle && (
          <div className="text-subhead text-[var(--color-text-secondary)] mt-2 leading-relaxed">{subtitle}</div>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </motion.header>
  );
}
