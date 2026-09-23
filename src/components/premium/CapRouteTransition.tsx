type CapRouteTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * App shell (data-cap-app) uses instant paint — no GSAP route theatre on cold load.
 * Marketing surfaces that need motion can opt into a separate helper later.
 */
export function CapRouteTransition({ children, className }: CapRouteTransitionProps) {
  return (
    <div className={className} data-cap-dashboard>
      {children}
    </div>
  );
}
