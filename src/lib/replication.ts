// Replication analysis over per-node ref-update feeds: for each distinct
// (origin, repo, ref, sha) tuple, which nodes carry it? The origin node always
// has the tuple (it received the push); others have it iff their gossip feed
// contains it. Ported from the gitlawb.com web implementation.
import type { ApiRefUpdate } from './api';

export interface EventTuple {
  key: string;
  node_did: string;
  repo: string;
  ref_name: string;
  new_sha: string;
  timestamp: string;
}

export interface NodeFeed {
  label: string;
  /** The node's own DID (from node-info); '' when unknown. */
  did: string;
  feed: EventTuple[];
}

export type Presence = 'origin' | 'replicated' | 'missing';

export interface ReplicationRow {
  tuple: EventTuple;
  presence: Record<string, Presence>;
  fullyReplicated: boolean;
}

export interface ReplicationStatus {
  rows: ReplicationRow[];
  totalTuples: number;
  fullyReplicatedCount: number;
  coveragePercent: number;
  driftByNode: Record<string, number>;
  receivedByNode: Record<string, number>;
  originatedByNode: Record<string, number>;
}

export function tupleKey(node_did: string, repo: string, ref_name: string, new_sha: string): string {
  return `${node_did}|${repo}|${ref_name}|${new_sha}`;
}

export function toEventTuples(events: ApiRefUpdate[]): EventTuple[] {
  return events.map(e => ({
    key: tupleKey(e.node_did, e.repo, e.ref_name, e.new_sha),
    node_did: e.node_did,
    repo: e.repo,
    ref_name: e.ref_name,
    new_sha: e.new_sha,
    timestamp: e.timestamp,
  }));
}

export function analyzeReplication(feeds: NodeFeed[]): ReplicationStatus {
  const tupleMap = new Map<string, EventTuple>();
  const feedKeySets = new Map<string, Set<string>>();
  const didToLabel = new Map<string, string>();

  for (const f of feeds) {
    feedKeySets.set(f.label, new Set(f.feed.map(t => t.key)));
    if (f.did) didToLabel.set(f.did, f.label);
    for (const t of f.feed) tupleMap.set(t.key, t);
  }

  const driftByNode: Record<string, number> = {};
  const receivedByNode: Record<string, number> = {};
  const originatedByNode: Record<string, number> = {};
  for (const f of feeds) {
    driftByNode[f.label] = 0;
    receivedByNode[f.label] = f.feed.length;
    originatedByNode[f.label] = 0;
  }

  const rows: ReplicationRow[] = [];
  let fullyReplicatedCount = 0;

  for (const t of tupleMap.values()) {
    const originLabel = didToLabel.get(t.node_did);
    if (originLabel) originatedByNode[originLabel] += 1;

    const presence: Record<string, Presence> = {};
    let presentCount = 0;
    for (const f of feeds) {
      let p: Presence;
      if (f.did && f.did === t.node_did) {
        p = 'origin';
      } else if (feedKeySets.get(f.label)?.has(t.key)) {
        p = 'replicated';
      } else {
        p = 'missing';
      }
      presence[f.label] = p;
      if (p === 'missing') driftByNode[f.label] += 1;
      else presentCount += 1;
    }

    const fullyReplicated = presentCount === feeds.length;
    if (fullyReplicated) fullyReplicatedCount += 1;
    rows.push({ tuple: t, presence, fullyReplicated });
  }

  rows.sort((a, b) => new Date(b.tuple.timestamp).getTime() - new Date(a.tuple.timestamp).getTime());

  const total = tupleMap.size;
  return {
    rows,
    totalTuples: total,
    fullyReplicatedCount,
    coveragePercent: total > 0 ? Math.round((100 * fullyReplicatedCount) / total) : 0,
    driftByNode,
    receivedByNode,
    originatedByNode,
  };
}
