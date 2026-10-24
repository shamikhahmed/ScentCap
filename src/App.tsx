import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { Home } from '@/pages/Home';
import { CenteredLoader } from '@/components/layout/CenteredLoader';
import { hardResetApp } from '@/components/ErrorBoundary';

// Route chunks: one loader per screen so we can prefetch them all after boot (no blank flash on first visit).
const loaders = {
  Onboarding: () => import('@/pages/Onboarding').then((m) => ({ default: m.Onboarding })),
  CollectionPage: () => import('@/pages/Collection').then((m) => ({ default: m.CollectionPage })),
  AddFragrance: () => import('@/pages/AddFragrance').then((m) => ({ default: m.AddFragrance })),
  AdvisorPage: () => import('@/pages/Advisor').then((m) => ({ default: m.AdvisorPage })),
  CalendarPage: () => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
  AnalyticsPage: () => import('@/pages/Analytics').then((m) => ({ default: m.AnalyticsPage })),
  SettingsPage: () => import('@/pages/Settings').then((m) => ({ default: m.SettingsPage })),
  FragranceDetail: () => import('@/pages/FragranceDetail').then((m) => ({ default: m.FragranceDetail })),
  LayeringLab: () => import('@/pages/LayeringLab').then((m) => ({ default: m.LayeringLab })),
  TravelKit: () => import('@/pages/TravelKit').then((m) => ({ default: m.TravelKit })),
};
const Onboarding = lazy(loaders.Onboarding);
const CollectionPage = lazy(loaders.CollectionPage);
const AddFragrance = lazy(loaders.AddFragrance);
const AdvisorPage = lazy(loaders.AdvisorPage);
const CalendarPage = lazy(loaders.CalendarPage);
const AnalyticsPage = lazy(loaders.AnalyticsPage);
const SettingsPage = lazy(loaders.SettingsPage);
const FragranceDetail = lazy(loaders.FragranceDetail);
const LayeringLab = lazy(loaders.LayeringLab);
const TravelKit = lazy(loaders.TravelKit);

function usePrefetchRoutes(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const run = () => Object.values(loaders).forEach((load) => void load().catch(() => undefined));
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(run);
    else window.setTimeout(run, 1200);
  }, [ready]);
}

/** New screens open at the top; Back/Forward (POP) keeps the browser's restored position. */
function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navType]);
  return null;
}

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

  // Stuck recovery replaces the HTML boot shell; otherwise leave #root empty so
  // #sc-boot (fixed, outside React) is the only paint — avoids BootScreen→AppShell CLS.
  useEffect(() => {
    if (!stuck || ready) return;
    document.getElementById('sc-boot')?.setAttribute('hidden', '');
  }, [stuck, ready]);

  if (!ready) {
    if (!stuck) return null;
    return <BootScreen stuck />;
  }
  if (!profile?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Today',
  '/collection': 'Collection',
  '/add': 'Add Fragrance',
  '/advisor': 'Advisor',
  '/calendar': 'Diary',
  '/analytics': 'Insights',
  '/settings': 'Settings',
  '/layering': 'Layering Lab',
  '/travel': 'Travel Kit',
  '/onboarding': 'Welcome',
};

function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Detail pages set their own title (fragrance name) once loaded.
    if (pathname.startsWith('/fragrance/')) return;
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
  const { ready } = useApp();
  usePrefetchRoutes(ready);
  return (
    <Suspense fallback={null}>
      <TitleSync />
      <ScrollToTop />
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
