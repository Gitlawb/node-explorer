import { useState, useEffect } from 'react';
import { fetchNodeInfo, fetchStats } from '../lib/api';
import type { NodeInfo, NodeStats } from '../lib/api';
import { useAutoRefresh } from './useAutoRefresh';

interface NodeStatus {
  node: NodeInfo | null;
  stats: NodeStats | null;
  loading: boolean;
}

// One fetch per session — the chrome must never break the page, so failures
// simply leave the fields null. On each visibility-aware tick the cache is
// bypassed so the chrome stays current.
type CachedStatus = { node: NodeInfo | null; stats: NodeStats | null };
let cached: CachedStatus | null = null;
let inflight: Promise<CachedStatus> | null = null;

function load(force = false): Promise<CachedStatus> {
  if (!force && cached) return Promise.resolve(cached);
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
  const tick = useAutoRefresh(60_000, true);
  const [status, setStatus] = useState<NodeStatus>({
    node: cached?.node ?? null,
    stats: cached?.stats ?? null,
    loading: cached === null,
  });

  useEffect(() => {
    let cancelled = false;
    load(tick > 0).then(result => {
      if (!cancelled && result) {
        setStatus({ node: result.node, stats: result.stats, loading: false });
      }
    });
    return () => { cancelled = true; };
  }, [tick]);

  return status;
}
