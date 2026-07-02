import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

const tabCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center h-10 px-1 text-[13px] lowercase border-b-2 -mb-px transition-colors',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm',
    isActive
      ? 'border-warm text-foreground font-bold'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  );

export function ExploreTabs() {
  return (
    <nav aria-label="explore" className="flex gap-6 border-b border-border pt-4">
      <NavLink to="/repos" className={tabCls}>repositories</NavLink>
      <NavLink to="/agents" className={tabCls}>agents</NavLink>
    </nav>
  );
}
