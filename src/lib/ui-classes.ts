/** Semantic classes for theme-aware UI (light + dark). */

export const inputField =
  'rounded-xl bg-[var(--sc-surface)] border border-[var(--sc-border)] px-3 py-2 text-sm text-[var(--sc-text)] outline-none focus:border-[var(--sc-accent)] placeholder:text-[var(--sc-text-muted)]';

export const inputFieldLg =
  'w-full rounded-xl bg-[var(--sc-surface)] border border-[var(--sc-border)] px-4 py-3 text-[var(--sc-text)] outline-none focus:border-[var(--sc-accent)] placeholder:text-[var(--sc-text-muted)]';

export const segmentBar =
  'flex gap-1 p-1 rounded-xl bg-[var(--sc-surface)] border border-[var(--sc-border-soft)]';

export const segmentActive = 'bg-[var(--sc-accent)] text-white';

export const segmentInactive = 'text-[var(--sc-text-soft)] hover:text-[var(--sc-text)]';

export const chipInactive =
  'bg-[var(--sc-panel)] border border-[var(--sc-border-soft)] text-[var(--sc-text-soft)]';

export const chipActive = 'bg-[var(--sc-accent-soft)] border border-[var(--sc-accent)] text-[var(--sc-accent)]';

export const textMuted = 'text-[var(--sc-text-soft)]';

export const textSubtle = 'text-[var(--sc-text-muted)]';

export const labelCaps = 'text-xs uppercase tracking-wider text-[var(--sc-text-muted)] font-semibold';

export const scrim = 'bg-black/50';
