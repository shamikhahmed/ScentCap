/** Static grain + interactive 3D particle galaxy */
import { CapScene } from '@/components/premium/CapScene';

const isAppShell =
  typeof document !== 'undefined' && document.body?.getAttribute('data-cap-app') === '1';

export function AmbientBackground() {
  return (
    <>
      {!isAppShell && <CapScene intensity={0.85} />}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="ambient-grain absolute inset-0" />
      </div>
    </>
  );
}
