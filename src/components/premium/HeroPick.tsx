import { Check, Droplet, Share } from 'lucide-react';
import { PressableLink } from '@/components/ui/PressableScale';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { Ring } from '@/components/kit';
import { fragranceDisplayName, concentrationLabel } from '@/lib/fragranceName';
import type { AdvisorResult } from '@/types';

/** Today's pick — product stage + decision. One primary action (Wear today). */
export function HeroPick({
  result,
  logged,
  shareMsg,
  photoUrl,
  moodLabel: occasionLabel,
  onWear,
  onShare,
}: {
  result: AdvisorResult;
  familyColor?: string;
  logged: boolean;
  shareMsg: string | null;
  photoUrl?: string | null;
  moodLabel?: string;
  onWear: () => void;
  onShare: () => void;
}) {
  const { primary, spray, fragranceScore, reasoning } = result;
  const f = primary.fragrance;
  const displayName = fragranceDisplayName(f.name);
  const zones = spray.pulsePoints.slice(0, 3).join(', ');

  return (
    <article className="ui-card ui-card--lg !p-0 overflow-hidden ui-rise" aria-labelledby="hero-name">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <PressableLink
          to={`/fragrance/${primary.collectionId}`}
          className="block bg-[var(--plinth)] p-6 lg:p-10"
          aria-label={`View ${f.brand} ${displayName}`}
        >
          <FragranceThumb
            fragrance={f}
            photoUrl={photoUrl}
            size="hero"
            variant="plinth"
            className="mx-auto max-w-[300px] !shadow-none !rounded-none"
          />
        </PressableLink>

        <div className="p-5 lg:p-8 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="ui-eyebrow !text-[var(--tint)]">
                {occasionLabel && occasionLabel !== 'Today' ? `${occasionLabel} pick` : 'Today’s pick'}
              </p>
              <p className="mt-2 text-[var(--t-footnote)] font-semibold uppercase tracking-[0.08em] text-[var(--label-2)]">
                {f.brand}
              </p>
              <h2 id="hero-name" className="serif text-[clamp(1.75rem,6vw,2.4rem)] leading-[1.05] font-medium mt-1">
                {displayName}
              </h2>
            </div>
            <div className="relative shrink-0 grid place-items-center" title="Match for today">
              <Ring value={fragranceScore} size={56} stroke={5} label={`${fragranceScore}% match`} />
              <span className="absolute text-[var(--t-footnote)] font-bold tabular-nums">{fragranceScore}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="ui-tag">{concentrationLabel(f.concentration)}</span>
            <span className="ui-tag">{f.family}</span>
            <span className="ui-tag ui-tag--tint">
              <Droplet size={11} className="mr-1" aria-hidden />
              {spray.totalSprays} spray{spray.totalSprays !== 1 ? 's' : ''}
            </span>
          </div>

          {reasoning[0] && <p className="text-[var(--t-subhead)] text-[var(--label-2)] leading-relaxed">{reasoning[0]}</p>}
          {zones && (
            <p className="ui-footnote">
              Apply to {zones}
              {spray.warnings[0] ? ` · ${spray.warnings[0]}` : ''}
            </p>
          )}

          <div className="flex gap-2.5 mt-auto pt-1">
            <button
              type="button"
              className="ui-btn ui-btn--primary flex-1"
              onClick={onWear}
              disabled={logged}
            >
              {logged ? (
                <>
                  <Check size={19} strokeWidth={2.6} aria-hidden /> Logged for today
                </>
              ) : (
                'Wear today'
              )}
            </button>
            <button type="button" className="ui-icon-btn !w-[50px] !h-[50px] !rounded-[var(--r-md)]" onClick={onShare} aria-label="Share today’s pick">
              <Share size={19} aria-hidden />
            </button>
          </div>
          {shareMsg && (
            <p className="ui-footnote text-center" role="status">
              {shareMsg}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
