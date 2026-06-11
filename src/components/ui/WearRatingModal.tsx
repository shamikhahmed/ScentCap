import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';

export function WearRatingModal({
  open,
  fragranceName,
  onSubmit,
  onSkip,
}: {
  open: boolean;
  fragranceName: string;
  onSubmit: (rating: number, compliment: boolean, notes?: string) => void;
  onSkip: () => void;
}) {
  const [rating, setRating] = useState(4);
  const [compliment, setCompliment] = useState(false);

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
          <p className="font-semibold">How was {fragranceName}?</p>
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
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onSkip}>Skip</Button>
            <Button className="flex-1" onClick={() => onSubmit(rating, compliment)}>Save</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
