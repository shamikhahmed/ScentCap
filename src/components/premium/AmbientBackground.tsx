/** Static, barely-there backdrop — no floating blue orbs */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="ambient-base" />
      <div className="ambient-grain" />
    </div>
  );
}
