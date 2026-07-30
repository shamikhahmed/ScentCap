import { Link, NavLink, Outlet } from 'react-router-dom';
import { Calendar, Droplets, Home, Plus, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { OfflineStatusBar } from '@/components/layout/OfflineStatusBar';
import { CapRouteTransition } from '@/components/premium/CapRouteTransition';
import { Button } from '@/components/ui/button';
import { hapticLight } from '@/lib/premium/haptics';
import { APP_VERSION } from '@/lib/version';

const desktopNav = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/collection', icon: Droplets, label: 'Collection' },
  { to: '/advisor', icon: Sparkles, label: 'Advisor' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/settings', icon: User, label: 'You' },
];

const mobileNav = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/collection', icon: Droplets, label: 'Collection' },
  { to: '/advisor', icon: Sparkles, label: 'Advisor' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/settings', icon: User, label: 'You' },
];

function DesktopNavLink({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  return (
    <NavLink
      to={to}
      onClick={() => hapticLight()}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
          isActive
            ? 'bg-[var(--sc-accent-soft)] text-[var(--sc-accent)]'
            : 'text-[var(--sc-text-soft)] hover:text-[var(--sc-text)] hover:bg-[var(--sc-surface)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={isActive ? 2.4 : 1.9} />
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
      className={({ isActive }) => cn('atelier-tab', isActive && 'atelier-tab--on')}
    >
      {({ isActive }) => (
        <>
          <Icon size={20} strokeWidth={isActive ? 2.35 : 1.85} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row md:max-w-[1280px] md:mx-auto md:w-full relative bg-[var(--sc-bg)]">
      <OfflineStatusBar />

      <aside
        data-testid="desktop-sidebar"
        className="hidden md:flex md:w-60 md:flex-shrink-0 md:flex-col md:border-r md:border-[var(--sc-border-soft)] md:safe-pt md:p-5 md:gap-0.5 md:sticky md:top-0 md:h-dvh md:bg-[var(--sc-panel)]"
      >
        <div className="mb-8 px-3 flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}mark.svg`}
            alt=""
            width={32}
            height={32}
            className="shrink-0"
            aria-hidden
            draggable={false}
          />
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[var(--sc-text-muted)]">ScentCap</p>
            <h1 className="text-[1.35rem] leading-tight mt-1 font-[family-name:var(--font-display)] font-semibold tracking-tight text-[var(--sc-text)]">
              Wardrobe
            </h1>
          </div>
        </div>
        {desktopNav.map((item) => (
          <DesktopNavLink key={item.to} {...item} />
        ))}
        <div className="mt-6 px-1">
          <Button to="/add" className="w-full" haptic="medium">
            <Plus size={18} strokeWidth={2.5} /> Add bottle
          </Button>
        </div>
        <p className="mt-auto px-3 pt-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-[var(--sc-text-muted)]">
          v{APP_VERSION}
        </p>
      </aside>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 overflow-x-hidden overflow-y-auto atelier-main w-full min-w-0 relative z-10"
      >
        <div className="mx-auto w-full max-w-xl lg:max-w-2xl px-0 md:px-6 md:py-4">
          <DemoBanner />
          <CapRouteTransition className="relative z-[1]">
            <Outlet />
          </CapRouteTransition>
        </div>
      </main>

      <Link
        to="/add"
        onClick={() => hapticLight()}
        className="atelier-fab md:hidden"
        aria-label="Add bottle"
      >
        <Plus size={22} strokeWidth={2.4} />
      </Link>

      <nav className="atelier-tabbar md:hidden" aria-label="Main">
        {mobileNav.map((item) => (
          <MobileTab key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}
