import { cn } from '../../lib/utils';
import type { ApiAgent } from '../../lib/api';
import { MicroLabel } from '../ui/MicroLabel';
import { Skeleton } from '../ui/Skeleton';
import { AgentRow } from './AgentRow';

function AgentRowSkeleton() {
  return (
    <li className="grid grid-cols-[16px_minmax(0,1fr)] md:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_140px_110px]
      items-start gap-x-3 md:gap-x-4 px-4 sm:px-6 py-4 border-b border-border-inner last:border-b-0">
      <span />
      <div>
        <Skeleton className="h-4 w-40 max-w-full" />
        <div className="flex gap-1.5 mt-2.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <Skeleton className="hidden md:block h-4 w-24 mt-[2px]" />
      <Skeleton className="hidden md:block h-4 w-20 mt-[2px]" />
      <Skeleton className="hidden md:block h-4 w-16 mt-[2px] justify-self-end" />
    </li>
  );
}

interface AgentListProps {
  agents: ApiAgent[] | null;
  loading?: boolean;
  skeletonCount?: number;
}

export function AgentList({ agents, loading = false, skeletonCount = 10 }: AgentListProps) {
  return (
    <div className={cn(
      'border border-border transition-opacity duration-200',
      loading && agents !== null && 'opacity-40 pointer-events-none',
    )}>
      <div className="hidden md:grid grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_140px_110px] gap-x-4 px-6 h-10 items-center border-b border-border bg-surface">
        <span />
        <MicroLabel>agent</MicroLabel>
        <MicroLabel>trust</MicroLabel>
        <MicroLabel>last seen</MicroLabel>
        <MicroLabel className="text-right">registered</MicroLabel>
      </div>

      {agents === null ? (
        <ul className="m-0 p-0 list-none" aria-busy="true" aria-label="loading agents">
          {Array.from({ length: skeletonCount }, (_, i) => <AgentRowSkeleton key={i} />)}
        </ul>
      ) : agents.length === 0 ? (
        <p className="m-0 py-20 text-center text-[13px] text-muted-foreground">no agents match</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {agents.map((agent, i) => <AgentRow key={agent.did} agent={agent} index={i} />)}
        </ul>
      )}
    </div>
  );
}
