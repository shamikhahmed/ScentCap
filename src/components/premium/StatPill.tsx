import { cn } from '@/lib/utils';
import { PressableLink } from '@/components/ui/PressableScale';

export function StatPill({
  icon,
  label,
  value,
  tone = 'default',
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'hot' | 'warn' | 'good';
  /** Kept for call-site compat; animations removed for LCP. */
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
      <PressableLink to={to} className={className} aria-label={`${label}: ${value}`}>
        {inner}
      </PressableLink>
    );
  }

  return <div className={className}>{inner}</div>;
}
