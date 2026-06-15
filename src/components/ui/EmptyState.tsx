import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MistBackground } from '@/components/home/MistBackground';

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: { label: string; to: string };
  secondary?: { label: string; onClick: () => void; loading?: boolean };
}

export function EmptyState({ eyebrow, title, description, action, secondary }: EmptyStateProps) {
  return (
    <div className="relative min-h-[60dvh] flex flex-col items-center justify-center px-6 py-12 text-center">
      <MistBackground />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 max-w-sm"
      >
        <div className="welcome-orb mx-auto mb-8" />
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-semibold tracking-tight mt-3">{title}</h2>
        <p className="text-[var(--color-text-secondary)] mt-4 leading-relaxed">{description}</p>
        <div className="flex flex-col gap-3 mt-8">
          {action && (
            <Link to={action.to} className="inline-block">
              <Button size="lg" className="w-full min-w-[200px]">{action.label}</Button>
            </Link>
          )}
          {secondary && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={secondary.onClick}
              disabled={secondary.loading}
            >
              {secondary.loading ? 'Loading…' : secondary.label}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
