import { motion } from 'framer-motion';
import { Bookmark, Check, Layers, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PressableLink } from '@/components/ui/PressableScale';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { ScoreRing } from '@/components/home/ScoreRing';
import { SprayBodyMap } from '@/components/advisor/SprayBodyMap';
import type { AdvisorResult } from '@/types';

export function HeroPick({
  result,
  familyColor,
  logged,
  layerSaved,
  shareMsg,
  photoUrl,
  moodLabel: occasionLabel,
  onWear,
  onShare,
  onSaveLayer,
}: {
  result: AdvisorResult;
  familyColor: string;
  logged: boolean;
  layerSaved: boolean;
  shareMsg: string | null;
  photoUrl?: string | null;
  moodLabel?: string;
  onWear: () => void;
  onShare: () => void;
  onSaveLayer: () => void;
}) {
  const { primary, spray, reasoning, layering, fragranceScore } = result;
  const hasSprayMap = spray.totalSprays > 0 && (spray.activeZones?.length ?? 0) > 0;

  const fragById = (id: string) =>
    layering?.primary.id === id ? layering.primary : layering?.secondary;

  return (
    <motion.div
      className="hero-pick-premium"
      style={{ '--aura': familyColor } as React.CSSProperties}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="hero-aura-glow" aria-hidden />
      <div className="hero-pick-inner">
        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="hero-bottle-stage mb-5"
          >
            <PressableLink
              to={`/fragrance/${primary.collectionId}`}
              className="block w-full max-w-[140px] mx-auto"
              aria-label={`View ${primary.fragrance.brand} ${primary.fragrance.name}`}
            >
              <FragranceThumb
                brand={primary.fragrance.brand}
                name={primary.fragrance.name}
                family={primary.fragrance.family}
                catalogImage={primary.fragrance.image}
                photoUrl={photoUrl}
                fragrance={primary.fragrance}
                size="lg"
                className="mx-auto catalog-bottle-thumb"
              />
            </PressableLink>
          </motion.div>

          <p className="hero-eyebrow">{occasionLabel ? `${occasionLabel} pick` : "Today's scent"}</p>
          <h2 className="hero-brand">{primary.fragrance.brand}</h2>
          <p className="hero-name">{primary.fragrance.name}</p>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="tag-premium">{primary.fragrance.concentration}</span>
            <span className="tag-premium">{primary.fragrance.family}</span>
            <span className="tag-premium">{spray.totalSprays} spray{spray.totalSprays !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 px-1 mb-5">
          <p className="flex-1 text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3 text-left">
            {reasoning[0]}
          </p>
          <ScoreRing score={fragranceScore} color={familyColor} size={80} />
        </div>

        {hasSprayMap && (
          <div className="mb-5 px-1 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/40 p-3.5">
            <SprayBodyMap
              bodyVariant={spray.bodyVariant ?? 'neutral'}
              activeZones={spray.activeZones ?? []}
              sprays={spray.totalSprays}
              compact
              isLayered={spray.isLayered}
              techniqueNote={spray.techniqueNote}
            />
            {spray.warnings.length > 0 && (
              <p className="text-[11px] text-amber-400/90 mt-2.5 leading-relaxed">{spray.warnings[0]}</p>
            )}
          </div>
        )}

        {layering && spray.isLayered && spray.layeringRoles && (
          <div className="mb-5 px-1 rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-accent-muted)]/40 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                <Layers size={13} /> Layering · {layering.compatibilityScore}% match
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {(['base', 'accent'] as const).map((role) => {
                const roleData = spray.layeringRoles![role];
                const f = fragById(roleData.fragranceId);
                const color = role === 'base' ? '#c9a87c' : '#0a84ff';
                const placement = role === 'base' ? 'Chest & neck' : 'Wrists & ears';
                return (
                  <div key={role} className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color }}>
                      {role === 'base' ? 'Base' : 'Top'} · {roleData.sprays} spray{roleData.sprays !== 1 ? 's' : ''}
                    </p>
                    <FragranceThumb
                      brand={f?.brand ?? roleData.brand}
                      name={roleData.name}
                      family={f?.family}
                      catalogImage={f?.image}
                      fragrance={f}
                      size="sm"
                      className="w-14 mx-auto"
                    />
                    <p className="text-[11px] font-medium mt-1.5 line-clamp-2">{roleData.name}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{placement}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] text-center leading-relaxed">{layering.guidance}</p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={onSaveLayer}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl min-h-[40px] text-xs font-semibold bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] pressable"
              >
                <Bookmark size={13} />
                {layerSaved ? 'Saved' : 'Save combo'}
              </button>
              <PressableLink
                to="/layering"
                className="flex-1 flex items-center justify-center rounded-xl min-h-[40px] text-xs font-semibold text-[var(--color-accent)] border border-[var(--color-accent)]/30 pressable"
              >
                Layering Lab
              </PressableLink>
            </div>
          </div>
        )}

        <div className="flex gap-2.5">
          <Button className="flex-1 btn-glow" size="lg" onClick={onWear} disabled={logged} haptic="success">
            {logged ? <><Check size={18} strokeWidth={2.5} /> Logged</> : 'Wear this today'}
          </Button>
          <Button variant="glass" size="lg" className="px-4" onClick={onShare} aria-label="Share">
            <Share2 size={18} />
          </Button>
          <PressableLink
            to="/advisor"
            className="inline-flex items-center justify-center rounded-2xl min-h-[52px] px-4 glass-premium-subtle pressable"
          >
            <Sparkles size={18} className="text-[var(--color-accent)]" />
          </PressableLink>
        </div>
        {shareMsg && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs font-medium text-[var(--color-accent)] mt-3"
          >
            {shareMsg}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
