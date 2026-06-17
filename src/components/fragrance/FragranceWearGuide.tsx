import { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { SprayBodyMap } from '@/components/advisor/SprayBodyMap';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { computeLayeringSprayGuidance, computeSprayGuidance } from '@/engines/spray';
import { findBestLayering } from '@/engines/layering';
import { defaultAdvisorInput } from '@/engines/advisor';
import { genderToBodyVariant } from '@/lib/sprayZones';
import type { AdvisorInput, Fragrance, Preferences, UserProfile } from '@/types';
import { GlassCard } from '@/components/premium/GlassCard';
import { PressableLink } from '@/components/ui/PressableScale';

export function FragranceWearGuide({
  fragrance,
  wardrobe,
  profile,
  prefs,
  advisorInput,
}: {
  fragrance: Fragrance;
  wardrobe: Fragrance[];
  profile: UserProfile;
  prefs: Preferences;
  advisorInput?: AdvisorInput;
}) {
  const input = advisorInput ?? defaultAdvisorInput();
  const spray = useMemo(
    () => computeSprayGuidance(fragrance, input, profile, prefs.officeMaxSprays),
    [fragrance, input, profile, prefs.officeMaxSprays],
  );

  const layering = useMemo(() => {
    const others = wardrobe.filter((f) => f.id !== fragrance.id);
    if (others.length === 0) return null;
    const match = findBestLayering(fragrance, others);
    if (!match) return null;
    const sprayPlan = computeLayeringSprayGuidance(
      fragrance,
      match.secondary,
      input,
      profile,
      prefs.officeMaxSprays,
    );
    return { match, sprayPlan };
  }, [fragrance, wardrobe, input, profile, prefs.officeMaxSprays]);

  return (
    <div className="space-y-4">
      <GlassCard className="!p-4 md:!p-5">
        <p className="text-caption text-[var(--color-text-tertiary)] mb-1">How to wear</p>
        <p className="text-headline text-sm mb-3">{fragrance.concentration} · {spray.totalSprays} sprays</p>
        <SprayBodyMap
          bodyVariant={spray.bodyVariant ?? genderToBodyVariant(profile.gender)}
          activeZones={spray.activeZones}
          sprays={spray.totalSprays}
          applicationSteps={spray.applicationSteps}
          techniqueNote={spray.techniqueNote}
          compact
        />
      </GlassCard>

      {layering && (
        <GlassCard className="!p-4 border-[var(--color-accent)]/25">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5 mb-3">
            <Layers size={13} /> Layer with · {layering.match.score}% match
          </p>
          <div className="flex items-center gap-3 mb-3">
            <FragranceThumb
              brand={fragrance.brand}
              name={fragrance.name}
              family={fragrance.family}
              catalogImage={fragrance.image}
              fragrance={fragrance}
              size="sm"
              className="w-12"
            />
            <span className="text-lg text-[var(--color-text-tertiary)]">+</span>
            <FragranceThumb
              brand={layering.match.secondary.brand}
              name={layering.match.secondary.name}
              family={layering.match.secondary.family}
              catalogImage={layering.match.secondary.image}
              fragrance={layering.match.secondary}
              size="sm"
              className="w-12"
            />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mb-3">{layering.match.order}</p>
          <SprayBodyMap
            bodyVariant={layering.sprayPlan.bodyVariant}
            activeZones={layering.sprayPlan.activeZones}
            sprays={layering.sprayPlan.totalSprays}
            isLayered
            techniqueNote={layering.sprayPlan.techniqueNote}
            compact
          />
          <PressableLink
            to="/layering"
            className="block text-center text-xs font-semibold text-[var(--color-accent)] mt-3"
          >
            Open Layering Lab
          </PressableLink>
        </GlassCard>
      )}
    </div>
  );
}
