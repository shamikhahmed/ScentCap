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
    <div className="sticky top-0 z-40 mx-5 md:mx-0 mt-3 mb-1 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm">
      <p className="flex items-center gap-2 text-amber-100/90">
        <Sparkles size={16} className="shrink-0 text-[var(--color-accent)]" />
        <span>You&apos;re viewing a demo wardrobe</span>
      </p>
      <Button size="sm" variant="outline" className="shrink-0" onClick={startFresh}>
        Start my own
      </Button>
    </div>
  );
}
