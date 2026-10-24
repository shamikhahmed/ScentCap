import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { PressableLink } from '@/components/ui/PressableScale';
import { FragranceThumb } from '@/components/collection/FragranceThumb';
import { fragranceDisplayName } from '@/lib/fragranceName';
import { cn } from '@/lib/utils';
import type { Fragrance } from '@/types';

/** Large-title page header (HIG top-level screens). */
export function PageHeader({
  eyebrow,
  title,
  trailing,
  subtitle,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  trailing?: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <header className="ui-header">
      <div className="min-w-0">
        {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
        <h1 className="ui-largetitle">{title}</h1>
        {subtitle && <p className="ui-secondary mt-1 text-[var(--t-subhead)]">{subtitle}</p>}
      </div>
      {trailing && <div className="flex items-center gap-2 shrink-0 pb-1">{trailing}</div>}
    </header>
  );
}

export function Section({
  title,
  action,
  children,
  className,
  id,
}: {
  title?: ReactNode;
  action?: { label: string; to: string };
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn('ui-section', className)} aria-labelledby={id}>
      {(title || action) && (
        <div className="ui-section-head">
          {title && (
            <h2 className="ui-section-title" id={id}>
              {title}
            </h2>
          )}
          {action && (
            <PressableLink to={action.to} className="ui-section-link">
              {action.label}
              <ChevronRight size={16} aria-hidden />
            </PressableLink>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/** Product card: white plinth + brand + serif name. */
export function BottleCard({
  fragrance,
  to,
  meta,
  badge,
  photoUrl,
  className,
  onClick,
  selected,
}: {
  fragrance?: Fragrance | null;
  to?: string;
  meta?: ReactNode;
  badge?: ReactNode;
  photoUrl?: string | null;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  const body = (
    <>
      <div className="relative">
        <FragranceThumb fragrance={fragrance} variant="plinth" photoUrl={photoUrl} selected={selected} />
        {badge && <div className="absolute top-2 left-2">{badge}</div>}
      </div>
      <div className="min-w-0 px-0.5">
        <p className="ui-bottle__brand">{fragrance?.brand ?? ' '}</p>
        <p className="ui-bottle__name">{fragrance ? fragranceDisplayName(fragrance.name) : '…'}</p>
        {meta && <p className="ui-bottle__meta">{meta}</p>}
      </div>
    </>
  );
  if (to) {
    return (
      <PressableLink to={to} className={cn('ui-bottle', className)}>
        {body}
      </PressableLink>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn('ui-bottle text-left bg-transparent border-0 p-0 cursor-pointer', className)}
    >
      {body}
    </button>
  );
}

/** Bottom sheet (iPad/desktop: centered card). Grabber + Cancel/Done bar, Esc + backdrop close. */
export function Sheet({
  open,
  title,
  onClose,
  done,
  children,
  labelledBy = 'sheet-title',
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  done?: { label: string; onClick: () => void; disabled?: boolean };
  children: ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    // preventScroll: iOS Safari otherwise scrolls the page to the focused sheet (the "jump").
    ref.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    // iOS-safe scroll lock: overflow:hidden on body is ignored by iOS and can jump to top,
    // so pin the body in place and restore the exact scroll position on close.
    const y = window.scrollY;
    const body = document.body.style;
    const saved = { position: body.position, top: body.top, width: body.width, overflow: body.overflow };
    body.position = 'fixed';
    body.top = `-${y}px`;
    body.width = '100%';
    body.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      Object.assign(body, saved);
      window.scrollTo(0, y);
      prev?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="ui-sheet-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="ui-sheet ui-rise outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-sheet__grabber md:hidden" aria-hidden />
        <div className="ui-sheet__bar">
          <button type="button" className="ui-btn ui-btn--plain !min-h-[44px] !font-normal" onClick={onClose}>
            Cancel
          </button>
          <span className="ui-sheet__title" id={labelledBy}>
            {title}
          </span>
          {done ? (
            <button
              type="button"
              className="ui-btn ui-btn--plain !min-h-[44px]"
              onClick={done.onClick}
              disabled={done.disabled}
            >
              {done.label}
            </button>
          ) : (
            <span />
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Circular progress ring (match %, rotation). */
export function Ring({ value, size = 44, stroke = 5, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${Math.round(v)}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fill-2)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--tint)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 700ms var(--ease)' }}
      />
    </svg>
  );
}
