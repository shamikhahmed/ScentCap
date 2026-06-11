import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { requestLocation } from '@/services/weather';
import type { UserProfile } from '@/types';
import { MistBackground } from '@/components/home/MistBackground';

const STEPS = [
  { key: 'gender', title: 'How do you identify?', options: [
    { v: 'man', l: 'Man' }, { v: 'woman', l: 'Woman' }, { v: 'nonbinary', l: 'Non-binary' }, { v: 'prefer_not', l: 'Prefer not to say' },
  ]},
  { key: 'ageRange', title: 'Age range', options: [
    { v: 'under18', l: 'Under 18' }, { v: '18-24', l: '18–24' }, { v: '25-34', l: '25–34' }, { v: '35-44', l: '35–44' }, { v: '45plus', l: '45+' },
  ]},
  { key: 'skinType', title: 'Skin type', options: [
    { v: 'dry', l: 'Dry' }, { v: 'normal', l: 'Normal' }, { v: 'oily', l: 'Oily' },
  ]},
  { key: 'sensitivity', title: 'Fragrance sensitivity?', options: [
    { v: 'false', l: 'No' }, { v: 'true', l: 'Yes — keep sprays light' },
  ]},
  { key: 'workContext', title: 'Work context', options: [
    { v: 'office', l: 'Office daily' }, { v: 'hybrid', l: 'Hybrid' }, { v: 'wfh', l: 'Work from home' }, { v: 'student', l: 'Student' }, { v: 'other', l: 'Other' },
  ]},
  { key: 'dressStyle', title: 'Usual dress style', options: [
    { v: 'casual', l: 'Casual' }, { v: 'smart_casual', l: 'Smart casual' }, { v: 'formal', l: 'Often formal' },
  ]},
  { key: 'projectionComfort', title: 'Projection comfort', options: [
    { v: 'skin_scent', l: 'Skin scent only' }, { v: 'moderate', l: 'Moderate' }, { v: 'bold', l: 'I like being noticed' },
  ]},
] as const;

export function Onboarding() {
  const { setProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<UserProfile>>({});

  const current = STEPS[step];

  const pick = async (value: string) => {
    const key = current.key;
    const next = { ...data, [key]: key === 'sensitivity' ? value === 'true' : value };
    setData(next);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    const loc = await requestLocation();
    const profile: UserProfile = {
      id: 'profile',
      gender: (next.gender as UserProfile['gender']) ?? 'prefer_not',
      ageRange: (next.ageRange as UserProfile['ageRange']) ?? '25-34',
      skinType: (next.skinType as UserProfile['skinType']) ?? 'normal',
      sensitivity: Boolean(next.sensitivity),
      workContext: (next.workContext as UserProfile['workContext']) ?? 'office',
      dressStyle: (next.dressStyle as UserProfile['dressStyle']) ?? 'smart_casual',
      projectionComfort: (next.projectionComfort as UserProfile['projectionComfort']) ?? 'moderate',
      lat: loc?.lat,
      lon: loc?.lon,
      cityLabel: loc?.label,
      onboardingComplete: true,
    };
    await setProfile(profile);
    navigate('/');
  };

  return (
    <div className="relative min-h-dvh gradient-hero flex flex-col safe-pt safe-pb px-6">
      <MistBackground />
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="welcome-orb mx-auto mb-6 scale-75" />
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent)] mb-2 text-center">ScentCap</p>
        <div className="h-1 bg-white/10 rounded-full mb-10 overflow-hidden">
          <motion.div className="h-full bg-[var(--color-accent)]" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-3xl font-semibold tracking-tight mb-8">{current.title}</h2>
            <div className="flex flex-col gap-3">
              {current.options.map((o) => (
                <Button key={o.v} variant="ghost" className="w-full justify-start text-left" onClick={() => pick(o.v)}>
                  {o.l}
                </Button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        {step > 0 && (
          <Button variant="outline" className="mt-8" onClick={() => setStep(step - 1)}>Back</Button>
        )}
      </div>
    </div>
  );
}
