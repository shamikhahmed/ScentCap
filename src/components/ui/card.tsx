import { GlassCard } from '@/components/premium/GlassCard';
import { cn } from '@/lib/utils';

export function Card({
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
    <GlassCard className={cn(className)} delay={delay} glow={glow} padding={padding}>
      {children}
    </GlassCard>
  );
}
