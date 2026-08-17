import { useRef } from 'react';
import { Server, Radio } from 'lucide-react';
import type { NodeSnapshot } from '../../lib/nodes';
import { AnimatedBeam } from '../ui/animated-beam';
import { cn } from '../../lib/utils';

/**
 * The federation, drawn as the gossip graph it is.
 *
 * The first node in the list is the one this explorer is pointed at; the rest
 * are its federated peers. A beam runs from the origin to each peer that is
 * actually reachable — an unreachable node gets a dead line, because animating
 * gossip into a node that is not answering would be a decorative lie about the
 * one thing this page exists to report.
 */
/** Hoisted: defining this inside FederationMap would remount every node on
 *  each render and trips react-hooks' create-components-during-render rule. */
function NodeChip({
  snap,
  innerRef,
  lead = false,
}: {
  snap: NodeSnapshot;
  innerRef: React.RefObject<HTMLDivElement | null>;
  lead?: boolean;
}) {
  return (
    <div
      ref={innerRef}
      className={cn(
        'z-10 flex items-center gap-2 rounded-full border bg-surface px-3 py-2',
        snap.reachable ? 'border-border' : 'border-danger/40 opacity-60',
        lead && 'border-accent/50',
      )}
      title={`${snap.node.label} — ${snap.reachable ? 'reachable' : 'unreachable'}`}
    >
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full',
          lead
            ? 'bg-accent/15 text-accent'
            : snap.reachable
              ? 'bg-success/15 text-success'
              : 'bg-danger/15 text-danger',
        )}
      >
        {lead ? <Server size={13} /> : <Radio size={13} />}
      </span>
      <span className="text-[12.5px] font-medium text-foreground whitespace-nowrap">
        {snap.node.label}
      </span>
      {snap.stats && (
        <span className="text-[11px] text-muted tabular whitespace-nowrap">
          {snap.stats.repos.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export function FederationMap({ snapshots }: { snapshots: NodeSnapshot[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const peerRef0 = useRef<HTMLDivElement>(null);
  const peerRef1 = useRef<HTMLDivElement>(null);
  const peerRef2 = useRef<HTMLDivElement>(null);
  const peerRef3 = useRef<HTMLDivElement>(null);
  const peerRefs = [peerRef0, peerRef1, peerRef2, peerRef3];

  if (snapshots.length < 2) return null;
  const [origin, ...peers] = snapshots;
  const shown = peers.slice(0, 4);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[240px] w-full items-center justify-between gap-8 px-2 py-8 sm:px-8"
    >
      <NodeChip snap={origin} innerRef={originRef} lead />

      <div className="flex flex-col gap-4">
        {shown.map((s, i) => (
          <NodeChip key={s.node.id} snap={s} innerRef={peerRefs[i]} />
        ))}
      </div>

      {shown.map((s, i) => (
        <AnimatedBeam
          key={s.node.id}
          containerRef={containerRef}
          fromRef={originRef}
          toRef={peerRefs[i]}
          curvature={(i - (shown.length - 1) / 2) * 26}
          duration={4.5}
          delay={i * 0.8}
          pathColor="var(--color-border)"
          pathOpacity={s.reachable ? 0.5 : 0.15}
          gradientStartColor={s.reachable ? 'var(--color-foreground)' : 'transparent'}
          gradientStopColor={s.reachable ? 'var(--color-success)' : 'transparent'}
        />
      ))}
    </div>
  );
}
