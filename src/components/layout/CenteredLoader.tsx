/** Boot / Suspense fallback — no boutique theater. */
export function CenteredLoader() {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite" aria-label="Loading">
      <div
        className="w-9 h-9 rounded-full border-2 border-[var(--sc-border-soft)] border-t-[var(--sc-accent)] animate-spin"
        aria-hidden
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
