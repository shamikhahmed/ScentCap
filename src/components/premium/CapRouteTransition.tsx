import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

const reduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isAppShell =
  typeof document !== 'undefined' && document.body?.getAttribute('data-cap-app') === '1';

const WIDGET_SEL = [
  '.cap-reveal',
  '.cap-stagger > *',
  '[data-cap-stagger]',
  '.glass-premium',
  '.glass-card',
  '.stat-pill',
  '.page-title',
  '.page-sub',
  '.section-label',
  '.stat-row',
  '.home-header',
  '.home-hero',
].join(', ');

type CapRouteTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export function CapRouteTransition({ children, className }: CapRouteTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || isAppShell) return;

    if (reduced) {
      gsap.set(el, { clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 20, scale: 0.992, filter: 'blur(8px)', transformPerspective: 1200 },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.52, ease: 'power3.out' },
      );

      const widgets = el.querySelectorAll(WIDGET_SEL);
      if (widgets.length) {
        gsap.fromTo(
          widgets,
          {
            opacity: 0,
            y: 24,
            rotateX: 12,
            scale: 0.96,
            transformPerspective: 1000,
            transformOrigin: '50% 85%',
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.55,
            stagger: { amount: 0.42, from: 'start' },
            ease: 'power3.out',
            delay: 0.06,
            clearProps: 'transform',
          },
        );
      }
    }, el);

    return () => ctx.revert();
  }, [location.pathname]);

  return (
    <div ref={isAppShell ? undefined : ref} className={className} data-cap-dashboard>
      {children}
    </div>
  );
}
