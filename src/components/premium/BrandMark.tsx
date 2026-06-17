import { Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Refined in-app mark — glass + icon, not a solid blue blob */
export function BrandMark({ size = 'lg', className }: { size?: 'sm' | 'lg'; className?: string }) {
  const dim = size === 'sm' ? 48 : 72;
  const icon = size === 'sm' ? 22 : 30;

  return (
    <div
      className={cn('brand-mark', className)}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      <Droplets size={icon} strokeWidth={1.75} className="brand-mark-icon" />
    </div>
  );
}
