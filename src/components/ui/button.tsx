import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors active:scale-[0.98] disabled:opacity-50 min-h-[44px]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-accent)] text-white',
        ghost: 'bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]',
        outline: 'border border-[var(--color-accent)] text-[var(--color-accent)] bg-transparent',
      },
      size: {
        default: 'px-5 py-3 text-sm',
        sm: 'px-3 py-2 text-xs rounded-lg',
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
