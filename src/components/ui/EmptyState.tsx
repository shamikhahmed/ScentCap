import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AmbientBackground } from '@/components/premium/AmbientBackground';
import { BrandMark } from '@/components/premium/BrandMark';
import { CyclingShimmerText, DEMO_LOADING_MESSAGES } from '@/components/ui/CyclingShimmerText';

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: { label: string; to: string };
  secondary?: { label: string; onClick: () => void; loading?: boolean };
}

export function EmptyState({ eyebrow, title, description, action, secondary }: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[65dvh] flex flex-col items-center justify-center px-6 py-14 text-center">
      <AmbientBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 max-w-sm"
      >
        <BrandMark className="mx-auto mb-10" />
        {eyebrow && <p className="text-caption text-[var(--color-text-tertiary)]">{eyebrow}</p>}
        <h2 className="text-display mt-3">{title}</h2>
        <p className="text-subhead text-[var(--color-text-secondary)] mt-4 leading-relaxed max-w-[18rem] mx-auto">
          {description}
        </p>
        <div className="flex flex-col gap-3 mt-10">
          {action && (
            <Button size="lg" className="w-full min-w-[220px] btn-glow" haptic="medium" onClick={() => navigate(action.to)}>
              {action.label}
            </Button>
          )}
          {secondary && (
            secondary.loading ? (
              <CyclingShimmerText messages={DEMO_LOADING_MESSAGES} className="text-center py-3" />
            ) : (
              <Button variant="glass" size="lg" className="w-full" onClick={secondary.onClick} haptic="light">
                {secondary.label}
              </Button>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}
