import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DidYouMeanBanner({
  suggestion,
  searchedAs,
  originalQuery,
  onSelect,
  className,
}: {
  suggestion: string;
  searchedAs?: string | null;
  originalQuery?: string;
  onSelect: (query: string) => void;
  className?: string;
}) {
  const showCorrected =
    searchedAs && originalQuery && searchedAs.toLowerCase() !== originalQuery.toLowerCase();

  return (
    <div
      className={cn(
        'magazine-did-you-mean flex items-start gap-3 rounded-2xl px-4 py-3',
        className,
      )}
    >
      <Sparkles size={16} className="shrink-0 mt-0.5 text-[var(--color-accent)]" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
          Did you mean
        </p>
        {showCorrected ? (
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 leading-snug">
            Showing results for{' '}
            <button
              type="button"
              className="font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline"
              onClick={() => onSelect(searchedAs!)}
            >
              {searchedAs}
            </button>
            {originalQuery && (
              <span className="text-[var(--color-text-tertiary)]"> · not “{originalQuery}”</span>
            )}
          </p>
        ) : (
          <button
            type="button"
            className="text-sm font-semibold text-[var(--color-accent)] mt-0.5 text-left hover:underline underline-offset-2"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </button>
        )}
      </div>
    </div>
  );
}
