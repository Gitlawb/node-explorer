import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { ApiRefUpdate } from '../../lib/api';
import { parseEventRepo, shortRefName, shortSha, shortDid, timeAgo, isGossip } from '../../lib/api';
import { MicroLabel } from '../ui/MicroLabel';
import { Skeleton } from '../ui/Skeleton';

function RefUpdateRow({ event, index }: { event: ApiRefUpdate; index: number }) {
  const repoRef = parseEventRepo(event.repo);
  const gossip = isGossip(event);
  const created = event.old_sha?.startsWith('0000000');

  return (
    <li
      className="grid grid-cols-[16px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_150px_120px_90px]
        items-baseline gap-x-3 md:gap-x-4 px-4 sm:px-6 py-3
        border-b border-border-inner last:border-b-0 hover:bg-hover transition-colors
        animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: `${index * 16}ms` }}
    >
      <span
        aria-hidden="true"
        className={cn('text-[8px] leading-none select-none self-start pt-[5px]', gossip ? 'text-warm' : 'text-status-dot')}
        title={gossip ? 'received via gossip' : 'local push'}
      >
        ◆
      </span>

      {/* repo / ref */}
      <span className="min-w-0 truncate text-[13px]">
        {repoRef ? (
          <Link
            to={`/repos/${encodeURIComponent(repoRef.ownerDid)}/${encodeURIComponent(repoRef.name)}`}
            className="font-bold text-foreground hover:text-warm-text transition-colors"
          >
            {repoRef.label}
          </Link>
        ) : (
          <span className="font-bold text-foreground">{event.repo}</span>
        )}
        <span className="text-dim"> · {shortRefName(event.ref_name)}</span>
      </span>

      {/* sha transition */}
      <span className="hidden md:block text-[12px] text-muted-foreground tabular-nums whitespace-nowrap">
        {created ? (
          <>new · {shortSha(event.new_sha)}</>
        ) : (
          <>{shortSha(event.old_sha)} → {shortSha(event.new_sha)}</>
        )}
      </span>

      {/* pusher */}
      <span className="hidden md:block text-[12px] text-dim truncate" title={event.pusher_did}>
        {shortDid(event.pusher_did)}
      </span>

      {/* time */}
      <span className="text-[11px] text-dim tabular-nums text-right whitespace-nowrap">
        {timeAgo(event.timestamp)}
      </span>
    </li>
  );
}

function RefUpdateRowSkeleton() {
  return (
    <li className="grid grid-cols-[16px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_150px_120px_90px]
      items-center gap-x-3 md:gap-x-4 px-4 sm:px-6 py-3 border-b border-border-inner last:border-b-0">
      <span />
      <Skeleton className="h-4 w-52 max-w-full" />
      <Skeleton className="hidden md:block h-4 w-28" />
      <Skeleton className="hidden md:block h-4 w-20" />
      <Skeleton className="h-3 w-14 justify-self-end" />
    </li>
  );
}

interface RefUpdateListProps {
  events: ApiRefUpdate[] | null;
  loading?: boolean;
  skeletonCount?: number;
  /** Hide the md+ header strip (compact embeds, e.g. the dashboard). */
  header?: boolean;
  emptyMessage?: string;
}

export function RefUpdateList({
  events,
  loading = false,
  skeletonCount = 10,
  header = true,
  emptyMessage = 'no ref updates yet — push a repo to this node to see activity',
}: RefUpdateListProps) {
  return (
    <div className={cn(
      'transition-opacity duration-200',
      loading && events !== null && 'opacity-40 pointer-events-none',
    )}>
      {header && (
        <div className="hidden md:grid grid-cols-[24px_minmax(0,1fr)_150px_120px_90px] gap-x-4 px-6 h-10 items-center border-b border-border bg-surface">
          <span />
          <MicroLabel>repo · ref</MicroLabel>
          <MicroLabel>commit</MicroLabel>
          <MicroLabel>pusher</MicroLabel>
          <MicroLabel className="text-right">when</MicroLabel>
        </div>
      )}

      {events === null ? (
        <ul className="m-0 p-0 list-none" aria-busy="true" aria-label="loading events">
          {Array.from({ length: skeletonCount }, (_, i) => <RefUpdateRowSkeleton key={i} />)}
        </ul>
      ) : events.length === 0 ? (
        <p className="m-0 py-16 text-center text-[13px] text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {events.map((event, i) => <RefUpdateRow key={event.id} event={event} index={i} />)}
        </ul>
      )}
    </div>
  );
}
