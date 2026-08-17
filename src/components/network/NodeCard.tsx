import { Circle, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { NodeSnapshot } from '../../lib/nodes';
import { truncateDid } from '../../lib/api';
import { CopyButton } from '../ui/CopyButton';
import { Skeleton } from '../ui/Skeleton';
import { MagicCard } from '../ui/magic-card';
import { NumberTicker } from '../ui/number-ticker';

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="px-2 py-2.5 text-center">
      <p className="m-0 text-[17px] font-semibold tabular leading-none text-foreground">
        {value === null ? '—' : <NumberTicker value={value} />}
      </p>
      <span className="mt-1.5 block text-[11px] text-muted">{label}</span>
    </div>
  );
}

export function NodeCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-3 w-40" />
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}

export function NodeCard({ snapshot }: { snapshot: NodeSnapshot }) {
  const { node, reachable, info, stats, peers, p2p } = snapshot;

  return (
    <MagicCard
      gradientSize={200}
      gradientColor="var(--color-foreground)"
      gradientOpacity={0.09}
      gradientFrom={reachable ? 'var(--color-success)' : 'var(--color-danger)'}
      gradientTo={reachable ? 'var(--color-foreground)' : 'var(--color-border)'}
      className={cn(
        'rounded-[10px] border border-border bg-surface h-full',
        !reachable && 'opacity-70',
      )}
    >
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="flex items-center gap-2 min-w-0">
            <Circle
              size={7}
              fill="currentColor"
              aria-hidden="true"
              className={cn('shrink-0', reachable ? 'text-success' : 'text-danger')}
            />
            <a
              href={node.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate text-[14px] font-semibold text-accent hover:underline"
            >
              {node.label}
              <ExternalLink size={11} className="shrink-0" />
            </a>
          </span>
          {info?.version && (
            <span className="shrink-0 text-[12px] text-muted">v{info.version}</span>
          )}
        </div>

        <div className="mt-3 flex flex-1 flex-col gap-2">
          {info?.did ? (
            <span className="flex items-center gap-2 min-w-0">
              <code className="truncate font-mono text-[12px] text-muted" title={info.did}>
                {truncateDid(info.did)}
              </code>
              <CopyButton value={info.did} label="DID" />
            </span>
          ) : (
            <span className="text-[12.5px] text-muted">
              {reachable ? 'Identity unavailable' : 'Node unreachable'}
            </span>
          )}

          {p2p?.enabled && (
            <span className="text-[12px] text-muted tabular">
              libp2p · {p2p.connected_peers ?? 0} connected · {peers?.length ?? 0} known
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 border-t border-separator pt-1">
          <Metric label="repos" value={stats ? stats.repos : null} />
          <Metric label="agents" value={stats ? stats.agents : null} />
          <Metric label="pushes" value={stats ? stats.pushes : null} />
        </div>
      </div>
    </MagicCard>
  );
}
