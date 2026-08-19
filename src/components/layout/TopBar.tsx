import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Menu, X, Search } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Logo } from '../ui/Logo';
import { useNodeStatus } from '../../hooks/useNodeStatus';
import { useShortcuts } from '../../hooks/useShortcuts';
import { cn } from '../../lib/utils';
import { modifierKeyLabel } from '../../lib/platform';

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
  const { setOpenModal } = useShortcuts();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const paletteHint = `${modifierKeyLabel()} K`;

  // Close on route change during render — an effect here trips
  // react-hooks/set-state-in-effect and lands a frame late.
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to + '/') || location.pathname === to;

  const activeHref = NAV_LINKS.find(l => isActive(l.to, l.end))?.to;
  // The rail follows the pointer while hovering and returns to the current
  // route on leave, so it always reports where a click would take you.
  const railOn = hovered ?? activeHref;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2 sm:gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <Logo className="h-[18px] w-auto shrink-0 text-foreground" />
          <span className="hidden sm:inline text-[15px] font-semibold tracking-tight text-foreground">
            gitlawb
          </span>
        </Link>

        {/* One indicator shared across every item: Motion animates it between
            positions via layoutId rather than cross-fading eight separate
            underlines. */}
        <nav
          className="hidden md:flex items-center"
          onMouseLeave={() => setHovered(null)}
        >
          {NAV_LINKS.map(({ to, label, end }) => {
            const active = isActive(to, end);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                onMouseEnter={() => setHovered(to)}
                className={cn(
                  'relative px-3 py-2 text-[13.5px] transition-colors whitespace-nowrap',
                  active ? 'text-foreground' : 'text-muted hover:text-foreground',
                )}
              >
                {railOn === to && (
                  <motion.span
                    layoutId="nav-rail"
                    aria-hidden="true"
                    className="absolute inset-x-1 -bottom-px h-px bg-foreground"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 480, damping: 38, mass: 0.6 }
                    }
                  />
                )}
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {stats && (
            <span className="hidden xl:inline text-[12.5px] tabular text-muted whitespace-nowrap">
              {stats.repos.toLocaleString()} repos
              <span className="px-1.5 text-subtle">·</span>
              {stats.agents.toLocaleString()} agents
            </span>
          )}
          {node?.network && (
            <span className="max-md:hidden text-[12px] text-muted">{node.network}</span>
          )}

          {/* Icon only. The shortcut lives in the tooltip and the accessible
              name rather than as a floating glyph beside the icon — and it
              names the modifier this keyboard actually has. */}
          <button
            type="button"
            onClick={() => setOpenModal('palette')}
            title={`Search — ${paletteHint}`}
            aria-label={`Open command palette (${paletteHint})`}
            aria-keyshortcuts="Meta+K Control+K"
            className="inline-flex h-8 w-8 items-center justify-center
              text-muted transition-colors hover:text-foreground"
          >
            <Search size={17} />
          </button>

          <ThemeToggle />

          <button
            type="button"
            aria-label="Navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden inline-flex h-8 w-8 items-center justify-center text-muted hover:text-foreground"
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            key="mobile-nav"
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduce ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-b border-border bg-background"
          >
            <ul className="m-0 list-none px-4 sm:px-6 py-1">
              {NAV_LINKS.map(({ to, label, end }) => (
                <li key={to}>
                  <Link
                    to={to}
                    aria-current={isActive(to, end) ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between py-2.5 border-b border-separator',
                      'text-[14px] transition-colors',
                      isActive(to, end) ? 'text-foreground' : 'text-muted',
                    )}
                  >
                    {label}
                    {isActive(to, end) && (
                      <span className="h-px w-5 bg-foreground" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {stats && (
              <p className="m-0 px-4 sm:px-6 py-3 text-[12.5px] tabular text-muted">
                {stats.repos.toLocaleString()} repos · {stats.agents.toLocaleString()} agents
              </p>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
