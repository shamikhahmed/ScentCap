import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { exitDemo } from '@/services/demo';

/** Compact strip — never steal first viewport from the bottle. */
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
    <div
      className="cap-demo-banner sticky top-0 z-40 flex items-center justify-between gap-2 px-4 pb-1.5 pt-[max(0.375rem,env(safe-area-inset-top))] text-[11px] font-medium border-b border-[var(--sc-border-soft)] bg-[var(--sc-surface)] text-[var(--sc-text-muted)]"
      role="status"
    >
      <span>Sample wardrobe</span>
      <Button size="sm" variant="ghost" className="!h-7 !min-h-0 !px-2 !text-[11px] shrink-0" onClick={startFresh}>
        Start mine
      </Button>
    </div>
  );
}
