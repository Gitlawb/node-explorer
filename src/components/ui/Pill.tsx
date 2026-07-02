import type { ReactNode, MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface PillProps {
  children: ReactNode;
  onClick?: MouseEventHandler;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'data-row-link'?: string;
}

const baseCls =
  'inline-flex items-center gap-1.5 h-7 px-2.5 text-[10px] font-medium uppercase tracking-[0.15em] ' +
  'border rounded-[2px] select-none transition-colors duration-150 whitespace-nowrap ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm';

const restCls = 'border-border text-muted-foreground';
const interactiveCls = 'cursor-pointer hover:border-dim hover:text-foreground';
const activeCls = 'border-warm/60 text-warm';

/**
 * Terminal-style pill: [MAIN] [PUBLIC] [CLONE].
 * Renders a <button> when onClick is set, a <Link> when `to` is set,
 * otherwise an inert <span>.
 */
export function Pill({ children, onClick, to, active, disabled, className, ...rest }: PillProps) {
  const cls = cn(baseCls, active ? activeCls : restCls, (onClick || to) && !disabled && interactiveCls, className);

  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(cls, 'disabled:opacity-30 disabled:cursor-not-allowed')}
        {...rest}
      >
        {children}
      </button>
    );
  }
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}
