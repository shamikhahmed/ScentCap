import { Button } from '@/components/ui/button';

/** Plain what + what to do + Retry. */
export function ErrorState({
  title = 'Something went wrong',
  description = 'Try again. Your collection on this device is safe.',
  onRetry,
  retryLabel = 'Retry',
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center" role="alert">
      <h2 className="text-lg font-semibold text-[var(--sc-text)]">{title}</h2>
      <p className="max-w-sm text-sm text-[var(--sc-text-muted)]">{description}</p>
      {onRetry ? (
        <Button type="button" onClick={onRetry} className="mt-2">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
