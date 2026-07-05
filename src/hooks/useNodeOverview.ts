import { useState, useEffect } from 'react';
import {
  fetchNodeInfo,
  fetchStats,
  fetchPeers,
  fetchP2PInfo,
  fetchRefUpdates,
  fetchTasks,
  fetchRepos,
} from '../lib/api';
import type { NodeInfo, NodeStats, ApiPeer, P2PInfo, ApiRefUpdate, ApiTask, ApiRepo } from '../lib/api';
import { useAutoRefresh } from './useAutoRefresh';

export interface NodeOverview {
  node: NodeInfo | null;
  stats: NodeStats | null;
  peers: ApiPeer[] | null;
  p2p: P2PInfo | null;
  events: ApiRefUpdate[] | null;
  tasks: ApiTask[] | null;
  recentRepos: ApiRepo[] | null;
  loading: boolean;
  /** True when every sub-fetch failed — the node is unreachable. */
  unreachable: boolean;
}

const nullOnError = <T,>(p: Promise<T>): Promise<T | null> => p.catch(() => null);

/**
 * One parallel sweep of the dashboard's data. Each sub-fetch degrades
 * independently (a failed corner renders as "—", never breaks the page) and
 * the whole sweep re-runs on a visibility-aware 60s tick.
 */
export function useNodeOverview(refreshKey = 0): NodeOverview {
  const tick = useAutoRefresh(60_000, true);
  const [state, setState] = useState<Omit<NodeOverview, 'loading' | 'unreachable'>>({
    node: null,
    stats: null,
    peers: null,
    p2p: null,
    events: null,
    tasks: null,
    recentRepos: null,
  });
  const [loaded, setLoaded] = useState(false);

  // Render-phase reset on manual refresh only (ticks refresh in place).
  const [prevRefreshKey, setPrevRefreshKey] = useState(refreshKey);
  if (prevRefreshKey !== refreshKey) {
    setPrevRefreshKey(refreshKey);
    setLoaded(false);
  }

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    Promise.all([
      nullOnError(fetchNodeInfo(signal)),
      nullOnError(fetchStats(signal)),
      nullOnError(fetchPeers(signal)),
      nullOnError(fetchP2PInfo(signal)),
      nullOnError(fetchRefUpdates(50, signal)),
      nullOnError(fetchTasks({ signal })),
      nullOnError(fetchRepos({ limit: 4, offset: 0, signal }).then(r => r.repos)),
    ]).then(([node, stats, peers, p2p, events, tasks, recentRepos]) => {
      if (signal.aborted) return;
      setState({ node, stats, peers, p2p, events, tasks, recentRepos });
      setLoaded(true);
    });

    return () => controller.abort();
  }, [refreshKey, tick]);

  const unreachable =
    loaded &&
    !state.node && !state.stats && !state.peers && !state.p2p &&
    !state.events && !state.tasks && !state.recentRepos;

  return { ...state, loading: !loaded, unreachable };
}
