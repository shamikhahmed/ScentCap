import { cn } from '@/lib/utils';

export function ShimmerText({
  children,
  className,
  as: Tag = 'p',
}: {
  children: string;
  className?: string;
  as?: 'p' | 'span' | 'h2';
}) {
  return (
    <Tag className={cn('shimmer-text text-sm font-medium', className)} aria-live="polite">
      {children}
    </Tag>
  );
}
