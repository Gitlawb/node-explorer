import { useState, useEffect, useMemo } from 'react';
import { FEDERATED_NODES, fetchNodeSnapshot } from '../lib/nodes';
import type { NodeSnapshot } from '../lib/nodes';
import { analyzeReplication, toEventTuples } from '../lib/replication';
import type { ReplicationStatus } from '../lib/replication';
import { useAutoRefresh } from './useAutoRefresh';

interface Result {
  snapshots: NodeSnapshot[] | null;
  replication: ReplicationStatus | null;
  loading: boolean;
}

/**
 * Fans out to every federated node in parallel and derives replication
 * coverage from the nodes' ref-update feeds. Unreachable nodes stay in the
 * result (rendered as offline) and are excluded from replication analysis.
 */
export function useNetwork(refreshKey = 0): Result {
  const tick = useAutoRefresh(60_000, true);
  const [snapshots, setSnapshots] = useState<NodeSnapshot[] | null>(null);
  const [loading, setLoading] = useState(true);

  const [prevRefreshKey, setPrevRefreshKey] = useState(refreshKey);
  if (prevRefreshKey !== refreshKey) {
    setPrevRefreshKey(refreshKey);
    setLoading(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(FEDERATED_NODES.map(n => fetchNodeSnapshot(n, controller.signal)))
      .then(snaps => {
        if (controller.signal.aborted) return;
        setSnapshots(snaps);
        setLoading(false);
      })
      .catch(() => {
        // fetchNodeSnapshot never rejects except on abort.
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey, tick]);

  const replication = useMemo(() => {
    if (!snapshots) return null;
    const feeds = snapshots
      .filter(s => s.events !== null)
      .map(s => ({
        label: s.node.label,
        did: s.info?.did ?? '',
        feed: toEventTuples(s.events ?? []),
      }));
    if (feeds.length < 2) return null;
    return analyzeReplication(feeds);
  }, [snapshots]);

  return { snapshots, replication, loading };
}
