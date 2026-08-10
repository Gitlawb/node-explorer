import type { ReactNode, MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { Chip, Button } from '@heroui/react';
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

export function Pill({ children, onClick, to, active, disabled, className, ...rest }: PillProps) {
  const chip = (
    <Chip
      color={active ? 'accent' : 'default'}
      variant={active ? 'primary' : 'tertiary'}
      size="sm"
      className={cn(
        'uppercase tracking-[0.15em]',
        'data-[disabled=true]:opacity-30 data-[disabled=true]:cursor-not-allowed',
        onClick || to ? 'cursor-pointer' : '',
        className,
      )}
      data-disabled={disabled || undefined}
      {...rest}
    >
      {children}
    </Chip>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-[--radius]"
        onClick={onClick}
      >
        {chip}
      </Link>
    );
  }

  if (onClick) {
    return (
      <Button
        variant="tertiary"
        isDisabled={disabled}
        onPress={() => onClick(undefined as unknown as React.MouseEvent)}
        className="inline-flex h-auto min-h-0 p-0 rounded-[--radius]"
      >
        {chip}
      </Button>
    );
  }

  return chip;
}
