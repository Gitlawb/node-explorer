import { Server } from 'lucide-react';
import type { ApiPeer } from '../../lib/api';
import { shortDid, peerHost } from '../../lib/api';
import { OrbitingCircles } from '../ui/orbiting-circles';
import { cn } from '../../lib/utils';

/**
 * The federation, drawn as what it is: this node at the centre with its
 * reachable peers circling it.
 *
 * Magic UI's OrbitingCircles carries the motion. Only reachable peers orbit —
 * an unreachable node is not participating, and showing it circling would be a
 * decorative lie. Two rings so a node with many peers stays legible.
 */
export function PeerOrbit({ peers, nodeName }: { peers: ApiPeer[]; nodeName?: string }) {
  const reachable = peers.filter(p => p.reachable);
  if (reachable.length === 0) return null;

  const inner = reachable.slice(0, 5);
  const outer = reachable.slice(5, 12);

  const Chip = ({ peer }: { peer: ApiPeer }) => (
    <span
      title={`${peer.did}\n${peer.http_url}`}
      className={cn(
        'flex items-center justify-center rounded-full border border-border bg-surface',
        'px-2 py-1 font-mono text-[10px] text-muted whitespace-nowrap',
      )}
    >
      {peerHost(peer.http_url).split('.')[0].slice(0, 10) || shortDid(peer.did).slice(0, 6)}
    </span>
  );

  return (
    <div className="relative flex h-[320px] w-full items-center justify-center overflow-hidden">
      <div className="z-10 flex flex-col items-center gap-1.5">
        <span className="flex size-12 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-accent">
          <Server size={20} />
        </span>
        <span className="text-[12px] font-semibold text-foreground">{nodeName ?? 'this node'}</span>
        <span className="text-[11px] text-muted tabular">{reachable.length} peers up</span>
      </div>

      <OrbitingCircles iconSize={64} radius={95} duration={26} path>
        {inner.map(p => <Chip key={p.did} peer={p} />)}
      </OrbitingCircles>

      {outer.length > 0 && (
        <OrbitingCircles iconSize={64} radius={145} duration={36} reverse path>
          {outer.map(p => <Chip key={p.did} peer={p} />)}
        </OrbitingCircles>
      )}
    </div>
  );
}
