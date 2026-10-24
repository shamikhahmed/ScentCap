import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { exitDemo } from '@/services/demo';

/** Slim status strip — labels sample data (HIG) without stealing the first viewport. */
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
      data-testid="demo-banner"
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-5 pt-[max(0.25rem,env(safe-area-inset-top))] bg-[var(--glass)] backdrop-blur-xl border-b-[0.5px] border-[var(--separator)]"
      role="status"
    >
      <span className="text-[var(--t-footnote)] text-[var(--label-2)]">
        <strong className="font-semibold text-[var(--label)]">Sample wardrobe</strong>
      </span>
      <button type="button" className="ui-btn ui-btn--plain !min-h-[44px] !text-[var(--t-footnote)] whitespace-nowrap" onClick={startFresh}>
        Start my own
      </button>
    </div>
  );
}
