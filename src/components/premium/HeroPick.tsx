import { motion } from 'framer-motion';
import { Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PressableLink } from '@/components/ui/PressableScale';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { fragranceDisplayName } from '@/services/onlineCatalog';
import type { AdvisorResult } from '@/types';

/** Museum hero: bottle dominates. Reason / spray / layering live below fold on Home. */
export function HeroPick({
  result,
  familyColor,
  logged,
  shareMsg,
  photoUrl,
  moodLabel: occasionLabel,
  onWear,
  onShare,
}: {
  result: AdvisorResult;
  familyColor: string;
  logged: boolean;
  layerSaved?: boolean;
  shareMsg: string | null;
  photoUrl?: string | null;
  moodLabel?: string;
  onWear: () => void;
  onShare: () => void;
  onSaveLayer?: () => void;
}) {
  const { primary, spray, fragranceScore } = result;
  const displayName = fragranceDisplayName(primary.fragrance.name);

  return (
    <motion.div
      className="museum-hero"
      style={{ '--aura': familyColor } as React.CSSProperties}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="museum-hero__stage">
        <PressableLink
          to={`/fragrance/${primary.collectionId}`}
          className="museum-hero__bottle-link"
          aria-label={`View ${primary.fragrance.brand} ${displayName}`}
        >
          <FragranceThumb
            brand={primary.fragrance.brand}
            name={displayName}
            family={primary.fragrance.family}
            catalogImage={primary.fragrance.image}
            photoUrl={photoUrl}
            fragrance={primary.fragrance}
            size="hero"
            className="museum-hero__thumb"
          />
        </PressableLink>
      </div>

      <p className="museum-hero__eyebrow">
        {occasionLabel ? `${occasionLabel} · ${fragranceScore}% match` : `Today · ${fragranceScore}% match`}
      </p>
      <h2 className="museum-hero__brand">{primary.fragrance.brand}</h2>
      <p className="museum-hero__name">{displayName}</p>
      <p className="museum-hero__meta">
        {primary.fragrance.concentration}
        <span aria-hidden> · </span>
        {primary.fragrance.family}
        <span aria-hidden> · </span>
        {spray.totalSprays} spray{spray.totalSprays !== 1 ? 's' : ''}
      </p>

      <div className="museum-hero__actions">
        <Button className="flex-1 btn-glow" size="lg" onClick={onWear} disabled={logged} haptic="success">
          {logged ? (
            <>
              <Check size={18} strokeWidth={2.5} /> Logged
            </>
          ) : (
            'Wear this today'
          )}
        </Button>
        <Button variant="ghost" size="lg" className="!px-4 border border-[var(--sc-border-soft)]" onClick={onShare} aria-label="Share">
          <Share2 size={18} />
        </Button>
      </div>
      {shareMsg && <p className="museum-hero__share-msg">{shareMsg}</p>}
    </motion.div>
  );
}
