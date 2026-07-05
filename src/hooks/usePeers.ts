import { useState, useEffect, useMemo } from 'react';
import { fetchPeers, fetchP2PInfo, peerHost } from '../lib/api';
import type { ApiPeer, P2PInfo } from '../lib/api';
import { useDebouncedValue } from './useDebouncedValue';
import { useAutoRefresh } from './useAutoRefresh';

interface Options {
  page: number;
  perPage: number;
  search?: string;
  refreshKey?: number;
}

interface Result {
  peers: ApiPeer[] | null;
  p2p: P2PInfo | null;
  allCount: number;
  reachableCount: number;
  totalCount: number;
  totalPages: number;
  windowStart: number;
  windowEnd: number;
  loading: boolean;
  error: string | null;
}

/**
 * Peer directory: full list fetched per sweep (the endpoint is unpaginated),
 * filtered/paged client-side, re-fetched on a visibility-aware 60s tick.
 * Reachable peers sort first, then by most recent last_seen.
 */
export function usePeers({ page, perPage, search = '', refreshKey = 0 }: Options): Result {
  const tick = useAutoRefresh(60_000, true);
  const [all, setAll] = useState<ApiPeer[] | null>(null);
  const [p2p, setP2p] = useState<P2PInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);

  const [prevRefreshKey, setPrevRefreshKey] = useState(refreshKey);
  if (prevRefreshKey !== refreshKey) {
    setPrevRefreshKey(refreshKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetchPeers(controller.signal),
      fetchP2PInfo(controller.signal).catch(() => null),
    ])
      .then(([peers, p2pInfo]) => {
        if (controller.signal.aborted) return;
        setAll(peers);
        setP2p(p2pInfo);
        setLoading(false);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load peers');
        setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey, tick]);

  const derived = useMemo(() => {
    if (!all) {
      return {
        peers: null, allCount: 0, reachableCount: 0,
        totalCount: 0, totalPages: 1, windowStart: 0, windowEnd: 0,
      };
    }
    const sorted = [...all].sort((a, b) => {
      if (a.reachable !== b.reachable) return a.reachable ? -1 : 1;
      return (b.last_seen ?? '').localeCompare(a.last_seen ?? '');
    });
    const filtered = debouncedSearch
      ? sorted.filter(
          p =>
            p.did.toLowerCase().includes(debouncedSearch) ||
            peerHost(p.http_url).toLowerCase().includes(debouncedSearch),
        )
      : sorted;

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const peers = filtered.slice(start, start + perPage);

    return {
      peers,
      allCount: all.length,
      reachableCount: all.filter(p => p.reachable).length,
      totalCount,
      totalPages,
      windowStart: totalCount === 0 ? 0 : start + 1,
      windowEnd: Math.min(start + perPage, totalCount),
    };
  }, [all, debouncedSearch, page, perPage]);

  return { ...derived, p2p, loading, error };
}
