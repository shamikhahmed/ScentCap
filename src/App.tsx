import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { Home } from '@/pages/Home';
import { BoutiqueSplash } from '@/components/layout/BoutiqueSplash';
import { CenteredLoader } from '@/components/layout/CenteredLoader';

// Route-level code splitting — Home stays eager for instant first paint;
// heavy pages (Analytics pulls in recharts) load on navigation.
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

const SPLASH_KEY = 'scentcap-splash-seen';

function Guard({ children }: { children: React.ReactNode }) {
  const { ready, profile } = useApp();
  const [splashDone, setSplashDone] = useState(() => {
    try {
      return sessionStorage.getItem(SPLASH_KEY) === '1';
    } catch {
      return false;
    }
  });
  const onSplashDone = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* ignore */
    }
    setSplashDone(true);
  }, []);

  if (!ready) return <BoutiqueSplash brief />;
  if (!splashDone) {
    return <BoutiqueSplash onDone={onSplashDone} />;
  }
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
    <Suspense fallback={<CenteredLoader />}>
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
