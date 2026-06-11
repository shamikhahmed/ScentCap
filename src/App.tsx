import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { Onboarding } from '@/pages/Onboarding';
import { Home } from '@/pages/Home';
import { CollectionPage } from '@/pages/Collection';
import { AddFragrance } from '@/pages/AddFragrance';
import { AdvisorPage } from '@/pages/Advisor';
import { CalendarPage } from '@/pages/CalendarPage';
import { AnalyticsPage } from '@/pages/Analytics';
import { SettingsPage } from '@/pages/Settings';
import { FragranceDetail } from '@/pages/FragranceDetail';
import { LayeringLab } from '@/pages/LayeringLab';
import { TravelKit } from '@/pages/TravelKit';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

function Guard({ children }: { children: React.ReactNode }) {
  const { ready, profile } = useApp();
  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center gradient-hero">
        <p className="text-stone-400 animate-pulse">Loading ScentCap…</p>
      </div>
    );
  }
  if (!profile?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

function AppRoutes() {
  return (
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
