import { useEffect } from 'react';

/** Above tab bar · 4s · role=status · optional Undo. */
export function Toast({
  message,
  onDismiss,
  undoLabel,
  onUndo,
  ms = 4000,
}: {
  message: string;
  onDismiss?: () => void;
  undoLabel?: string;
  onUndo?: () => void;
  ms?: number;
}) {
  useEffect(() => {
    if (!onDismiss) return;
    const t = window.setTimeout(onDismiss, ms);
    return () => window.clearTimeout(t);
  }, [onDismiss, ms]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="cap-toast fixed left-1/2 z-[80] w-[min(92vw,24rem)] -translate-x-1/2 rounded-[14px] border border-[var(--sc-border-soft)] bg-[var(--sc-panel)] px-4 py-3 text-sm text-[var(--sc-text)] shadow-[var(--sc-shadow-md)]"
      style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 leading-snug">{message}</p>
        {undoLabel && onUndo ? (
          <button
            type="button"
            className="shrink-0 font-semibold text-[var(--sc-accent)]"
            onClick={() => {
              onUndo();
              onDismiss?.();
            }}
          >
            {undoLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
