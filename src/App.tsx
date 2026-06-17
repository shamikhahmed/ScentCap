import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { ProProvider } from '@/context/ProContext';
import { PaywallModal } from '@/components/pro/PaywallModal';
import { ProSync } from '@/components/pro/ProSync';
import { ProGate } from '@/components/pro/ProGate';
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

import { CenteredLoader } from '@/components/layout/CenteredLoader';

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
          <Route path="/analytics" element={<ProGate feature="analytics"><AnalyticsPage /></ProGate>} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/layering" element={<ProGate feature="layering"><LayeringLab /></ProGate>} />
          <Route path="/travel" element={<ProGate feature="travel"><TravelKit /></ProGate>} />
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
      <ProProvider>
        <AppProvider>
          <ProSync />
          <PaywallModal />
          <AppRoutes />
        </AppProvider>
      </ProProvider>
    </BrowserRouter>
  );
}
