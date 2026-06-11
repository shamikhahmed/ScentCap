import { Link, NavLink, Outlet } from 'react-router-dom';
import { Calendar, Droplets, Home, Layers, Plus, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="min-h-dvh flex flex-col md:flex-row gradient-hero">
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-white/10 md:safe-pt md:p-6 md:gap-2">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">ScentCap</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Fragrance OS</h1>
        </div>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                isActive ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-white hover:bg-white/5',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/add"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] text-stone-950 py-3 font-semibold"
        >
          <Plus size={18} /> Add bottle
        </NavLink>
      </aside>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 md:px-8 md:max-w-4xl">
        <Outlet />
      </main>

      <Link
        to="/add"
        className="md:hidden fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-[var(--color-accent)] text-stone-950 flex items-center justify-center shadow-lg shadow-amber-900/30 active:scale-95 transition-transform"
        aria-label="Add bottle"
      >
        <Plus size={24} />
      </Link>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-card rounded-t-3xl border-b-0 safe-pb px-1 pt-2">
        <div className="flex justify-around">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn('flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px]', isActive ? 'text-[var(--color-accent)]' : 'text-stone-500')
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
