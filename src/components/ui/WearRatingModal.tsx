import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from './button';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { hapticSelection } from '@/lib/premium/haptics';
import { MODAL_SPRING, SPRING_PRESS } from '@/lib/premium/motion';
import { scrollInputIntoView } from '@/hooks/useKeyboardInset';

function WearRatingForm({
  fragranceName,
  catalogImage,
  onSubmit,
  onSkip,
  initial,
  editMode,
}: {
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

  return (
    <>
      {catalogImage && (
        <div className="flex justify-center">
          <FragranceThumb name={fragranceName} catalogImage={catalogImage} size="md" className="w-24" />
        </div>
      )}
      <p className="font-semibold text-center">{editMode ? `Edit wear — ${fragranceName}` : `How was ${fragranceName}?`}</p>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            type="button"
            whileTap={{ scale: 0.9 }}
            transition={SPRING_PRESS}
            onClick={() => {
              hapticSelection();
              setRating(n);
            }}
            className={`text-2xl min-w-[44px] min-h-[44px] ${n <= rating ? 'opacity-100' : 'opacity-30'}`}
            aria-label={`Rate ${n} stars`}
          >
            ★
          </motion.button>
        ))}
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        transition={SPRING_PRESS}
        onClick={() => {
          hapticSelection();
          setCompliment(!compliment);
        }}
        className={`w-full rounded-2xl py-3 text-sm font-medium border transition-colors ${
          compliment ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15' : 'border-white/10'
        }`}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <AnimatePresence mode="wait" initial={false}>
            {compliment && (
              <motion.span
                key="c"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
              >
                <Check size={16} className="text-[var(--color-accent)]" />
              </motion.span>
            )}
          </AnimatePresence>
          {compliment ? 'Got a compliment' : 'Got a compliment?'}
        </span>
      </motion.button>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onFocus={(e) => scrollInputIntoView(e.currentTarget)}
        placeholder="Notes (optional)"
        rows={3}
        className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]/50 resize-none input-premium"
      />
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={onSkip}>{editMode ? 'Cancel' : 'Skip'}</Button>
        <Button
          className="flex-1"
          haptic="success"
          onClick={() => onSubmit(rating, compliment, notes.trim() || undefined)}
        >
          {editMode ? 'Update' : 'Save'}
        </Button>
      </div>
    </>
  );
}

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
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onSkip}
      >
        <motion.div
          className="glass-premium rounded-3xl p-6 w-full max-w-md space-y-4 border border-[var(--glass-border)]"
          {...MODAL_SPRING}
          onClick={(e) => e.stopPropagation()}
        >
          <WearRatingForm
            key={`${fragranceName}-${editMode ? 'edit' : 'rate'}-${initial?.rating ?? ''}`}
            fragranceName={fragranceName}
            catalogImage={catalogImage}
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
