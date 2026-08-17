import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function MicroLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('text-[10px] font-medium tracking-[0.2em] uppercase text-muted', className)}>{children}</span>;
}
