/** Static grain + interactive 3D particle galaxy */
import { CapScene } from '@/components/premium/CapScene';

export function AmbientBackground() {
  return (
    <>
      <CapScene intensity={0.85} />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="ambient-grain absolute inset-0" />
      </div>
    </>
  );
}
