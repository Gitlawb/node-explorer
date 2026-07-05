import { useState, useEffect, useMemo } from 'react';
import { fetchRefUpdates, MAX_EVENT_LIMIT, isGossip } from '../lib/api';
import type { ApiRefUpdate } from '../lib/api';
import { useDebouncedValue } from './useDebouncedValue';
import { useAutoRefresh } from './useAutoRefresh';

export type EventSourceFilter = 'all' | 'local' | 'gossip';

interface Options {
  page: number;
  perPage: number;
  search?: string;
  source?: EventSourceFilter;
  /** Auto-refresh the feed (visibility-aware, 30s). */
  live?: boolean;
  refreshKey?: number;
}

interface Result {
  events: ApiRefUpdate[] | null;
  allCount: number;
  gossipCount: number;
  latest: ApiRefUpdate | null;
  totalCount: number;
  totalPages: number;
  windowStart: number;
  windowEnd: number;
  loading: boolean;
  error: string | null;
}

export function useRefUpdates({
  page, perPage, search = '', source = 'all', live = true, refreshKey = 0,
}: Options): Result {
  const tick = useAutoRefresh(30_000, live);
  const [all, setAll] = useState<ApiRefUpdate[] | null>(null);
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
    fetchRefUpdates(MAX_EVENT_LIMIT, controller.signal)
      .then(events => {
        if (controller.signal.aborted) return;
        setAll(events);
        setLoading(false);
        setError(null);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load events');
        setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey, tick]);

  const derived = useMemo(() => {
    if (!all) {
      return {
        events: null, allCount: 0, gossipCount: 0, latest: null,
        totalCount: 0, totalPages: 1, windowStart: 0, windowEnd: 0,
      };
    }
    let filtered = all;
    if (source !== 'all') {
      filtered = filtered.filter(e => (source === 'gossip') === isGossip(e));
    }
    if (debouncedSearch) {
      filtered = filtered.filter(
        e =>
          e.repo.toLowerCase().includes(debouncedSearch) ||
          e.ref_name.toLowerCase().includes(debouncedSearch) ||
          e.pusher_did.toLowerCase().includes(debouncedSearch),
      );
    }

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;

    return {
      events: filtered.slice(start, start + perPage),
      allCount: all.length,
      gossipCount: all.filter(isGossip).length,
      latest: all[0] ?? null,
      totalCount,
      totalPages,
      windowStart: totalCount === 0 ? 0 : start + 1,
      windowEnd: Math.min(start + perPage, totalCount),
    };
  }, [all, debouncedSearch, source, page, perPage]);

  return { ...derived, loading, error };
}
