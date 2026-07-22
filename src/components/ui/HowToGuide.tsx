import { Droplets, Sparkles, Sun } from 'lucide-react';

const STEPS = [
  {
    icon: Droplets,
    title: 'Add bottles',
    body: 'Search the catalog or enter a name. Your wardrobe stays on this phone.',
  },
  {
    icon: Sun,
    title: 'Wear today',
    body: 'Open Today for a weather-aware pick and spray map from your bottles.',
  },
  {
    icon: Sparkles,
    title: 'Tune Advisor',
    body: 'Set mood, office-safe, or occasion anytime — Smart Advisor is rules, not cloud AI.',
  },
] as const;

/** Compact how-to strip for empty / first-run surfaces. */
export function HowToGuide({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-caption text-[var(--color-text-tertiary)] mb-3 text-left">How ScentCap works</p>
      <ol className="space-y-3 text-left">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="flex gap-3 items-start">
              <span className="shrink-0 w-9 h-9 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center text-[var(--color-accent)]">
                <Icon size={16} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold tracking-tight">
                  <span className="text-[var(--color-text-tertiary)] mr-1.5">{i + 1}.</span>
                  {step.title}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
