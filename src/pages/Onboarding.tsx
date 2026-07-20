import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { loadDemoData } from '@/services/demo';
import { geocodeCity, requestLocation, type CityLocation } from '@/services/weather';
import type { UserProfile } from '@/types';
import { AmbientBackground } from '@/components/premium/AmbientBackground';
import { CyclingShimmerText, DEMO_LOADING_MESSAGES } from '@/components/ui/CyclingShimmerText';
import { hapticSelection, hapticSuccess } from '@/lib/premium/haptics';

const STEPS = [
  { key: 'workContext', title: 'Where do you spend most days?', options: [
    { v: 'office', l: 'Office daily' }, { v: 'hybrid', l: 'Hybrid' }, { v: 'wfh', l: 'Work from home' }, { v: 'student', l: 'Student' }, { v: 'other', l: 'Other' },
  ]},
  { key: 'projectionComfort', title: 'How bold should scents be?', options: [
    { v: 'skin_scent', l: 'Skin scent only' }, { v: 'moderate', l: 'Moderate' }, { v: 'bold', l: 'I like being noticed' },
  ]},
] as const;

const DEFAULT_PROFILE: Omit<UserProfile, 'lat' | 'lon' | 'cityLabel'> = {
  id: 'profile',
  gender: 'prefer_not',
  ageRange: '25-34',
  skinType: 'normal',
  sensitivity: false,
  workContext: 'office',
  dressStyle: 'smart_casual',
  projectionComfort: 'moderate',
  onboardingComplete: true,
};

export function Onboarding() {
  const { setProfile, setPrefs, prefs, refresh } = useApp();
  const navigate = useNavigate();
  const [welcome, setWelcome] = useState(true);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<UserProfile>>({});
  const [officeSafe, setOfficeSafe] = useState(true);
  const [showOfficeSafe, setShowOfficeSafe] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [pendingLocation, setPendingLocation] = useState<CityLocation | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const current = STEPS[step];

  const finishOnboarding = async (
    overrides: Partial<UserProfile> = {},
    enableOfficeSafe?: boolean,
    location?: CityLocation | null,
  ) => {
    setFinishing(true);
    try {
      const profile: UserProfile = {
        ...DEFAULT_PROFILE,
        ...data,
        ...overrides,
        lat: location?.lat,
        lon: location?.lon,
        cityLabel: location?.label,
        onboardingComplete: true,
      };
      await setProfile(profile);
      if (enableOfficeSafe != null) {
        await setPrefs({ ...prefs, officeSafeMode: enableOfficeSafe });
      }
      hapticSuccess();
      navigate('/');
    } finally {
      setFinishing(false);
    }
  };

  const resolveCity = async (): Promise<CityLocation | null> => {
    if (pendingLocation) return pendingLocation;
    if (!cityQuery.trim()) return null;
    const loc = await geocodeCity(cityQuery);
    if (!loc) {
      setLocationError('City not found — try “Paris, France” or “Austin, TX”.');
      return null;
    }
    setPendingLocation(loc);
    setLocationError(null);
    return loc;
  };

  const continueFromLocation = async () => {
    const loc = cityQuery.trim() ? await resolveCity() : pendingLocation;
    if (cityQuery.trim() && !loc) return;
    if (loc) setPendingLocation(loc);
    setShowLocation(false);
    setShowOfficeSafe(true);
  };

  const useGpsOnboarding = async () => {
    setLocationError(null);
    const loc = await requestLocation();
    if (!loc) {
      setLocationError('Could not access location — enter your city instead.');
      return;
    }
    setPendingLocation(loc);
    setCityQuery('');
    setShowLocation(false);
    setShowOfficeSafe(true);
  };

  const tryDemo = async () => {
    setLoadingDemo(true);
    setDemoError(null);
    try {
      await loadDemoData();
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[ScentCap] Demo load failed', err);
      setDemoError('Could not load demo collection. Try again or add ?demo=1 to the URL.');
    } finally {
      setLoadingDemo(false);
    }
  };

  const pick = async (value: string) => {
    const key = current.key;
    const next = { ...data, [key]: value };
    setData(next);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setShowLocation(true);
  };

  const shell = (children: React.ReactNode) => (
    <div className="relative min-h-dvh flex flex-col safe-pt safe-pb px-6">
      <AmbientBackground />
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10">
        {children}
      </div>
    </div>
  );

  if (welcome) {
    return shell(
      <motion.div
        className="text-center onboarding-splash"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="onboarding-mist" aria-hidden />
        <div className="relative z-10">
          <div className="onboarding-flacon" aria-hidden>
            <div className="onboarding-flacon-mist" />
            <div className="onboarding-flacon-neck" />
            <div className="onboarding-flacon-body" />
          </div>
          <p className="text-caption text-[var(--color-text-tertiary)]">ScentCap</p>
          <h1 className="text-display mt-3">Your scent counter</h1>
          <p className="text-subhead text-[var(--color-text-secondary)] mt-4 max-w-[18rem] mx-auto leading-relaxed">
            Blotter picks from your wardrobe. Private. On your device.
          </p>
          <div className="flex flex-col gap-3 mt-12">
            <Button size="lg" className="w-full btn-glow" onClick={tryDemo} disabled={loadingDemo} haptic="medium">
              {loadingDemo ? 'Loading…' : 'Try demo collection'}
            </Button>
            {loadingDemo && <CyclingShimmerText messages={DEMO_LOADING_MESSAGES} className="text-center" />}
            {demoError && <p className="text-xs text-[var(--color-accent)] mt-2 text-center">{demoError}</p>}
            <Button size="lg" variant="glass" className="w-full" onClick={() => setWelcome(false)}>
              Quick setup
            </Button>
            <button
              type="button"
              className="text-sm text-[var(--color-text-tertiary)] py-2 hover:text-[var(--color-accent)] transition-colors"
              onClick={() => finishOnboarding()}
              disabled={finishing}
            >
              {finishing ? 'Starting…' : 'Skip — use defaults'}
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-6 leading-relaxed">
            12 bottles · 30 days of wear history · No account
          </p>
        </div>
      </motion.div>,
    );
  }

  if (showOfficeSafe) {
    return shell(
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="h-1 bg-[var(--color-border-subtle)] rounded-full mb-10 overflow-hidden">
          <div className="h-full w-full bg-[var(--color-accent)] rounded-full" />
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-muted)] flex items-center justify-center">
            <Briefcase size={22} className="text-[var(--color-accent)]" />
          </div>
          <h2 className="text-title">Office Safe</h2>
        </div>
        <p className="text-subhead text-[var(--color-text-secondary)] leading-relaxed mb-6">
          Work-day picks stay low-projection and desk-friendly — no surprises in the conference room.
        </p>
        <button
          type="button"
          onClick={() => { hapticSelection(); setOfficeSafe((v) => !v); }}
          className={`w-full rounded-2xl p-5 text-left transition-all pressable ${
            officeSafe ? 'glass-premium border-[var(--color-accent)]/40' : 'glass-premium-subtle'
          }`}
        >
          <p className="font-semibold">{officeSafe ? 'Office Safe is on' : 'Office Safe is off'}</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {officeSafe ? 'Filtering to office-friendly scents' : 'All scents eligible for work'}
          </p>
        </button>
        <Button className="w-full mt-6 btn-glow" size="lg" onClick={() => finishOnboarding(data, officeSafe, pendingLocation)} disabled={finishing}>
          {finishing ? 'Starting…' : 'Get started'}
        </Button>
        <Button variant="ghost" className="w-full mt-2" onClick={() => { setShowOfficeSafe(false); setShowLocation(true); }}>Back</Button>
      </motion.div>,
    );
  }

  if (showLocation) {
    return shell(
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="h-1 bg-[var(--color-border-subtle)] rounded-full mb-10 overflow-hidden">
          <div className="h-full w-2/3 bg-[var(--color-accent)] rounded-full" />
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-muted)] flex items-center justify-center">
            <MapPin size={22} className="text-[var(--color-accent)]" />
          </div>
          <h2 className="text-title">Your city</h2>
        </div>
        <p className="text-subhead text-[var(--color-text-secondary)] leading-relaxed mb-6">
          Weather-aware picks without sharing GPS. Enter a city and we&apos;ll fetch live weather automatically.
        </p>
        <div className="relative">
          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-sm outline-none focus:border-[var(--color-accent)]/50 input-premium"
            placeholder="e.g. London, Tokyo, Austin TX"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setLocationError(null);
              setPendingLocation(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void continueFromLocation();
            }}
            autoComplete="address-level2"
          />
        </div>
        {pendingLocation && (
          <p className="text-xs text-[var(--color-accent)] mt-2">Found: {pendingLocation.label}</p>
        )}
        {locationError && <p className="text-xs text-amber-400 mt-2">{locationError}</p>}
        <Button variant="ghost" className="w-full mt-4 gap-2" onClick={useGpsOnboarding}>
          <Navigation size={16} />
          Use device location instead
        </Button>
        <Button className="w-full mt-4 btn-glow" size="lg" onClick={() => void continueFromLocation()} disabled={finishing}>
          Continue
        </Button>
        <Button variant="ghost" className="w-full mt-2" onClick={() => { setShowLocation(false); setShowOfficeSafe(true); }}>
          Skip for now
        </Button>
        <Button variant="ghost" className="w-full mt-2" onClick={() => setShowLocation(false)}>Back</Button>
      </motion.div>,
    );
  }

  return shell(
    <>
      <p className="text-caption text-[var(--color-text-tertiary)] text-center mb-3">Setup</p>
      <div className="h-1 bg-[var(--color-border-subtle)] rounded-full mb-10 overflow-hidden">
        <motion.div
          className="h-full bg-[var(--color-accent)] rounded-full"
          animate={{ width: `${((step + 1) / (STEPS.length + 1)) * 100}%` }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-title mb-6">{current.title}</h2>
          <div className="flex flex-col gap-2.5">
            {current.options.map((o) => (
              <Button key={o.v} variant="glass" className="w-full justify-start text-left !rounded-2xl" onClick={() => pick(o.v)} haptic="selection">
                {o.l}
              </Button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-3 mt-10">
        <Button variant="ghost" className="flex-1" onClick={() => (step > 0 ? setStep(step - 1) : setWelcome(true))}>Back</Button>
        <Button variant="glass" className="flex-1" onClick={() => { setShowLocation(true); }} disabled={finishing}>
          Skip
        </Button>
      </div>
    </>,
  );
}
