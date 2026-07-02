import { useState, useEffect } from 'react';
import { fetchNodeInfo, fetchStats } from '../lib/api';
import type { NodeInfo, NodeStats } from '../lib/api';

interface NodeStatus {
  node: NodeInfo | null;
  stats: NodeStats | null;
  loading: boolean;
}

// One fetch per session — the chrome must never break the page, so failures
// simply leave the fields null.
type CachedStatus = { node: NodeInfo | null; stats: NodeStats | null };
let cached: CachedStatus | null = null;
let inflight: Promise<CachedStatus> | null = null;

function load(): Promise<CachedStatus> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = Promise.all([
      fetchNodeInfo().catch(() => null),
      fetchStats().catch(() => null),
    ]).then(([node, stats]) => {
      const result: CachedStatus = { node, stats };
      cached = result;
      inflight = null;
      return result;
    });
  }
  return inflight;
}

export function useNodeStatus(): NodeStatus {
  const [status, setStatus] = useState<NodeStatus>({
    node: cached?.node ?? null,
    stats: cached?.stats ?? null,
    loading: cached === null,
  });

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    load().then(result => {
      if (!cancelled && result) {
        setStatus({ node: result.node, stats: result.stats, loading: false });
      }
    });
    return () => { cancelled = true; };
  }, []);

  return status;
}
