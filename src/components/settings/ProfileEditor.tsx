import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import type { UserProfile } from '@/types';

const FIELDS: { key: keyof UserProfile; label: string; options: { v: string; l: string }[] }[] = [
  { key: 'gender', label: 'Gender', options: [
    { v: 'man', l: 'Man' }, { v: 'woman', l: 'Woman' }, { v: 'nonbinary', l: 'Non-binary' }, { v: 'prefer_not', l: 'Prefer not' },
  ]},
  { key: 'ageRange', label: 'Age', options: [
    { v: 'under18', l: 'Under 18' }, { v: '18-24', l: '18–24' }, { v: '25-34', l: '25–34' }, { v: '35-44', l: '35–44' }, { v: '45plus', l: '45+' },
  ]},
  { key: 'skinType', label: 'Skin', options: [{ v: 'dry', l: 'Dry' }, { v: 'normal', l: 'Normal' }, { v: 'oily', l: 'Oily' }] },
  { key: 'workContext', label: 'Work', options: [
    { v: 'office', l: 'Office' }, { v: 'hybrid', l: 'Hybrid' }, { v: 'wfh', l: 'WFH' }, { v: 'student', l: 'Student' }, { v: 'other', l: 'Other' },
  ]},
  { key: 'dressStyle', label: 'Dress', options: [
    { v: 'casual', l: 'Casual' }, { v: 'smart_casual', l: 'Smart casual' }, { v: 'formal', l: 'Formal' },
  ]},
  { key: 'projectionComfort', label: 'Projection', options: [
    { v: 'skin_scent', l: 'Skin scent' }, { v: 'moderate', l: 'Moderate' }, { v: 'bold', l: 'Bold' },
  ]},
];

export function ProfileEditor() {
  const { profile, setProfile } = useApp();
  if (!profile) return null;

  const update = (key: keyof UserProfile, value: string) => {
    const next = { ...profile, [key]: key === 'sensitivity' ? value === 'true' : value } as UserProfile;
    setProfile(next);
  };

  return (
    <Card className="space-y-4">
      <p className="font-medium">Your profile</p>
      {FIELDS.map((f) => (
        <div key={f.key} role="radiogroup" aria-label={f.label}>
          <p className="text-xs text-[var(--sc-text-muted)] mb-2" id={`profile-${f.key}-label`}>{f.label}</p>
          <div className="flex flex-wrap gap-2" aria-labelledby={`profile-${f.key}-label`}>
            {f.options.map((o) => {
              const selected = String(profile[f.key]) === o.v;
              return (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update(f.key, o.v)}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium ${
                    selected ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--sc-surface)] border border-[var(--sc-border-soft)]'
                  }`}
                >
                  {o.l}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div role="radiogroup" aria-label="Sensitivity">
        <p className="text-xs text-[var(--sc-text-muted)] mb-2" id="profile-sensitivity-label">Sensitivity</p>
        <div className="flex gap-2" aria-labelledby="profile-sensitivity-label">
          <Button
            size="sm"
            className="min-h-[44px]"
            role="radio"
            aria-checked={!profile.sensitivity}
            variant={!profile.sensitivity ? 'default' : 'ghost'}
            onClick={() => update('sensitivity', 'false')}
          >
            No
          </Button>
          <Button
            size="sm"
            className="min-h-[44px]"
            role="radio"
            aria-checked={!!profile.sensitivity}
            variant={profile.sensitivity ? 'default' : 'ghost'}
            onClick={() => update('sensitivity', 'true')}
          >
            Yes
          </Button>
        </div>
      </div>
    </Card>
  );
}
