import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { Home } from '@/pages/Home';

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

function CenteredLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center gradient-hero">
      <p className="text-stone-400 animate-pulse">Loading ScentCap…</p>
    </div>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { ready, profile } = useApp();
  if (!ready) return <CenteredLoader />;
  if (!profile?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<CenteredLoader />}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<Guard><AppShell /></Guard>}>
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
