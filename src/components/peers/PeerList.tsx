import { useState } from 'react';
import { cn } from '../../lib/utils';
import type { ApiPeer } from '../../lib/api';
import { pingPeer, peerHost, shortDid, timeAgo } from '../../lib/api';
import { MicroLabel } from '../ui/MicroLabel';
import { Skeleton } from '../ui/Skeleton';
import { Pill } from '../ui/Pill';
import { CopyButton } from '../ui/CopyButton';

type PingState =
  | { kind: 'idle' }
  | { kind: 'pinging' }
  | { kind: 'done'; ok: boolean; ms: number };

function PingCell({ did }: { did: string }) {
  const [state, setState] = useState<PingState>({ kind: 'idle' });

  const ping = async () => {
    setState({ kind: 'pinging' });
    const started = performance.now();
    try {
      const ok = await pingPeer(did);
      setState({ kind: 'done', ok, ms: Math.round(performance.now() - started) });
    } catch {
      setState({ kind: 'done', ok: false, ms: Math.round(performance.now() - started) });
    }
  };

  if (state.kind === 'done') {
    return (
      <button
        type="button"
        onClick={ping}
        title="ping again"
        className={cn(
          'text-[11px] tabular-nums cursor-pointer bg-transparent border-0 p-0 text-right',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm',
          state.ok ? 'text-ok' : 'text-destructive',
        )}
      >
        {state.ok ? `${state.ms}ms ✓` : 'no reply'}
      </button>
    );
  }
  return (
    <Pill onClick={ping} disabled={state.kind === 'pinging'} aria-label={`ping peer ${shortDid(did)}`}>
      {state.kind === 'pinging' ? 'pinging…' : 'ping'}
    </Pill>
  );
}

function PeerRow({ peer, index }: { peer: ApiPeer; index: number }) {
  return (
    <li
      className="grid grid-cols-[16px_minmax(0,1fr)_70px] md:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_120px_90px]
        items-center gap-x-3 md:gap-x-4 px-4 sm:px-6 py-3
        border-b border-border-inner last:border-b-0 hover:bg-hover transition-colors
        animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: `${index * 16}ms` }}
    >
      <span
        aria-hidden="true"
        className={cn('text-[8px] leading-none select-none', peer.reachable ? 'text-ok' : 'text-destructive')}
        title={peer.reachable ? 'reachable' : 'unreachable'}
      >
        ◆
      </span>

      {/* Identity */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[14px] font-bold text-foreground truncate" title={peer.did}>
          {shortDid(peer.did)}
        </span>
        <CopyButton value={peer.did} label="did" />
        <a
          href={peer.http_url}
          target="_blank"
          rel="noopener noreferrer"
          className="md:hidden text-[11px] text-dim truncate hover:text-foreground transition-colors"
        >
          {peerHost(peer.http_url)}
        </a>
      </div>

      {/* Host */}
      <a
        href={peer.http_url}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:block text-[12px] text-muted-foreground truncate hover:text-warm-text transition-colors"
        title={peer.http_url}
      >
        {peerHost(peer.http_url)} ↗
      </a>

      {/* Last seen */}
      <span className="hidden md:block text-[12px] text-dim tabular-nums whitespace-nowrap">
        {peer.last_seen ? timeAgo(peer.last_seen) : 'never'}
      </span>

      {/* Ping */}
      <span className="justify-self-end">
        <PingCell did={peer.did} />
      </span>
    </li>
  );
}

function PeerRowSkeleton() {
  return (
    <li className="grid grid-cols-[16px_minmax(0,1fr)_70px] md:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_120px_90px]
      items-center gap-x-3 md:gap-x-4 px-4 sm:px-6 py-3 border-b border-border-inner last:border-b-0">
      <span />
      <Skeleton className="h-4 w-40 max-w-full" />
      <Skeleton className="hidden md:block h-4 w-36" />
      <Skeleton className="hidden md:block h-4 w-16" />
      <Skeleton className="h-6 w-14 justify-self-end" />
    </li>
  );
}

interface PeerListProps {
  peers: ApiPeer[] | null;
  loading?: boolean;
  skeletonCount?: number;
}

export function PeerList({ peers, loading = false, skeletonCount = 10 }: PeerListProps) {
  return (
    <div className={cn(
      'border border-border transition-opacity duration-200',
      loading && peers !== null && 'opacity-40 pointer-events-none',
    )}>
      <div className="hidden md:grid grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_120px_90px] gap-x-4 px-6 h-10 items-center border-b border-border bg-surface">
        <span />
        <MicroLabel>peer</MicroLabel>
        <MicroLabel>endpoint</MicroLabel>
        <MicroLabel>last seen</MicroLabel>
        <MicroLabel className="text-right">check</MicroLabel>
      </div>

      {peers === null ? (
        <ul className="m-0 p-0 list-none" aria-busy="true" aria-label="loading peers">
          {Array.from({ length: skeletonCount }, (_, i) => <PeerRowSkeleton key={i} />)}
        </ul>
      ) : peers.length === 0 ? (
        <p className="m-0 py-20 text-center text-[13px] text-muted-foreground">no peers match</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {peers.map((peer, i) => <PeerRow key={peer.did} peer={peer} index={i} />)}
        </ul>
      )}
    </div>
  );
}
