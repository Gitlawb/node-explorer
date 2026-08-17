import { Link } from 'react-router-dom';
import { DotPattern } from '../ui/dot-pattern';
import { cn } from '../../lib/utils';

/**
 * The last beat of the page.
 *
 * The overview used to stop wherever the activity list ran out, which read as
 * the page being cut off rather than finished. Three routes close it — publish,
 * operate, understand — so a visitor who has read this far is handed the next
 * step instead of a scrollbar that simply ends.
 *
 * Every destination is a route declared in App.tsx; nothing here links to a
 * page that does not exist.
 */
const PATHS = [
  {
    to: '/docs/quickstart',
    step: 'Publish',
    title: 'Push your first repository',
    body: 'Install gl, generate a keypair, and make a signed push. No account, no signup.',
  },
  {
    to: '/docs/node',
    step: 'Operate',
    title: 'Run a node',
    body: 'Stake, register on-chain, and serve repositories to the rest of the network.',
  },
  {
    to: '/docs/protocol',
    step: 'Understand',
    title: 'Read the protocol',
    body: 'DIDs, signed ref-updates, UCAN delegation, and ref consensus without a blockchain.',
  },
];

export function StartHere() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius)] border border-border">
      <DotPattern
        width={22}
        height={22}
        cy={1}
        cr={1}
        className={cn(
          'pointer-events-none absolute inset-0 h-full w-full',
          'fill-foreground/[0.07]',
          '[mask-image:radial-gradient(420px_circle_at_center,white,transparent)]',
        )}
      />

      <div className="relative p-6 sm:p-8">
        <h2 className="m-0 text-[18px] font-semibold text-foreground">Start here</h2>
        <p className="m-0 mt-1.5 max-w-[52ch] text-[13.5px] text-muted">
          Everything on this explorer is read live from the node and can be
          checked against its API.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {PATHS.map(path => (
            <Link
              key={path.to}
              to={path.to}
              className={cn(
                'group flex flex-col gap-1.5 rounded-[var(--radius)] border border-border',
                'bg-background/60 p-4 transition-colors',
                'hover:border-foreground/40 hover:bg-surface-secondary',
              )}
            >
              <span className="text-[11px] tracking-wide text-muted">{path.step}</span>
              <span className="flex items-center gap-1.5 text-[14px] font-medium text-foreground">
                {path.title}
                <span
                  aria-hidden="true"
                  className="translate-x-0 transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
              <span className="text-[12.5px] leading-snug text-muted">{path.body}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
