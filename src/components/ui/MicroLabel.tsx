import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function MicroLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('micro-label', className)}>{children}</span>;
}
