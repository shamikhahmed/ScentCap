import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function WardrobeCabinet({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn('wardrobe-cabinet', className)}>
      <div className="wardrobe-cabinet-frame">
        <div className="wardrobe-cabinet-header">
          <div className="wardrobe-cabinet-rail" aria-hidden />
          {label && <p className="wardrobe-cabinet-label">{label}</p>}
        </div>
        <div className="wardrobe-cabinet-interior">{children}</div>
        <div className="wardrobe-cabinet-base" aria-hidden />
      </div>
    </div>
  );
}

export function WardrobeShelf({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('wardrobe-shelf', className)}>
      <div className="wardrobe-shelf-grid">{children}</div>
      <div className="wardrobe-shelf-board" aria-hidden />
    </div>
  );
}
