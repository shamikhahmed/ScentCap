import { cn } from '@/lib/utils';

/** Capricorn OS mark — gold bottle from public/mark.svg */
export function BrandMark({ size = 'lg', className }: { size?: 'sm' | 'lg'; className?: string }) {
  const dim = size === 'sm' ? 48 : 72;
  const icon = size === 'sm' ? 28 : 40;

  return (
    <div
      className={cn('brand-mark', className)}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      <img
        src={`${import.meta.env.BASE_URL}mark.svg`}
        alt=""
        width={icon}
        height={icon}
        className="brand-mark-icon"
        draggable={false}
      />
    </div>
  );
}
