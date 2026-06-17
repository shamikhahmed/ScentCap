import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { exitDemo } from '@/services/demo';

export function DemoBanner() {
  const { prefs, refresh } = useApp();
  const navigate = useNavigate();

  if (!prefs.demoMode) return null;

  const startFresh = async () => {
    await exitDemo();
    await refresh();
    navigate('/onboarding');
  };

  return (
    <div className="sticky top-0 z-40 mx-5 md:mx-0 mt-3 mb-2 flex items-center justify-between gap-3 glass-premium-subtle rounded-2xl px-4 py-3 text-sm">
      <p className="flex items-center gap-2.5 font-medium">
        <span className="w-8 h-8 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center shrink-0">
          <Sparkles size={15} className="text-[var(--color-accent)]" />
        </span>
        <span className="text-[var(--color-text-secondary)]">Demo wardrobe</span>
      </p>
      <Button size="sm" variant="glass" className="shrink-0 !rounded-xl" onClick={startFresh}>
        Start my own
      </Button>
    </div>
  );
}
