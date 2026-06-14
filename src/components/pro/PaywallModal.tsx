import { Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePro } from '@/context/ProContext';
import { PRO_FEATURES, type ProFeature } from '@/lib/pro';

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '$4.99/mo', detail: 'Cancel anytime', highlight: false },
  { id: 'yearly', label: 'Yearly', price: '$39.99/yr', detail: 'Save 33% — best value', highlight: true },
] as const;

export function PaywallModal() {
  const { paywallOpen, paywallFeature, closePaywall, activatePro } = usePro();

  if (!paywallOpen) return null;

  const feature = paywallFeature ? PRO_FEATURES[paywallFeature] : null;

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
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                plan.highlight
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
              onClick={activatePro}
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

        <p className="text-[10px] text-stone-600 text-center leading-relaxed">
          IAP scaffold — StoreKit integration pending Apple Developer account. Tap a plan to enable Pro locally for testing.
        </p>

        <Button variant="ghost" className="w-full" onClick={closePaywall}>
          Maybe later
        </Button>
      </Card>
    </div>
  );
}
