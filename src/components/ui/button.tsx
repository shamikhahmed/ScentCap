import { Link, type LinkProps } from 'react-router-dom';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/premium/haptics';
import { SPRING_PRESS } from '@/lib/premium/motion';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold transition-colors disabled:opacity-50 min-h-[48px] pressable tracking-tight',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-accent)] text-white shadow-sm',
        ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]',
        outline: 'border border-[var(--color-accent)] text-[var(--color-accent)] bg-transparent',
        glass: 'glass-premium-subtle text-[var(--color-text-primary)] border border-[var(--glass-border)]',
        destructive: 'bg-red-600 text-white',
      },
      size: {
        default: 'px-5 py-3 text-sm',
        sm: 'px-3.5 py-2 text-xs rounded-xl min-h-[40px]',
        lg: 'px-7 py-4 text-[0.95rem] min-h-[54px] rounded-[14px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type HapticFeedback = 'none' | 'light' | 'medium' | 'selection' | 'success' | 'error';

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> &
  VariantProps<typeof buttonVariants> & {
    haptic?: HapticFeedback;
    to?: LinkProps['to'];
    linkState?: LinkProps['state'];
    children?: React.ReactNode;
  };

export function Button({
  className,
  variant,
  size,
  haptic = 'light',
  onClick,
  to,
  linkState,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!disabled && haptic !== 'none') {
      triggerHaptic(haptic);
    }
    onClick?.(e as React.MouseEvent<HTMLButtonElement>);
  };

  if (to) {
    return (
      <Link
        to={to}
        state={linkState}
        className={cn(classes, disabled && 'pointer-events-none opacity-50')}
        onClick={handleClick}
        aria-disabled={disabled || undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={SPRING_PRESS}
      className={classes}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
