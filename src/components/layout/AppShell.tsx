import { Link, NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Droplets, Home, Layers, Plus, Settings, Sparkles, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { AmbientBackground } from '@/components/premium/AmbientBackground';
import { CapRouteTransition } from '@/components/premium/CapRouteTransition';
import { Button } from '@/components/ui/button';
import { hapticLight } from '@/lib/premium/haptics';

const desktopNav = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/collection', icon: Droplets, label: 'Wardrobe' },
  { to: '/advisor', icon: Sparkles, label: 'Advisor' },
  { to: '/layering', icon: Layers, label: 'Layering' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const mobileNav = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/collection', icon: Droplets, label: 'Wardrobe' },
  { to: '/advisor', icon: Sparkles, label: 'Advisor' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/settings', icon: Settings, label: 'More' },
];

function DesktopNavLink({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  return (
    <NavLink
      to={to}
      onClick={() => hapticLight()}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors pressable',
          isActive
            ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
          {label}
        </>
      )}
    </NavLink>
  );
}

function MobileTab({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  return (
    <NavLink
      to={to}
      onClick={() => hapticLight()}
      className={({ isActive }) => cn('floating-tab-item', isActive && 'floating-tab-item--active')}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="floating-tab-pill"
              className="floating-tab-indicator"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} className="floating-tab-icon" />
          <span className="floating-tab-label">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row md:max-w-[1440px] md:mx-auto md:w-full relative">
      <AmbientBackground />
      <div className="cap-scroll-progress" aria-hidden="true" />

      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col md:border-r md:border-[var(--color-separator)] md:safe-pt md:p-6 md:gap-1 md:sticky md:top-0 md:h-dvh md:overflow-y-auto md:bg-[var(--color-bg)]/80 md:backdrop-blur-xl">
        <div className="mb-8">
          <p className="text-caption text-[var(--color-text-tertiary)]">ScentCap</p>
          <h1 className="text-title mt-1.5">Fragrance OS</h1>
        </div>
        {desktopNav.map((item) => (
          <DesktopNavLink key={item.to} {...item} />
        ))}
        <div className="mt-5">
          <Button to="/add" className="w-full btn-glow" haptic="medium">
            <Plus size={18} strokeWidth={2.5} /> Add bottle
          </Button>
        </div>
      </aside>

      <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto pb-32 md:pb-10 md:px-6 lg:px-10 xl:px-12 w-full min-w-0 relative z-10">
        <div className="mx-auto w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl">
          <DemoBanner />
          <CapRouteTransition className="relative z-[1]">
            <Outlet />
          </CapRouteTransition>
        </div>
      </main>

      <Link
        to="/add"
        onClick={() => hapticLight()}
        className="fab-premium pressable md:hidden"
        aria-label="Add bottle"
      >
        <Plus size={22} strokeWidth={2.25} />
      </Link>

      <div className="floating-tab-shell md:hidden">
        <nav className="floating-tab-bar" aria-label="Main">
          {mobileNav.map((item) => (
            <MobileTab key={item.to} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}
