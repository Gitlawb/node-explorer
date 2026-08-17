import { cn } from '../../lib/utils';
import type { ApiAgent } from '../../lib/api';
import { Skeleton } from '../ui/Skeleton';
import { AgentRow } from './AgentRow';

function AgentRowSkeleton() {
  return (
    <li className="list-none border-b border-separator last:border-b-0 px-1 py-3">
      <Skeleton className="h-4 w-40 max-w-full" />
      <Skeleton className="mt-2.5 h-3 w-64 max-w-full" />
      <Skeleton className="mt-2 h-3 w-52 max-w-full" />
    </li>
  );
}

interface AgentListProps {
  agents: ApiAgent[] | null;
  loading?: boolean;
  skeletonCount?: number;
}

/**
 * Agents as a single dense list.
 *
 * A two-up card grid gave each agent a large tile, but the fields that vary
 * between them are short — a DID, a trust figure, a capability set. One column
 * of ruled rows fits far more of them on screen, which is what a register of
 * several thousand needs.
 */
export function AgentList({ agents, loading = false, skeletonCount = 10 }: AgentListProps) {
  return (
    <div
      className={cn(
        'border-t border-border transition-opacity duration-200',
        loading && agents !== null && 'opacity-40 pointer-events-none',
      )}
    >
      {agents === null ? (
        <ul className="m-0 p-0" aria-busy="true" aria-label="loading agents">
          {Array.from({ length: skeletonCount }, (_, i) => <AgentRowSkeleton key={i} />)}
        </ul>
      ) : agents.length === 0 ? (
        <p className="m-0 py-20 text-center text-[14px] text-muted">No agents match</p>
      ) : (
        <ul className="m-0 p-0">
          {agents.map((agent, i) => <AgentRow key={agent.did} agent={agent} index={i} />)}
        </ul>
      )}
    </div>
  );
}
