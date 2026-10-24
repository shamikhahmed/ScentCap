import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/premium/haptics';

export function PressableLink({ className, onClick, children, ...props }: LinkProps) {
  return (
    <Link
      {...props}
      // 3.0 primitives (ui-*) own their display; legacy callers still get block.
      className={cn('pressable pressable-link', !/\bui-/.test(String(className ?? '')) && 'block', className)}
      onClick={(e) => {
        hapticLight();
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}

export function PressableDiv({
  className,
  children,
  onClick,
  disabled,
  asButton,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  asButton?: boolean;
}) {
  return (
    <div
      role={asButton ? 'button' : undefined}
      tabIndex={asButton && !disabled ? 0 : undefined}
      className={cn('pressable', disabled && 'opacity-50 pointer-events-none', className)}
      onClick={disabled ? undefined : () => {
        hapticLight();
        onClick?.();
      }}
      onKeyDown={asButton ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled) onClick?.();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}
