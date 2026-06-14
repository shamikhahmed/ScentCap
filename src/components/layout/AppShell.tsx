import { Link, NavLink, Outlet } from 'react-router-dom';
import { Calendar, Droplets, Home, Layers, Plus, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoBanner } from '@/components/layout/DemoBanner';

const nav = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/collection', icon: Droplets, label: 'Wardrobe' },
  { to: '/advisor', icon: Sparkles, label: 'Advisor' },
  { to: '/layering', icon: Layers, label: 'Layer' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row gradient-hero md:max-w-[1440px] md:mx-auto md:w-full">
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col md:border-r md:border-[var(--color-separator)] md:safe-pt md:p-6 md:gap-1 md:sticky md:top-0 md:h-dvh md:overflow-y-auto md:bg-[var(--color-bg)]">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">ScentCap</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Fragrance OS</h1>
        </div>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/add"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-white py-3 font-semibold"
        >
          <Plus size={18} /> Add bottle
        </NavLink>
      </aside>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 md:px-6 lg:px-10 xl:px-12 w-full min-w-0">
        <div className="mx-auto w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl">
          <DemoBanner />
          <Outlet />
        </div>
      </main>

      <Link
        to="/add"
        className="md:hidden fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
        aria-label="Add bottle"
      >
        <Plus size={24} />
      </Link>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 tab-bar rounded-t-2xl border-b-0 safe-pb px-1 pt-2">
        <div className="flex justify-around">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px]',
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]',
                )
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
