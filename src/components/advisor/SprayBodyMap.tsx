import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Plus, Shirt, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PressableLink } from '@/components/ui/PressableScale';
import type { ActiveSprayZone, BodyVariant } from '@/lib/sprayZones';
import { bodyVariantLabel, getZoneCatalog } from '@/lib/sprayZones';
import { BodyFigureFemale, BodyFigureMale, BodyFigureNeutral } from '@/components/advisor/bodyFigures';

const TYPE_ICON = {
  pulse: Droplets,
  skin: Sparkles,
  clothing: Shirt,
};

const TYPE_LABEL = {
  pulse: 'Pulse point',
  skin: 'Skin',
  clothing: 'On clothing',
};

const ROLE_COLOR = {
  // Hex required — UI appends alpha suffixes (`${color}33`).
  base: '#0a5f52',
  accent: '#45c4ad',
};

export function SprayBodyMap({
  bodyVariant,
  activeZones,
  sprays,
  compact = false,
  applicationSteps,
  techniqueNote,
  isLayered = false,
}: {
  bodyVariant: BodyVariant;
  activeZones: ActiveSprayZone[];
  sprays: number;
  compact?: boolean;
  applicationSteps?: string[];
  techniqueNote?: string;
  isLayered?: boolean;
}) {
  const [focused, setFocused] = useState<number | null>(null);
  const catalog = getZoneCatalog(bodyVariant);
  const zoneById = useMemo(
    () => new Map(activeZones.map((z) => [z.id, z])),
    [activeZones],
  );

  const primaryZones = activeZones.filter((z) => !z.optional);
  const optionalZones = activeZones.filter((z) => z.optional);

  const Figure =
    bodyVariant === 'female' ? BodyFigureFemale : bodyVariant === 'male' ? BodyFigureMale : BodyFigureNeutral;

  const zoneColor = (zone: ActiveSprayZone) => {
    if (zone.fragranceRole === 'base') return ROLE_COLOR.base;
    if (zone.fragranceRole === 'accent') return ROLE_COLOR.accent;
    return 'var(--color-accent)';
  };

  if (sprays === 0 && !activeZones.length) {
    return (
      <div className={cn('text-center text-sm text-[var(--color-text-secondary)]', compact ? 'py-3' : 'py-8')}>
        No skin application recommended for this context.
      </div>
    );
  }

  const renderMapDots = (r: number, fontSize: number) =>
    catalog.map((zone) => {
      const meta = zoneById.get(zone.id);
      if (!meta) return null;
      const color = zoneColor(meta);
      const isOptional = meta.optional;

      if (isOptional) {
        return (
          <g key={zone.id}>
            <circle
              cx={zone.x}
              cy={zone.y}
              r={r - 2}
              fill="none"
              stroke={color}
              strokeWidth="1.2"
              strokeDasharray="3 2"
              opacity={0.55}
            />
            <text
              x={zone.x}
              y={zone.y + fontSize * 0.3}
              textAnchor="middle"
              fill={color}
              fontSize={fontSize - 1}
              fontWeight="700"
              fontFamily="system-ui, sans-serif"
              opacity={0.7}
            >
              +
            </text>
          </g>
        );
      }

      return (
        <g key={zone.id}>
          <circle
            cx={zone.x}
            cy={zone.y}
            r={r}
            fill={color}
            fillOpacity={0.28}
            stroke={color}
            strokeWidth="1.4"
          />
          <text
            x={zone.x}
            y={zone.y + fontSize * 0.35}
            textAnchor="middle"
            fill="white"
            fontSize={fontSize}
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            {meta.sprayNumber}
          </text>
        </g>
      );
    });

  const renderZoneRow = (zone: ActiveSprayZone, selected: boolean) => {
    const Icon = TYPE_ICON[zone.type];
    const color = zoneColor(zone);
    const isOptional = zone.optional;

    return (
      <button
        type="button"
        onClick={() => !isOptional && setFocused(selected ? null : zone.sprayNumber)}
        disabled={isOptional}
        className={cn(
          'w-full flex items-start gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors',
          !isOptional && 'pressable',
          isOptional && 'opacity-80 cursor-default',
          selected
            ? 'bg-[var(--color-accent-muted)] border border-[var(--color-accent)]/35'
            : 'bg-[var(--color-bg-secondary)]/80 border border-[var(--color-border-subtle)]',
          compact && '!px-2.5 !py-2 rounded-xl',
        )}
      >
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums',
            compact ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm',
          )}
          style={
            isOptional
              ? { border: `1.5px dashed ${color}`, color, background: 'transparent' }
              : { background: selected ? color : `${color}33`, color: selected ? '#fff' : color }
          }
        >
          {isOptional ? <Plus size={compact ? 10 : 12} /> : zone.sprayNumber}
        </span>
        <span className="flex-1 min-w-0 pt-0.5">
          {zone.fragranceRole && zone.fragranceName && (
            <span
              className="block text-[10px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color }}
            >
              {zone.fragranceRole === 'base' ? 'Base' : 'Top'} · {zone.fragranceName}
            </span>
          )}
          {isOptional && (
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">
              Optional
            </span>
          )}
          <span className={cn('block font-medium leading-snug', compact ? 'text-xs' : 'text-sm')}>
            {zone.label}
          </span>
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wide font-semibold">
            <Icon size={10} style={{ color }} />
            {TYPE_LABEL[zone.type]}
          </span>
        </span>
      </button>
    );
  };

  const zoneList = (
    <>
      {primaryZones.length > 0 && (
        <div className={cn('space-y-1.5', optionalZones.length > 0 && 'mb-3')}>
          {!compact && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] px-0.5">
              Apply here · {sprays} spray{sprays !== 1 ? 's' : ''}
            </p>
          )}
          {primaryZones.map((zone) => (
            <div key={zone.id}>{renderZoneRow(zone, focused === zone.sprayNumber)}</div>
          ))}
        </div>
      )}
      {optionalZones.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] px-0.5">
            Optional · clothes &amp; hair
          </p>
          {optionalZones.map((zone) => (
            <div key={zone.id}>{renderZoneRow(zone, false)}</div>
          ))}
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <div className="spray-body-map spray-body-map--compact">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {isLayered ? 'Layering map' : 'How to apply'} · {sprays} spray{sprays !== 1 ? 's' : ''}
          </p>
          <PressableLink to="/advisor" className="text-[11px] font-semibold text-[var(--color-accent)] shrink-0">
            Full map
          </PressableLink>
        </div>
        {isLayered && (
          <div className="flex gap-3 mb-2.5 text-[10px] font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center gap-1" style={{ color: ROLE_COLOR.base }}>
              <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR.base }} /> Base · skin
            </span>
            <span className="inline-flex items-center gap-1" style={{ color: ROLE_COLOR.accent }}>
              <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR.accent }} /> Top · pulse
            </span>
          </div>
        )}
        <div className="flex gap-3 items-start">
          <div
            className="relative shrink-0 w-[88px] spray-body-figure-wrap spray-body-figure-wrap--compact"
            role="img"
            aria-label={`${bodyVariantLabel(bodyVariant)} with ${primaryZones.length} spray zones and ${optionalZones.length} optional`}
          >
            <svg viewBox="0 0 240 520" className="w-full h-auto">
              <Figure />
              {renderMapDots(12, 9)}
            </svg>
          </div>
          <div className="flex-1 min-w-0 max-h-[220px] overflow-y-auto">{zoneList}</div>
        </div>
        {techniqueNote && (
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-2.5 leading-relaxed">{techniqueNote}</p>
        )}
      </div>
    );
  }

  return (
    <div className="spray-body-map">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-headline text-sm">{isLayered ? 'Layering placement' : 'Where to spray'}</p>
          <p className="text-caption text-[var(--color-text-tertiary)] mt-0.5">
            {bodyVariantLabel(bodyVariant)} · {sprays} spray{sprays !== 1 ? 's' : ''}
            {optionalZones.length > 0 && ` · ${optionalZones.length} optional`}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {isLayered ? (
            <>
              <span className="inline-flex items-center gap-1" style={{ color: ROLE_COLOR.base }}>
                <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR.base }} /> Base on skin
              </span>
              <span className="inline-flex items-center gap-1" style={{ color: ROLE_COLOR.accent }}>
                <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR.accent }} /> Top on pulse
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1"><Droplets size={11} className="text-[var(--color-accent)]" /> Pulse</span>
              <span className="inline-flex items-center gap-1"><Sparkles size={11} className="text-[var(--color-accent)]" /> Skin</span>
              <span className="inline-flex items-center gap-1"><Shirt size={11} className="text-[var(--color-accent)]" /> Clothes</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-5 items-start">
        <div
          className="relative mx-auto w-full max-w-[220px] spray-body-figure-wrap"
          role="img"
          aria-label={`${bodyVariantLabel(bodyVariant)} showing full spray guide`}
        >
          <svg viewBox="0 0 240 520" className="w-full h-auto">
            <Figure />
            {catalog.map((zone) => {
              const meta = zoneById.get(zone.id);
              if (!meta) return null;
              const color = zoneColor(meta);
              const isOptional = meta.optional;
              const isFocused = focused === meta.sprayNumber;
              if (isOptional) {
                return (
                  <g key={zone.id}>
                    <circle
                      cx={zone.x}
                      cy={zone.y}
                      r={11}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                      opacity={0.6}
                    />
                    <text x={zone.x} y={zone.y + 3} textAnchor="middle" fill={color} fontSize="10" fontWeight="700" opacity={0.75}>
                      +
                    </text>
                  </g>
                );
              }
              return (
                <g key={zone.id}>
                  <motion.circle
                    cx={zone.x}
                    cy={zone.y}
                    r={isFocused ? 16 : 14}
                    fill={color}
                    fillOpacity={0.22}
                    stroke={color}
                    strokeWidth="1.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <text x={zone.x} y={zone.y + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">
                    {meta.sprayNumber}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-[10px] text-center text-[var(--color-text-tertiary)] mt-2">
            Solid = apply · dashed (+) = optional
          </p>
        </div>

        <div>{zoneList}</div>
      </div>

      {techniqueNote && (
        <p className="text-sm text-[var(--color-text-secondary)] mt-4 leading-relaxed text-center">{techniqueNote}</p>
      )}

      {applicationSteps && applicationSteps.length > 0 && (
        <div className="mt-4 rounded-2xl bg-[var(--color-bg-secondary)]/60 border border-[var(--color-border-subtle)] px-4 py-3.5">
          <p className="text-caption text-[var(--color-text-tertiary)] mb-2">Application steps</p>
          <ol className="space-y-1.5 list-none p-0 m-0">
            {applicationSteps.map((step) => (
              <li
                key={step}
                className={cn(
                  'text-sm text-[var(--color-text-secondary)] leading-relaxed',
                  step.startsWith('  ·') && 'pl-4 text-xs',
                  (step.startsWith('Step') || step.startsWith('Optional')) && 'font-semibold text-[var(--color-text-primary)] mt-2 first:mt-0',
                )}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
