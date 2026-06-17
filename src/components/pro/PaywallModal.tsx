import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePro } from '@/context/ProContext';
import { PRO_FEATURES, LAUNCH_PREVIEW, type ProFeature } from '@/lib/pro';
import {
  applyProEntitlement,
  IAP_UNAVAILABLE_MESSAGE,
  purchaseMonthly,
  purchaseYearly,
  restorePurchases,
} from '@/lib/iap';
import { hapticSelection, hapticSuccess } from '@/lib/premium/haptics';
import { MODAL_SPRING } from '@/lib/premium/motion';

const PLANS = [
  { id: 'monthly' as const, label: 'Monthly', price: '$4.99', period: '/mo', detail: 'Cancel anytime', highlight: false },
  { id: 'yearly' as const, label: 'Yearly', price: '$39.99', period: '/yr', detail: 'Save 33%', highlight: true },
] as const;

export function PaywallModal() {
  const { paywallOpen, paywallFeature, closePaywall, activatePro } = usePro();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');

  if (!paywallOpen) return null;

  const feature = paywallFeature ? PRO_FEATURES[paywallFeature] : null;

  const handlePurchase = async (plan: 'monthly' | 'yearly') => {
    setBusy(true);
    setStatus(null);
    const result = plan === 'monthly' ? await purchaseMonthly() : await purchaseYearly();
    setBusy(false);

    if (result.ok) {
      hapticSuccess();
      applyProEntitlement();
      activatePro();
      return;
    }

    setStatus(result.message);
  };

  const handleRestore = async () => {
    setBusy(true);
    setStatus(null);
    const result = await restorePurchases();
    setBusy(false);

    if (result.ok) {
      hapticSuccess();
      applyProEntitlement();
      activatePro();
      return;
    }

    setStatus(result.message);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        data-testid="paywall-modal"
        onClick={closePaywall}
      >
        <motion.div
          className="paywall-sheet w-full max-w-md p-6 sm:p-7 space-y-5 relative"
          {...MODAL_SPRING}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={closePaywall}
            className="absolute top-5 right-5 w-8 h-8 rounded-full glass-premium-subtle flex items-center justify-center text-[var(--color-text-secondary)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-4 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-muted)] flex items-center justify-center shadow-lg">
              <Crown size={26} className="text-[var(--color-accent)]" strokeWidth={2} />
            </div>
            <div>
              <h2 id="paywall-title" className="text-title">
                {LAUNCH_PREVIEW ? 'Pro — coming soon' : 'ScentCap Pro'}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                {LAUNCH_PREVIEW ? 'Launch preview — all features free' : 'The full fragrance OS'}
              </p>
            </div>
          </div>

          {feature && (
            <div className="glass-premium-subtle rounded-2xl px-4 py-3.5 text-sm">
              <span className="font-semibold text-[var(--color-accent)]">{feature.title}</span>
              <span className="text-[var(--color-text-secondary)]"> — {feature.description}</span>
            </div>
          )}

          <ul className="text-sm text-[var(--color-text-secondary)] space-y-2.5">
            {(Object.entries(PRO_FEATURES) as [ProFeature, { title: string }][]).map(([key, f]) => (
              <li key={key} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)] flex items-center justify-center text-xs">✓</span>
                {f.title}
              </li>
            ))}
          </ul>

          <div className="grid gap-2.5">
            {PLANS.map((plan) => {
              const isSelected = selected === plan.id;
              return (
                <motion.button
                  key={plan.id}
                  type="button"
                  disabled={busy || LAUNCH_PREVIEW}
                  whileTap={{ scale: 0.98 }}
                  className={`paywall-plan ${isSelected ? 'paywall-plan--selected' : ''}`}
                  onClick={() => {
                    hapticSelection();
                    setSelected(plan.id);
                  }}
                  data-testid={`paywall-plan-${plan.id}`}
                >
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="paywall-plan-check"
                    >
                      <Check size={12} strokeWidth={3} />
                    </motion.span>
                  )}
                  <div className="flex justify-between items-baseline gap-2 pr-8">
                    <span className="font-semibold text-base">{plan.label}</span>
                    <span>
                      <span className="text-[var(--color-accent)] font-semibold text-lg">{plan.price}</span>
                      <span className="text-[var(--color-text-tertiary)] text-sm">{plan.period}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    {LAUNCH_PREVIEW ? 'After App Store launch' : plan.detail}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {status && (
            <p className="text-xs text-[var(--color-text-secondary)] text-center leading-relaxed" data-testid="iap-status">
              {status}
            </p>
          )}

          <Button
            className="w-full btn-glow"
            size="lg"
            onClick={() => handlePurchase(selected)}
            disabled={busy || LAUNCH_PREVIEW}
          >
            {LAUNCH_PREVIEW ? 'Coming with App Store launch' : 'Continue'}
          </Button>

          <Button variant="ghost" size="sm" className="w-full" onClick={handleRestore} disabled={busy || LAUNCH_PREVIEW} data-testid="restore-purchases">
            Restore purchases
          </Button>

          <p className="text-[10px] text-[var(--color-text-tertiary)] text-center leading-relaxed">
            {IAP_UNAVAILABLE_MESSAGE}
          </p>

          <Button variant="glass" className="w-full" onClick={closePaywall}>
            Maybe later
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
