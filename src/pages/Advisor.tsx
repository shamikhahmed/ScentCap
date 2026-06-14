import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Share2, Bookmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { defaultAdvisorInput, runAdvisor } from '@/engines/advisor';
import { logWear, updateWearRecord } from '@/db';
import type { AdvisorInput, AdvisorResult } from '@/types';
import { uid } from '@/lib/utils';
import { WearRatingModal } from '@/components/ui/WearRatingModal';
import { SprayBodyMap } from '@/components/advisor/SprayBodyMap';
import { ScoreRing } from '@/components/home/ScoreRing';
import { FAMILY_COLORS } from '@/lib/stats';
import { weatherUnavailableMessage } from '@/services/weather';
import { advisorToShareInput, downloadBlob, exportShareCardPng, shareWearCard } from '@/lib/shareCard';
import { saveAdvisorLayering } from '@/lib/layeringSave';

const FIELDS: { key: keyof AdvisorInput; label: string; options: { v: string; l: string }[] }[] = [
  { key: 'timeOfDay', label: 'Time', options: [
    { v: 'morning', l: 'Morning' }, { v: 'afternoon', l: 'Afternoon' }, { v: 'evening', l: 'Evening' }, { v: 'night', l: 'Night' },
  ]},
  { key: 'occasion', label: 'Occasion', options: [
    { v: 'work', l: 'Work' }, { v: 'casual', l: 'Casual' }, { v: 'date', l: 'Date' }, { v: 'event', l: 'Event' }, { v: 'home', l: 'Home' },
  ]},
  { key: 'dressLevel', label: 'Dress', options: [
    { v: 'casual', l: 'Casual' }, { v: 'smart_casual', l: 'Smart casual' }, { v: 'semi_formal', l: 'Semi-formal' }, { v: 'formal', l: 'Formal' }, { v: 'professional', l: 'Professional' },
  ]},
  { key: 'vibe', label: 'Vibe', options: [
    { v: 'fresh', l: 'Fresh' }, { v: 'warm', l: 'Warm' }, { v: 'bold', l: 'Bold' }, { v: 'subtle', l: 'Subtle' }, { v: 'romantic', l: 'Romantic' }, { v: 'confident', l: 'Confident' },
  ]},
];

export function AdvisorPage() {
  const { profile, prefs, collection, history, weather, weatherUnavailable, refresh } = useApp();
  const location = useLocation();
  const preset = location.state as { occasion?: AdvisorInput['occasion']; dress?: AdvisorInput['dressLevel']; vibe?: AdvisorInput['vibe'] } | null;
  const weatherNotice = !weather ? weatherUnavailableMessage(weatherUnavailable) : null;

  const [input, setInput] = useState<AdvisorInput>(() => {
    const d = defaultAdvisorInput();
    if (preset?.occasion) d.occasion = preset.occasion;
    if (preset?.dress) d.dressLevel = preset.dress;
    if (preset?.vibe) d.vibe = preset.vibe;
    return d;
  });
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [pendingWear, setPendingWear] = useState<{ id: string; collectionId: string; fragranceId: string; name: string; sprays: number; wornAt: string } | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [layerSaved, setLayerSaved] = useState(false);

  const run = async () => {
    if (!profile) return;
    setLoading(true);
    const r = await runAdvisor(collection, input, profile, prefs, weather, history);
    setResult(r);
    setLoading(false);
  };

  const wear = async () => {
    if (!result || !profile) return;
    const wearId = uid();
    const sprays = result.spray.totalSprays;
    const wornAt = new Date().toISOString();
    await logWear({
      id: wearId,
      collectionId: result.primary.collectionId,
      fragranceId: result.primary.fragrance.id,
      wornAt,
      occasion: input.occasion,
      dressLevel: input.dressLevel,
      sprays,
    });
    await refresh();
    setPendingWear({
      id: wearId,
      collectionId: result.primary.collectionId,
      fragranceId: result.primary.fragrance.id,
      name: `${result.primary.fragrance.brand} ${result.primary.fragrance.name}`,
      sprays,
      wornAt,
    });
    setRatingOpen(true);
  };

  const saveRating = async (rating: number, compliment: boolean, notes?: string) => {
    if (!pendingWear) return;
    await updateWearRecord({
      id: pendingWear.id,
      collectionId: pendingWear.collectionId,
      fragranceId: pendingWear.fragranceId,
      wornAt: pendingWear.wornAt,
      occasion: input.occasion,
      dressLevel: input.dressLevel,
      sprays: pendingWear.sprays,
      rating,
      compliment,
      notes,
    });
    await refresh();
    setRatingOpen(false);
    setPendingWear(null);
  };

  const familyColor = result
    ? FAMILY_COLORS[result.primary.fragrance.family] ?? '#0a84ff'
    : '#0a84ff';

  const shareResult = async () => {
    if (!result) return;
    try {
      const shareInput = advisorToShareInput(result);
      const outcome = await shareWearCard(shareInput, familyColor, { format: 'square' });
      const msg = outcome === 'shared' ? 'Shared!' : outcome === 'copied' ? 'Copied to clipboard' : 'Saved as PNG';
      setShareMsg(msg);
      setTimeout(() => setShareMsg(null), 2500);
    } catch {
      const blob = await exportShareCardPng(advisorToShareInput(result), familyColor, { format: 'square' });
      downloadBlob(blob, 'scentcap-today-square.png');
      setShareMsg('Saved as PNG');
      setTimeout(() => setShareMsg(null), 2500);
    }
  };

  const saveLayering = async () => {
    if (!result?.layering) return;
    await saveAdvisorLayering(result);
    setLayerSaved(true);
    setTimeout(() => setLayerSaved(false), 2500);
  };

  return (
    <div className="safe-pt px-5 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">Scent Advisor</h1>

      {weatherNotice && (
        <Card className="flex items-start gap-3 border-white/5 bg-white/[0.02]">
          <MapPin className="text-stone-400 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium text-stone-300">No weather data</p>
            <p className="text-sm text-stone-500 mt-1">{weatherNotice}</p>
            <Link to="/settings" className="text-[var(--color-accent)] text-sm font-medium mt-2 inline-block">
              Update location
            </Link>
          </div>
        </Card>
      )}

      {prefs.officeSafeMode && (
        <Card className="flex items-start gap-3 border-[var(--color-accent)]/25 bg-[var(--color-accent-muted)]">
          <Briefcase className="text-[var(--color-accent)] shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium">Office Safe is on</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Work and professional picks stay low-projection and desk-friendly.
            </p>
            <Link to="/settings" className="text-[var(--color-accent)] text-sm font-medium mt-2 inline-block">
              Adjust in Settings
            </Link>
          </div>
        </Card>
      )}

      {FIELDS.map((field) => (
        <div key={field.key}>
          <p className="text-xs uppercase tracking-wider text-stone-500 mb-2">{field.label}</p>
          <div className="flex flex-wrap gap-2">
            {field.options.map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setInput({ ...input, [field.key]: o.v })}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[40px] ${
                  input[field.key] === o.v ? 'bg-[var(--color-accent)] text-stone-950' : 'bg-white/5 text-stone-300'
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
      ))}

      <Button className="w-full" onClick={run} disabled={loading || !collection.length}>
        {loading ? 'Analyzing wardrobe…' : 'Get recommendation'}
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="border-[var(--color-accent)]/40 flex gap-4 items-center">
            <div className="flex-1">
              <p className="text-xs text-[var(--color-accent)] uppercase tracking-wider">Primary</p>
              <h2 className="text-2xl font-semibold mt-1">{result.primary.fragrance.brand}</h2>
              <p className="text-lg text-stone-300">{result.primary.fragrance.name}</p>
            </div>
            <ScoreRing
              score={result.fragranceScore}
              color={FAMILY_COLORS[result.primary.fragrance.family] ?? '#c9a87c'}
            />
          </Card>

          <Card>
            <p className="font-medium mb-4 text-center">Application map</p>
            <SprayBodyMap
              pulsePoints={result.spray.pulsePoints}
              skinAreas={result.spray.skinAreas}
              clothingAreas={result.spray.clothingAreas}
              sprays={result.spray.totalSprays}
            />
            <p className="text-sm text-stone-400 mt-4 text-center">{result.spray.pulsePoints.join(' · ')}</p>
            {result.spray.skinAreas.length > 0 && <p className="text-sm mt-2">Skin: {result.spray.skinAreas.join(', ')}</p>}
            {result.spray.clothingAreas.length > 0 && <p className="text-sm mt-1">Clothes: {result.spray.clothingAreas.join(', ')}</p>}
            {result.spray.warnings.map((w) => <p key={w} className="text-amber-400/90 text-sm mt-2">⚠ {w}</p>)}
          </Card>

          {result.layering && (
            <Card>
              <p className="font-medium">Layering ({result.layering.compatibilityScore}% match)</p>
              <p className="text-sm text-stone-300 mt-2">{result.layering.order}</p>
              <p className="text-sm text-stone-400 mt-1">+ {result.layering.secondary.brand} {result.layering.secondary.name}</p>
              <p className="text-xs text-stone-500 mt-2">{result.layering.guidance}</p>
              <Button variant="ghost" className="w-full mt-3" onClick={saveLayering}>
                <Bookmark size={16} />
                {layerSaved ? 'Saved to Layering Lab!' : 'Save to Layering Lab'}
              </Button>
            </Card>
          )}

          {result.backups.length > 0 && (
            <Card>
              <p className="font-medium mb-3">Backup picks</p>
              <div className="space-y-2">
                {result.backups.map((b) => (
                  <div key={b.collectionId} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{b.fragrance.brand} {b.fragrance.name}</p>
                      <p className="text-xs text-stone-500">{b.fragrance.concentration} · {b.fragrance.family}</p>
                    </div>
                    <span className="text-[var(--color-accent)] text-xs font-semibold">{Math.round(b.score)}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <p className="font-medium mb-2">Why this scent</p>
            <ul className="text-sm text-stone-400 space-y-1">
              {result.reasoning.map((r) => <li key={r}>· {r}</li>)}
            </ul>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={wear}>Log today&apos;s wear</Button>
            <Button variant="ghost" className="px-4" onClick={shareResult} aria-label="Share recommendation">
              <Share2 size={16} />
            </Button>
          </div>
          {shareMsg && <p className="text-center text-xs text-[var(--color-accent)]">{shareMsg}</p>}
        </motion.div>
      )}

      <WearRatingModal
        open={ratingOpen}
        fragranceName={pendingWear?.name ?? ''}
        onSubmit={saveRating}
        onSkip={() => { setRatingOpen(false); setPendingWear(null); }}
      />
    </div>
  );
}
