import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, CalendarDays, Layers, LayoutGrid, Luggage, Plus, Settings, Sparkles, Sun } from 'lucide-react';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { OfflineStatusBar } from '@/components/layout/OfflineStatusBar';
import { CapRouteTransition } from '@/components/premium/CapRouteTransition';
import { hapticLight } from '@/lib/premium/haptics';
import { APP_VERSION } from '@/lib/version';

const tabs = [
  { to: '/', icon: Sun, label: 'Today', end: true },
  { to: '/collection', icon: LayoutGrid, label: 'Collection' },
  { to: '/advisor', icon: Sparkles, label: 'Advisor' },
  { to: '/calendar', icon: CalendarDays, label: 'Diary' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const sideExtras = [
  { to: '/analytics', icon: BarChart3, label: 'Insights' },
  { to: '/layering', icon: Layers, label: 'Layering' },
  { to: '/travel', icon: Luggage, label: 'Travel kit' },
];

function SideLink({ to, icon: Icon, label, end }: { to: string; icon: typeof Sun; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className="ui-side-link" onClick={() => hapticLight()}>
      <Icon size={19} strokeWidth={2} aria-hidden />
      {label}
    </NavLink>
  );
}

export function AppShell() {
  return (
    <div className="min-h-dvh flex bg-[var(--bg)]">
      <a href="#main" className="cap-skip-link">
        Skip to content
      </a>
      <OfflineStatusBar />

      <aside data-testid="desktop-sidebar" className="ui-sidebar hidden md:flex" aria-label="Sidebar">
        <div className="flex items-center gap-2.5 px-3 pb-5 pt-1">
          <img
            src={`${import.meta.env.BASE_URL}mark.svg`}
            alt=""
            width={28}
            height={28}
            className="shrink-0"
            aria-hidden
            draggable={false}
          />
          <span className="text-[var(--t-headline)] font-semibold tracking-tight">ScentCap</span>
        </div>
        {tabs.map((t) => (
          <SideLink key={t.to} {...t} />
        ))}
        <p className="ui-list-header mt-6">Tools</p>
        {sideExtras.map((t) => (
          <SideLink key={t.to} {...t} />
        ))}
        <div className="mt-6 px-1">
          <NavLink to="/add" className="ui-btn ui-btn--primary ui-btn--block" onClick={() => hapticLight()}>
            <Plus size={18} strokeWidth={2.6} aria-hidden /> Add fragrance
          </NavLink>
        </div>
        <p className="mt-auto px-3 ui-footnote">ScentCap {APP_VERSION}</p>
      </aside>

      <main id="main" tabIndex={-1} className="flex-1 min-w-0 overflow-x-hidden outline-none">
        <DemoBanner />
        <CapRouteTransition>
          <Outlet />
        </CapRouteTransition>
      </main>

      <nav className="ui-tabbar md:hidden" aria-label="Main">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className="ui-tab" onClick={() => hapticLight()}>
            <Icon size={21} strokeWidth={2} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
