import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { Home } from '@/pages/Home';
import { CenteredLoader } from '@/components/layout/CenteredLoader';
import { hardResetApp } from '@/components/ErrorBoundary';

const Onboarding = lazy(() => import('@/pages/Onboarding').then((m) => ({ default: m.Onboarding })));
const CollectionPage = lazy(() => import('@/pages/Collection').then((m) => ({ default: m.CollectionPage })));
const AddFragrance = lazy(() => import('@/pages/AddFragrance').then((m) => ({ default: m.AddFragrance })));
const AdvisorPage = lazy(() => import('@/pages/Advisor').then((m) => ({ default: m.AdvisorPage })));
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const AnalyticsPage = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.SettingsPage })));
const FragranceDetail = lazy(() => import('@/pages/FragranceDetail').then((m) => ({ default: m.FragranceDetail })));
const LayeringLab = lazy(() => import('@/pages/LayeringLab').then((m) => ({ default: m.LayeringLab })));
const TravelKit = lazy(() => import('@/pages/TravelKit').then((m) => ({ default: m.TravelKit })));

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

function BootScreen({ stuck }: { stuck?: boolean }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 safe-pt safe-pb bg-[var(--sc-bg)]">
      <p className="text-[13px] font-semibold tracking-[0.18em] uppercase text-[var(--sc-text-muted)]">ScentCap</p>
      {!stuck ? (
        <CenteredLoader />
      ) : (
        <div className="text-center max-w-xs space-y-4">
          <p className="text-sm text-[var(--sc-text-soft)] leading-relaxed">
            Taking too long. Network or old cache may be blocking open.
          </p>
          <button
            type="button"
            className="w-full rounded-xl bg-[var(--sc-accent)] text-white font-semibold py-3.5"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-[var(--sc-border)] font-semibold py-3 text-[var(--sc-text)]"
            onClick={() => void hardResetApp()}
          >
            Clear cache & reopen
          </button>
        </div>
      )}
    </div>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { ready, profile } = useApp();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (ready) return;
    const t = window.setTimeout(() => setStuck(true), 4500);
    return () => window.clearTimeout(t);
  }, [ready]);

  if (!ready) return <BootScreen stuck={stuck} />;
  if (!profile?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/collection': 'Collection',
  '/add': 'Add Fragrance',
  '/advisor': 'Advisor',
  '/calendar': 'Calendar',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/layering': 'Layering Lab',
  '/travel': 'Travel Kit',
  '/onboarding': 'Welcome',
};

function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const label =
      PAGE_TITLES[pathname] ??
      (pathname
        .split('/')
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ') ||
        'Home');
    document.title = label + ' — ScentCap';
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <Suspense fallback={<BootScreen />}>
      <TitleSync />
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          element={
            <Guard>
              <AppShell />
            </Guard>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/add" element={<AddFragrance />} />
          <Route path="/advisor" element={<AdvisorPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/layering" element={<LayeringLab />} />
          <Route path="/travel" element={<TravelKit />} />
          <Route path="/fragrance/:id" element={<FragranceDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
