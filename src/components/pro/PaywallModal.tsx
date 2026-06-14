import { useState } from 'react';
import { Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePro } from '@/context/ProContext';
import { PRO_FEATURES, type ProFeature } from '@/lib/pro';
import {
  applyProEntitlement,
  IAP_UNAVAILABLE_MESSAGE,
  purchaseMonthly,
  purchaseYearly,
  restorePurchases,
} from '@/lib/iap';

const PLANS = [
  { id: 'monthly' as const, label: 'Monthly', price: '$4.99/mo', detail: 'Cancel anytime', highlight: false },
  { id: 'yearly' as const, label: 'Yearly', price: '$39.99/yr', detail: 'Save 33% — best value', highlight: true },
] as const;

export function PaywallModal() {
  const { paywallOpen, paywallFeature, closePaywall, activatePro } = usePro();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (!paywallOpen) return null;

  const feature = paywallFeature ? PRO_FEATURES[paywallFeature] : null;

  const handlePurchase = async (plan: 'monthly' | 'yearly') => {
    setBusy(true);
    setStatus(null);
    const result = plan === 'monthly' ? await purchaseMonthly() : await purchaseYearly();
    setBusy(false);

    if (result.ok) {
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
      applyProEntitlement();
      activatePro();
      return;
    }

    setStatus(result.message);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      data-testid="paywall-modal"
    >
      <Card className="w-full max-w-md space-y-5 relative animate-in fade-in slide-in-from-bottom-4">
        <button
          type="button"
          onClick={closePaywall}
          className="absolute top-4 right-4 text-stone-500 hover:text-stone-300"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-muted)] flex items-center justify-center">
            <Crown size={24} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <h2 id="paywall-title" className="text-xl font-semibold">Upgrade to Pro</h2>
            <p className="text-sm text-stone-400">Unlock the full fragrance OS</p>
          </div>
        </div>

        {feature && (
          <p className="text-sm text-stone-300 bg-white/5 rounded-xl px-4 py-3">
            <span className="font-medium text-[var(--color-accent)]">{feature.title}</span>
            {' — '}
            {feature.description}
          </p>
        )}

        <ul className="text-sm text-stone-400 space-y-2">
          {(Object.entries(PRO_FEATURES) as [ProFeature, { title: string }][]).map(([key, f]) => (
            <li key={key} className="flex items-center gap-2">
              <span className="text-[var(--color-accent)]">✓</span>
              {f.title}
            </li>
          ))}
        </ul>

        <div className="grid gap-2">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              disabled={busy}
              className={`rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                plan.highlight
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
              onClick={() => handlePurchase(plan.id)}
              data-testid={`paywall-plan-${plan.id}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{plan.label}</span>
                <span className="text-[var(--color-accent)] font-medium">{plan.price}</span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">{plan.detail}</p>
            </button>
          ))}
        </div>

        {status && (
          <p className="text-xs text-stone-400 text-center leading-relaxed" data-testid="iap-status">
            {status}
          </p>
        )}

        <Button variant="ghost" size="sm" className="w-full" onClick={handleRestore} disabled={busy} data-testid="restore-purchases">
          Restore purchases
        </Button>

        <p className="text-[10px] text-stone-600 text-center leading-relaxed">
          {IAP_UNAVAILABLE_MESSAGE}
        </p>

        <Button variant="ghost" className="w-full" onClick={closePaywall}>
          Maybe later
        </Button>
      </Card>
    </div>
  );
}
