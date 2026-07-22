import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

const tabCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center h-10 px-1 text-[13px] lowercase border-b-2 -mb-px transition-colors shrink-0',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm',
    isActive
      ? 'border-warm text-foreground font-bold'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  );

const SECTIONS = [
  { to: '/', label: 'overview', end: true },
  { to: '/repos', label: 'repositories' },
  { to: '/agents', label: 'agents' },
  { to: '/peers', label: 'peers' },
  { to: '/events', label: 'events' },
  { to: '/tasks', label: 'tasks' },
  { to: '/network', label: 'network' },
  { to: '/docs', label: 'docs' },
] as const;

export function ExploreTabs() {
  return (
    <nav
      aria-label="explore"
      className="flex gap-5 sm:gap-6 border-b border-border pt-4 overflow-x-auto scrollbar-none"
    >
      {SECTIONS.map(s => (
        <NavLink key={s.to} to={s.to} end={'end' in s && s.end} className={tabCls}>
          {s.label}
        </NavLink>
      ))}
    </nav>
  );
}
