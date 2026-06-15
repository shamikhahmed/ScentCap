import { useEffect } from 'react';
import { usePro } from '@/context/ProContext';
import { LAUNCH_PREVIEW, type ProFeature } from '@/lib/pro';

export function ProGate({ feature, children }: { feature: ProFeature; children: React.ReactNode }) {
  const { isPro, requestFeature } = usePro();

  useEffect(() => {
    if (LAUNCH_PREVIEW || isPro) return;
    requestFeature(feature);
  }, [isPro, feature, requestFeature]);

  if (!LAUNCH_PREVIEW && !isPro) {
    return (
      <div className="safe-pt px-5 py-12 max-w-lg mx-auto text-center space-y-4" data-testid="pro-gate">
        <p className="text-stone-400">This feature requires ScentCap Pro.</p>
        <p className="text-sm text-stone-500">Upgrade from Settings or tap a locked nav item to see plans.</p>
      </div>
    );
  }

  return <>{children}</>;
}
