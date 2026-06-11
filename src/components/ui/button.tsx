import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 min-h-[44px]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-accent)] text-stone-950 shadow-lg shadow-amber-900/20',
        ghost: 'bg-white/5 border border-white/10 text-stone-100',
        outline: 'border border-[var(--color-accent)]/40 text-[var(--color-accent)]',
      },
      size: {
        default: 'px-5 py-3 text-sm',
        sm: 'px-3 py-2 text-xs rounded-xl',
        lg: 'px-8 py-4 text-base',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
