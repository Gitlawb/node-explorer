// Federated node registry for the network page. The nodes serve no CORS
// headers, so peer nodes are reached through per-node proxy prefixes — see
// vite.config.ts (dev) and vercel.json (prod), which must list the same hosts.
import type { NodeInfo, NodeStats, ApiPeer, P2PInfo, ApiRefUpdate } from './api';

export interface FederatedNode {
  id: string;
  /** Display label — the public host. */
  label: string;
  /** Public origin, for out-links. */
  url: string;
  /** Same-origin proxy prefix ('' = the primary node's default proxy). */
  proxy: string;
}

export const FEDERATED_NODES: FederatedNode[] = [
  { id: 'node1', label: 'node.gitlawb.com', url: 'https://node.gitlawb.com', proxy: '' },
  { id: 'node2', label: 'node2.gitlawb.com', url: 'https://node2.gitlawb.com', proxy: '/nodes/node2' },
  { id: 'node3', label: 'node3.gitlawb.com', url: 'https://node3.gitlawb.com', proxy: '/nodes/node3' },
  { id: 'manila', label: 'manila.gitlawb.com', url: 'https://manila.gitlawb.com', proxy: '/nodes/manila' },
];

export interface NodeSnapshot {
  node: FederatedNode;
  reachable: boolean;
  info: NodeInfo & { p2p_peer_id?: string | null } | null;
  stats: NodeStats | null;
  peers: ApiPeer[] | null;
  p2p: P2PInfo | null;
  events: ApiRefUpdate[] | null;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

const nullOnError = <T,>(p: Promise<T>): Promise<T | null> => p.catch(() => null);

/**
 * One parallel sweep of a node's public read surface. Every sub-fetch fails
 * independently — a node is "reachable" if any call answered, so a partially
 * degraded node still renders with whatever it returned.
 */
export async function fetchNodeSnapshot(node: FederatedNode, signal?: AbortSignal): Promise<NodeSnapshot> {
  const api = `${node.proxy}/api/v1`;
  const [info, stats, peers, p2p, events] = await Promise.all([
    nullOnError(getJson<NodeSnapshot['info']>(`${node.proxy}/node-info`, signal)),
    nullOnError(getJson<NodeStats>(`${api}/stats`, signal)),
    nullOnError(getJson<{ peers?: ApiPeer[] }>(`${api}/peers`, signal).then(d => d.peers ?? [])),
    nullOnError(getJson<P2PInfo>(`${api}/p2p/info`, signal)),
    nullOnError(
      getJson<{ events?: ApiRefUpdate[] }>(`${api}/events/ref-updates?limit=200`, signal).then(
        d => d.events ?? [],
      ),
    ),
  ]);

  return {
    node,
    reachable: Boolean(info || stats || peers || p2p || events),
    info,
    stats,
    peers,
    p2p,
    events,
  };
}
