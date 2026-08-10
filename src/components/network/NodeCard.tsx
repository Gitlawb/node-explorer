import { Circle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { NodeSnapshot } from '../../lib/nodes';
import { truncateDid } from '../../lib/api';
import { MicroLabel } from '../ui/MicroLabel';
import { CopyButton } from '../ui/CopyButton';
import { Skeleton } from '../ui/Skeleton';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 text-center">
      <p className="m-0 text-[16px] font-bold tabular-nums leading-none text-foreground">{value}</p>
      <MicroLabel className="block mt-1.5 !text-[9px]">{label}</MicroLabel>
    </div>
  );
}

export function NodeCardSkeleton() {
  return (
    <div className="border border-border">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-border bg-surface">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="px-4 py-4 flex flex-col gap-2.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function NodeCard({ snapshot }: { snapshot: NodeSnapshot }) {
  const { node, reachable, info, stats, peers, p2p } = snapshot;

  return (
    <div className={cn('border border-border flex flex-col', !reachable && 'opacity-60')}>
      <div className="flex items-center justify-between gap-2 px-4 h-10 border-b border-border bg-surface min-w-0">
        <span className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className={cn('text-[8px] shrink-0', reachable ? 'text-success' : 'text-danger')}
            title={reachable ? 'online' : 'offline'}
          >
            <Circle size={7} fill="currentColor" />
          </span>
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-bold text-foreground truncate hover:text-accent transition-colors"
          >
            {node.label} ↗
          </a>
        </span>
        {info?.version && <span className="text-[10px] text-muted shrink-0">v{info.version}</span>}
      </div>

      <div className="px-4 py-3 flex flex-col gap-2 flex-1">
        {info?.did ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-muted truncate" title={info.did}>
              {truncateDid(info.did)}
            </span>
            <CopyButton value={info.did} label="did" />
          </span>
        ) : (
          <span className="text-[11px] text-muted">{reachable ? 'identity unavailable' : 'node unreachable'}</span>
        )}

        {p2p?.enabled && (
          <span className="text-[10px] text-muted tabular-nums">
            libp2p · {p2p.connected_peers ?? 0} connected · {peers?.length ?? 0} known peers
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 border-t border-separator">
        <Metric label="repos" value={stats ? stats.repos.toLocaleString() : '—'} />
        <div className="border-l border-separator">
          <Metric label="agents" value={stats ? stats.agents.toLocaleString() : '—'} />
        </div>
        <div className="border-l border-separator">
          <Metric label="pushes" value={stats ? stats.pushes.toLocaleString() : '—'} />
        </div>
      </div>
    </div>
  );
}
