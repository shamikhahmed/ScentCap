import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';

function WearRatingForm({
  fragranceName,
  onSubmit,
  onSkip,
  initial,
  editMode,
}: {
  fragranceName: string;
  onSubmit: (rating: number, compliment: boolean, notes?: string) => void;
  onSkip: () => void;
  initial?: { rating?: number; compliment?: boolean; notes?: string };
  editMode?: boolean;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 4);
  const [compliment, setCompliment] = useState(initial?.compliment ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <>
      <p className="font-semibold">{editMode ? `Edit wear — ${fragranceName}` : `How was ${fragranceName}?`}</p>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? 'opacity-100' : 'opacity-30'}`}
          >
            ★
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setCompliment(!compliment)}
        className={`w-full rounded-2xl py-3 text-sm font-medium border ${
          compliment ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15' : 'border-white/10'
        }`}
      >
        {compliment ? '✓ Got a compliment' : 'Got a compliment?'}
      </button>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={3}
        className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]/50 resize-none"
      />
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={onSkip}>{editMode ? 'Cancel' : 'Skip'}</Button>
        <Button className="flex-1" onClick={() => onSubmit(rating, compliment, notes.trim() || undefined)}>
          {editMode ? 'Update' : 'Save'}
        </Button>
      </div>
    </>
  );
}

export function WearRatingModal({
  open,
  fragranceName,
  onSubmit,
  onSkip,
  initial,
  editMode,
}: {
  open: boolean;
  fragranceName: string;
  onSubmit: (rating: number, compliment: boolean, notes?: string) => void;
  onSkip: () => void;
  initial?: { rating?: number; compliment?: boolean; notes?: string };
  editMode?: boolean;
}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="glass-card rounded-3xl p-6 w-full max-w-md space-y-4"
          initial={{ y: 40 }}
          animate={{ y: 0 }}
        >
          <WearRatingForm
            key={`${fragranceName}-${editMode ? 'edit' : 'rate'}-${initial?.rating ?? ''}`}
            fragranceName={fragranceName}
            onSubmit={onSubmit}
            onSkip={onSkip}
            initial={initial}
            editMode={editMode}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
