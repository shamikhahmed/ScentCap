import type { ReactNode } from 'react';

/** Inline-in-flow banner — never fixed over content. ≤ 1 action. */
export function Banner({
  children,
  action,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  action?: ReactNode;
  tone?: 'neutral' | 'accent' | 'warning';
  className?: string;
}) {
  const toneClass =
    tone === 'accent'
      ? 'border-[var(--sc-accent)]/35 bg-[var(--sc-accent-soft)]'
      : tone === 'warning'
        ? 'border-[var(--sc-warning)]/40 bg-[color-mix(in_srgb,var(--sc-warning)_12%,transparent)]'
        : 'border-[var(--sc-border-soft)] bg-[var(--sc-panel)]';

  return (
    <div
      role="status"
      className={`cap-banner flex items-start gap-3 rounded-[14px] border px-3.5 py-3 text-sm text-[var(--sc-text)] ${toneClass} ${className}`}
    >
      <div className="min-w-0 flex-1 leading-snug">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
