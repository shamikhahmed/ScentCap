/** Quiet atmosphere — CSS only. No WebGL. */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 50% at 50% -5%, color-mix(in srgb, var(--sc-accent) 10%, transparent), transparent 55%)',
        }}
      />
      <div className="ambient-grain absolute inset-0 opacity-[0.04]" />
    </div>
  );
}
