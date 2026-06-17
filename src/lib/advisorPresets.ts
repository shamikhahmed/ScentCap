import { defaultAdvisorInput } from '@/engines/advisor';
import type { AdvisorInput, UserProfile } from '@/types';

export type MoodPreset = {
  id: string;
  label: string;
  icon: string;
  occasion: AdvisorInput['occasion'];
  dressLevel: AdvisorInput['dressLevel'];
  vibe: AdvisorInput['vibe'];
};

export const MOOD_PRESETS: MoodPreset[] = [
  { id: 'office', label: 'Office', icon: '💼', occasion: 'work', dressLevel: 'professional', vibe: 'subtle' },
  { id: 'date', label: 'Date', icon: '🌹', occasion: 'date', dressLevel: 'smart_casual', vibe: 'romantic' },
  { id: 'weekend', label: 'Weekend', icon: '☕', occasion: 'casual', dressLevel: 'casual', vibe: 'confident' },
  { id: 'gala', label: 'Gala', icon: '✨', occasion: 'event', dressLevel: 'formal', vibe: 'bold' },
];

export function initialAdvisorInput(profile?: UserProfile): AdvisorInput {
  const input = defaultAdvisorInput();
  if (profile?.workContext === 'office') {
    input.occasion = 'work';
    input.dressLevel = 'professional';
    input.vibe = 'subtle';
  }
  return input;
}

export function advisorInputFromPreset(preset: MoodPreset): AdvisorInput {
  const base = defaultAdvisorInput();
  return {
    ...base,
    occasion: preset.occasion,
    dressLevel: preset.dressLevel,
    vibe: preset.vibe,
  };
}

export function presetForInput(input: AdvisorInput): MoodPreset | null {
  return MOOD_PRESETS.find(
    (p) => p.occasion === input.occasion && p.dressLevel === input.dressLevel && p.vibe === input.vibe,
  ) ?? null;
}

export function moodLabel(input: AdvisorInput): string {
  const preset = presetForInput(input);
  if (preset) return preset.label;
  if (input.occasion === 'work') return 'Work';
  if (input.occasion === 'date') return 'Date';
  if (input.occasion === 'event') return 'Event';
  if (input.occasion === 'home') return 'Home';
  return 'Today';
}
