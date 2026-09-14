import { cn } from '@/lib/utils';

/** Foundation Switch (FND-04) — role=switch, 44px min hit target. */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors min-h-[44px] min-w-[44px] px-0.5',
        checked ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'bg-[var(--sc-sunken)] border-[var(--sc-border-soft)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      onClick={() => !disabled && onCheckedChange(!checked)}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
        aria-hidden
      />
    </button>
  );
}
