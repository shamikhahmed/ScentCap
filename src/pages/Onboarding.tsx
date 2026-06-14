import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { loadDemoData } from '@/services/demo';
import { requestLocation } from '@/services/weather';
import type { UserProfile } from '@/types';
import { MistBackground } from '@/components/home/MistBackground';

/** Essential steps only — under 60s to first daily pick */
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
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const current = STEPS[step];

  const finishOnboarding = async (overrides: Partial<UserProfile> = {}, enableOfficeSafe?: boolean) => {
    setFinishing(true);
    try {
      const loc = await requestLocation();
      const profile: UserProfile = {
        ...DEFAULT_PROFILE,
        ...data,
        ...overrides,
        lat: loc?.lat,
        lon: loc?.lon,
        cityLabel: loc?.label,
        onboardingComplete: true,
      };
      await setProfile(profile);
      if (enableOfficeSafe != null) {
        await setPrefs({ ...prefs, officeSafeMode: enableOfficeSafe });
      }
      navigate('/');
    } finally {
      setFinishing(false);
    }
  };

  const tryDemo = async () => {
    setLoadingDemo(true);
    try {
      await loadDemoData();
      await refresh();
      navigate('/');
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
    setShowOfficeSafe(true);
  };

  if (welcome) {
    return (
      <div className="relative min-h-dvh gradient-hero flex flex-col safe-pt safe-pb px-6">
        <MistBackground />
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full text-center">
          <div className="welcome-orb mx-auto mb-8" />
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)] mb-2">ScentCap</p>
          <h1 className="text-3xl font-semibold tracking-tight">Your fragrance OS</h1>
          <p className="text-[var(--color-text-secondary)] mt-4 leading-relaxed">
            Daily picks from your wardrobe — private, on your device.
          </p>
          <div className="flex flex-col gap-3 mt-10">
            <Button
              size="lg"
              className="w-full"
              onClick={tryDemo}
              disabled={loadingDemo}
            >
              {loadingDemo ? 'Loading demo…' : 'Try demo collection'}
            </Button>
            <Button size="lg" variant="ghost" className="w-full" onClick={() => setWelcome(false)}>
              Quick setup (2 questions)
            </Button>
            <button
              type="button"
              className="text-sm text-[var(--color-text-tertiary)] mt-1 hover:text-[var(--color-accent)] transition-colors"
              onClick={() => finishOnboarding()}
              disabled={finishing}
            >
              {finishing ? 'Starting…' : 'Skip — use defaults'}
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-4">
            Demo loads 12 bottles and 30 days of wear history. No account needed.
          </p>
        </div>
      </div>
    );
  }

  if (showOfficeSafe) {
    return (
      <div className="relative min-h-dvh gradient-hero flex flex-col safe-pt safe-pb px-6">
        <MistBackground />
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)] mb-2 text-center">ScentCap</p>
          <div className="h-1 bg-[var(--color-border-subtle)] rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-[var(--color-accent)] w-full rounded-full" />
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center">
                <Briefcase size={20} className="text-[var(--color-accent)]" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Office Safe</h2>
            </div>
            <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
              When enabled, work-day picks stay low-projection and desk-friendly — no beast-mode surprises in the conference room.
            </p>
            <button
              type="button"
              onClick={() => setOfficeSafe((v) => !v)}
              className={`w-full rounded-xl p-4 border text-left transition-colors ${
                officeSafe
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                  : 'border-[var(--color-border-subtle)] bg-[var(--color-surface)]'
              }`}
            >
              <p className="font-medium">{officeSafe ? 'Office Safe is ON' : 'Office Safe is OFF'}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {officeSafe ? 'Work picks filter to office-friendly scents' : 'All scents eligible for work days'}
              </p>
            </button>
            <Button
              className="w-full mt-6"
              size="lg"
              onClick={() => finishOnboarding(data, officeSafe)}
              disabled={finishing}
            >
              {finishing ? 'Starting…' : 'Get started'}
            </Button>
            <Button variant="ghost" className="w-full mt-2" onClick={() => setShowOfficeSafe(false)}>
              Back
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh gradient-hero flex flex-col safe-pt safe-pb px-6">
      <MistBackground />
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)] mb-2 text-center">ScentCap</p>
        <div className="h-1 bg-[var(--color-border-subtle)] rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-[var(--color-accent)]"
            animate={{ width: `${((step + 1) / (STEPS.length + 1)) * 100}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-semibold tracking-tight mb-6">{current.title}</h2>
            <div className="flex flex-col gap-2">
              {current.options.map((o) => (
                <Button key={o.v} variant="ghost" className="w-full justify-start text-left" onClick={() => pick(o.v)}>
                  {o.l}
                </Button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-3 mt-8">
          {step > 0 ? (
            <Button variant="ghost" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>
          ) : (
            <Button variant="ghost" className="flex-1" onClick={() => setWelcome(true)}>Back</Button>
          )}
          <Button variant="outline" className="flex-1" onClick={() => finishOnboarding()} disabled={finishing}>
            {finishing ? '…' : 'Skip'}
          </Button>
        </div>
      </div>
    </div>
  );
}
