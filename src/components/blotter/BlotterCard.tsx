import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Size = 'sm' | 'md' | 'lg';

const sizeClass: Record<Size, string> = {
  sm: 'p-3 rounded-2xl',
  md: 'p-4 sm:p-5 rounded-[var(--sc-radius-card)]',
  lg: 'p-6 sm:p-8 rounded-[var(--sc-radius-sheet)]',
};

export function BlotterCard({
  children,
  className,
  size = 'md',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  size?: Size;
  as?: 'div' | 'section' | 'article';
}) {
  return (
    <Tag className={cn('sc-blotter relative z-[1]', sizeClass[size], className)}>
      {children}
    </Tag>
  );
}

export function SCPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('sc-panel p-4 sm:p-5', className)}>{children}</div>;
}

export function SCSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-3', className)}>
      {title ? (
        <h2 className="font-[family-name:var(--font-display)] text-[22px] leading-7 tracking-[-0.02em] text-[var(--sc-text)]">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
