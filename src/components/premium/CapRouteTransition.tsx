import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

const reduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type CapRouteTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export function CapRouteTransition({ children, className }: CapRouteTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      gsap.set(el, { clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 18, scale: 0.992, filter: 'blur(6px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.48, ease: 'power3.out' },
      );

      const stagger = el.querySelectorAll('.cap-reveal, .cap-stagger > *, [data-cap-stagger]');
      if (stagger.length) {
        gsap.fromTo(
          stagger,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.42, stagger: 0.04, ease: 'power2.out', delay: 0.08 },
        );
      }
    }, el);

    return () => ctx.revert();
  }, [location.pathname]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
