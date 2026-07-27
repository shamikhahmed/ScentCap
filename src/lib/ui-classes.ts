/** Semantic classes for theme-aware UI (light + dark). */

export const inputField =
  'rounded-[14px] bg-[var(--sc-panel)] border border-[var(--sc-border)] px-3.5 py-2.5 text-sm font-medium text-[var(--sc-text)] outline-none focus:border-[var(--sc-accent)] focus:shadow-[0_0_0_3px_var(--sc-accent-soft)] placeholder:text-[var(--sc-text-muted)]';

export const inputFieldLg =
  'w-full rounded-[14px] bg-[var(--sc-panel)] border border-[var(--sc-border)] px-4 py-3.5 text-[var(--sc-text)] font-medium outline-none focus:border-[var(--sc-accent)] focus:shadow-[0_0_0_3px_var(--sc-accent-soft)] placeholder:text-[var(--sc-text-muted)]';

export const segmentBar =
  'flex gap-1 p-1 rounded-2xl bg-[var(--sc-surface)] border border-[var(--sc-border-soft)]';

export const segmentActive = 'bg-[var(--sc-accent)] text-white shadow-sm';

export const segmentInactive = 'text-[var(--sc-text-soft)] hover:text-[var(--sc-text)]';

export const chipInactive =
  'bg-[var(--sc-panel)] border border-[var(--sc-border-soft)] text-[var(--sc-text-soft)]';

export const chipActive = 'bg-[var(--sc-accent-soft)] border border-[var(--sc-accent)] text-[var(--sc-accent)]';

export const textMuted = 'text-[var(--sc-text-soft)]';

export const textSubtle = 'text-[var(--sc-text-muted)]';

export const labelCaps =
  'text-[11px] uppercase tracking-[0.14em] text-[var(--sc-text-muted)] font-bold';

export const scrim = 'bg-black/50';
