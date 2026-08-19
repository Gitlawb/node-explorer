import { Drawer } from 'vaul';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check } from 'lucide-react';
import type { NodeInfo, NodeStats } from '../../lib/api';
import { cn } from '../../lib/utils';

/**
 * The navigation drawer on phones.
 *
 * This replaced a panel that animated its height open beneath the header. That
 * worked, but it read as part of the page rather than as a layer over it: it
 * pushed the content down, it could not be dismissed by dragging or by tapping
 * away, and it left the page behind it fully lit.
 *
 * Vaul is a drawer built on Radix Dialog, so the behaviour a menu needs comes
 * with it — focus is trapped while open and restored on close, Escape closes,
 * the page behind is inert and does not scroll, and the sheet can be thrown
 * shut with a flick. It opens from the bottom, which is where a thumb already
 * is on a tall phone; the top of a 812px screen is the hardest place to reach.
 */
interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: readonly { to: string; label: string; end?: boolean }[];
  isActive: (to: string, end?: boolean) => boolean;
  node: NodeInfo | null;
  stats: NodeStats | null;
}

/** Machine-readable copies, the thing that makes this explorer unusual. */
const TEXT_SURFACES = [
  { href: '/llms.txt', label: 'llms.txt' },
  { href: '/skill.md', label: 'skill.md' },
];

export function MobileNavDrawer({
  open,
  onOpenChange,
  links,
  isActive,
  node,
  stats,
}: MobileNavDrawerProps) {
  // autoFocus moves focus into the sheet on open. Vaul leaves it off by
  // default, which left focus on <body>: a keyboard or screen-reader user
  // opened the menu and was still outside it, with the next Tab starting from
  // the top of the document behind the overlay.
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} autoFocus>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-[2px]" />
        <Drawer.Content
          aria-label="Navigation"
          className={cn(
            'fixed inset-x-0 bottom-0 z-[70] mt-24 flex max-h-[88vh] flex-col',
            'rounded-t-[var(--radius)] border-t border-border bg-background',
            'outline-none',
          )}
        >
          {/* The grabber is the affordance for the drag Vaul provides; without
              it the sheet gives no sign it can be thrown shut. */}
          <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border" />

          <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <Drawer.Title className="m-0 px-1 text-[11.5px] text-muted">
              {node?.name ?? 'gitlawb'}
              {node?.network && <span className="ml-1.5">· {node.network}</span>}
            </Drawer.Title>

            <nav aria-label="Sections" className="mt-2">
              <ul className="m-0 list-none p-0">
                {links.map(({ to, label, end }) => {
                  const active = isActive(to, end);
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex h-12 items-center justify-between rounded-[var(--radius-sm)] px-3',
                          'text-[15px] capitalize transition-colors',
                          active
                            ? 'bg-surface-secondary font-medium text-foreground'
                            : 'text-muted active:bg-surface-secondary',
                        )}
                      >
                        {label}
                        {active && <Check size={15} aria-hidden="true" className="text-foreground" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {stats && (
              <p className="m-0 mt-4 border-t border-separator px-3 pt-3 text-[12.5px] tabular text-muted">
                {stats.repos.toLocaleString()} repos
                <span className="px-1.5 text-subtle">·</span>
                {stats.agents.toLocaleString()} agents
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-3">
              {TEXT_SURFACES.map(surface => (
                <a
                  key={surface.href}
                  href={surface.href}
                  className="inline-flex h-9 items-center gap-1 font-mono text-[12.5px] text-muted"
                >
                  {surface.label}
                  <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
