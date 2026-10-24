import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Sheet } from '@/components/kit';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { hapticSelection, hapticSuccess } from '@/lib/premium/haptics';

const RATING_WORDS = ['', 'Not for me', 'It was okay', 'Nice', 'Loved it', 'Perfect'];

/** Post-wear check-in: stars, compliment, optional note. */
export function WearRatingModal({
  open,
  fragranceName,
  catalogImage,
  onSubmit,
  onSkip,
  initial,
  editMode,
}: {
  open: boolean;
  fragranceName: string;
  catalogImage?: string | null;
  onSubmit: (rating: number, compliment: boolean, notes?: string) => void;
  onSkip: () => void;
  initial?: { rating?: number; compliment?: boolean; notes?: string };
  editMode?: boolean;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 4);
  const [compliment, setCompliment] = useState(initial?.compliment ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  useEffect(() => {
    if (!open) return;
    setRating(initial?.rating ?? 4);
    setCompliment(initial?.compliment ?? false);
    setNotes(initial?.notes ?? '');
  }, [open, initial?.rating, initial?.compliment, initial?.notes]);

  const save = () => {
    hapticSuccess();
    onSubmit(rating, compliment, notes.trim() || undefined);
  };

  return (
    <Sheet
      open={open}
      title={editMode ? 'Edit wear' : 'How did it wear?'}
      onClose={onSkip}
      labelledBy="wear-rating-title"
      done={{ label: editMode ? 'Update' : 'Save', onClick: save }}
    >
      <div className="flex items-center gap-4 mb-5">
        {catalogImage && (
          <div className="w-16 shrink-0">
            <FragranceThumb catalogImage={catalogImage} name={fragranceName} variant="plinth" size="sm" className="!rounded-[12px]" />
          </div>
        )}
        <p className="serif text-[var(--t-title3)] leading-tight">{fragranceName}</p>
      </div>

      <div className="ui-card text-center">
        <div className="flex justify-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className="w-11 h-11 grid place-items-center"
              onClick={() => {
                hapticSelection();
                setRating(n);
              }}
            >
              <Star size={30} className={n <= rating ? 'text-[var(--tint)]' : 'text-[var(--label-4)]'} fill={n <= rating ? 'currentColor' : 'none'} aria-hidden />
            </button>
          ))}
        </div>
        <p className="ui-footnote mt-1">{RATING_WORDS[rating]}</p>
      </div>

      <div className="ui-list mt-4">
        <label className="ui-row cursor-pointer">
          <span className="ui-row__main">Someone complimented it</span>
          <input type="checkbox" className="ui-switch" checked={compliment} onChange={(e) => setCompliment(e.target.checked)} />
        </label>
        <label className="ui-row" htmlFor="wear-notes">
          <span className="sr-only">Notes</span>
          <textarea
            id="wear-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note — occasion, how long it lasted…"
            rows={3}
            className="ui-field ui-field--left resize-none py-1"
          />
        </label>
      </div>

      <button type="button" className="ui-btn ui-btn--primary ui-btn--block mt-5" onClick={save}>
        {editMode ? 'Update' : 'Save to diary'}
      </button>
    </Sheet>
  );
}
