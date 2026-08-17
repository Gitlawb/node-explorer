import { Link, useLocation } from 'react-router-dom';
import {
  Chip,
  Drawer,
  DrawerTrigger,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerBody,
  DrawerCloseTrigger,
  useOverlayState,
} from '@heroui/react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ThemeCustomizer } from '../ui/ThemeCustomizer';
import { Logo } from '../ui/Logo';
import { useNodeStatus } from '../../hooks/useNodeStatus';
import { cn } from '../../lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'overview', end: true },
  { to: '/repos', label: 'repos' },
  { to: '/network', label: 'network' },
  { to: '/peers', label: 'peers' },
  { to: '/events', label: 'events' },
  { to: '/tasks', label: 'tasks' },
  { to: '/agents', label: 'agents' },
  { to: '/docs', label: 'docs' },
];

export default function TopBar() {
  const { node, stats } = useNodeStatus();
  const location = useLocation();
  const drawer = useOverlayState();

  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to + '/') || location.pathname === to;

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-separator bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-1 sm:gap-3 px-4 sm:px-8 lg:px-12">
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 mr-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <Logo className="h-5 w-auto shrink-0 text-foreground" />
          <span className="hidden sm:inline text-[13px] font-bold text-foreground">explorer</span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 sm:gap-1">
          {NAV_LINKS.map(({ to, label, end }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'px-2 sm:px-3 py-1.5 text-[12px] sm:text-[13px] rounded-[--radius] transition-colors whitespace-nowrap',
                isActive(to, end)
                  ? 'text-foreground font-semibold bg-surface-secondary'
                  : 'text-muted hover:text-foreground hover:bg-surface-secondary',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2 shrink-0">
          <Drawer state={drawer}>
            <DrawerTrigger
              aria-label="navigation menu"
              className="md:hidden h-9 w-9 inline-flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="3" y1="4" x2="13" y2="4" />
                <line x1="3" y1="8" x2="13" y2="8" />
                <line x1="3" y1="12" x2="13" y2="12" />
              </svg>
            </DrawerTrigger>
            <DrawerBackdrop />
            <DrawerContent placement="right" className="w-[280px] rounded-l-[--radius]">
              <DrawerDialog>
                <DrawerHeader>
                  <div className="flex items-center justify-between px-1">
                    <Logo className="h-5 w-auto text-foreground" />
                    <DrawerCloseTrigger
                      aria-label="close menu"
                      onPress={() => drawer.close()}
                      className="h-9 w-9 inline-flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="4" y1="4" x2="12" y2="12" />
                        <line x1="12" y1="4" x2="4" y2="12" />
                      </svg>
                    </DrawerCloseTrigger>
                  </div>
                </DrawerHeader>
                <DrawerBody className="flex flex-col gap-1 pt-2">
                  {NAV_LINKS.map(({ to, label, end }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => drawer.close()}
                      className={cn(
                        'block px-3 py-2.5 text-[13px] rounded-[--radius] transition-colors',
                        isActive(to, end)
                          ? 'text-foreground font-semibold bg-surface-secondary'
                          : 'text-muted hover:text-foreground hover:bg-surface-secondary',
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                  <div className="mt-4 pt-4 border-t border-separator space-y-3">
                    {node?.network && (
                      <Chip size="sm" variant="tertiary" className="uppercase tracking-[0.15em] text-[10px]">
                        {node.network}
                      </Chip>
                    )}
                    {stats && (
                      <p className="m-0 text-[11px] tabular-nums text-muted">
                        {stats.repos.toLocaleString()} repos · {stats.agents.toLocaleString()} agents
                      </p>
                    )}
                  </div>
                </DrawerBody>
              </DrawerDialog>
            </DrawerContent>
          </Drawer>

          {node?.network && (
            <Chip size="sm" variant="tertiary" className="max-md:hidden uppercase tracking-[0.15em] text-[10px]">
              {node.network}
            </Chip>
          )}
          {stats && (
            <span className="hidden lg:inline text-[11px] tabular-nums text-muted whitespace-nowrap">
              {stats.repos.toLocaleString()} repos · {stats.agents.toLocaleString()} agents
            </span>
          )}
          <ThemeCustomizer />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
