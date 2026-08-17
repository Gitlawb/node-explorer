import { GitBranch, Radio, Server } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { ApiRefUpdate } from '../../lib/api';
import { parseEventRepo, shortRefName, shortSha, shortDid, timeAgo, isGossip } from '../../lib/api';
import { Skeleton } from '../ui/Skeleton';
import { AnimatedList } from '../ui/animated-list';
import { MagicCard } from '../ui/magic-card';

/**
 * A ref-update, as a feed card.
 *
 * The gossip feed is genuinely live — the page re-polls and new updates arrive
 * while you watch — so it is built on Magic UI's AnimatedList, which is made
 * for exactly that: items enter from the top and push the rest down, rather
 * than the list silently re-rendering underneath the reader.
 */
function RefUpdateCard({ event }: { event: ApiRefUpdate }) {
  const repoRef = parseEventRepo(event.repo);
  const gossip = isGossip(event);
  const created = event.old_sha?.startsWith('0000000');

  return (
    <MagicCard
      gradientSize={220}
      gradientColor="var(--color-foreground)"
      gradientOpacity={0.09}
      gradientFrom="var(--color-foreground)"
      gradientTo="var(--color-muted)"
      className="w-full rounded-[10px] border border-border bg-surface"
    >
      <div className="flex items-start gap-3 p-3.5">
        <span
          className={cn(
            'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border',
            gossip
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-success/40 bg-success/10 text-success',
          )}
          title={gossip ? 'Received via gossip from a peer' : 'Received directly by this node'}
        >
          {gossip ? <Radio size={13} /> : <Server size={13} />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[14px]">
              {repoRef ? (
                <Link
                  to={`/repos/${encodeURIComponent(repoRef.ownerDid)}/${encodeURIComponent(repoRef.name)}`}
                  className="font-semibold text-accent hover:underline"
                >
                  {repoRef.label}
                </Link>
              ) : (
                <span className="font-semibold text-foreground">{event.repo}</span>
              )}
            </span>
            <span className="shrink-0 text-[12px] text-muted tabular">
              {timeAgo(event.timestamp)}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <GitBranch size={12} />
              <span className="font-mono">{shortRefName(event.ref_name)}</span>
            </span>
            <span className="font-mono tabular">
              {created ? (
                <span className="text-accent">{shortSha(event.new_sha)}</span>
              ) : (
                <>
                  {shortSha(event.old_sha)}
                  <span className="px-1.5 text-subtle">&rarr;</span>
                  <span className="text-accent">{shortSha(event.new_sha)}</span>
                </>
              )}
            </span>
            <span className="truncate font-mono" title={event.pusher_did}>
              {shortDid(event.pusher_did)}
            </span>
          </div>
        </div>
      </div>
    </MagicCard>
  );
}

function RefUpdateCardSkeleton() {
  return (
    <div className="w-full rounded-[10px] border border-border bg-surface p-3.5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-7 shrink-0 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-52 max-w-full" />
          <Skeleton className="mt-2 h-3 w-40" />
        </div>
      </div>
    </div>
  );
}

interface RefUpdateListProps {
  events: ApiRefUpdate[] | null;
  loading?: boolean;
  skeletonCount?: number;
  header?: boolean;
  emptyMessage?: string;
}

export function RefUpdateList({
  events,
  loading = false,
  skeletonCount = 8,
  // The global feed carries peer gossip only; local pushes surface on the repo
  // page, not here — don't promise otherwise.
  emptyMessage = 'No gossip from peer nodes yet',
}: RefUpdateListProps) {
  return (
    <div
      className={cn(
        'transition-opacity duration-200',
        loading && events !== null && 'opacity-40 pointer-events-none',
      )}
    >
      {events === null ? (
        <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="loading events">
          {Array.from({ length: skeletonCount }, (_, i) => <RefUpdateCardSkeleton key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <p className="m-0 py-16 text-center text-[14px] text-muted">{emptyMessage}</p>
      ) : (
        <AnimatedList delay={220} className="gap-2.5">
          {events.map(event => <RefUpdateCard key={event.id} event={event} />)}
        </AnimatedList>
      )}
    </div>
  );
}
