/** Subtle page backdrop — no animated mist orbs */
export function MistBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-accent-muted), transparent 70%)',
        }}
      />
    </div>
  );
}
