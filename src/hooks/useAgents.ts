import { useState, useEffect, useMemo } from 'react';
import { fetchAgents } from '../lib/api';
import type { ApiAgent } from '../lib/api';
import { useDebouncedValue } from './useDebouncedValue';

// The agents endpoint is unpaginated, so the full list is fetched once per
// session and paged/filtered client-side.
let agentsCache: ApiAgent[] | null = null;
let agentsPromise: Promise<ApiAgent[]> | null = null;

function loadAgents(force = false): Promise<ApiAgent[]> {
  if (force) {
    agentsCache = null;
    agentsPromise = null;
  }
  if (agentsCache) return Promise.resolve(agentsCache);
  if (!agentsPromise) {
    agentsPromise = fetchAgents()
      .then(agents => {
        agentsCache = agents;
        agentsPromise = null;
        return agents;
      })
      .catch(err => {
        agentsPromise = null;
        throw err;
      });
  }
  return agentsPromise;
}

interface Options {
  page: number;
  perPage: number;
  search?: string;
  refreshKey?: number;
}

interface Result {
  agents: ApiAgent[] | null;
  totalCount: number;
  totalPages: number;
  windowStart: number;
  windowEnd: number;
  loading: boolean;
  error: string | null;
}

export function useAgents({ page, perPage, search = '', refreshKey = 0 }: Options): Result {
  const [all, setAll] = useState<ApiAgent[] | null>(agentsCache);
  const [loading, setLoading] = useState(agentsCache === null);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);

  // Render-phase reset on refresh (react-hooks/set-state-in-effect)
  const [prevRefreshKey, setPrevRefreshKey] = useState(refreshKey);
  if (prevRefreshKey !== refreshKey) {
    setPrevRefreshKey(refreshKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    loadAgents(refreshKey > 0)
      .then(agents => {
        if (cancelled) return;
        setAll(agents);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load agents');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const derived = useMemo(() => {
    if (!all) {
      return { agents: null, totalCount: 0, totalPages: 1, windowStart: 0, windowEnd: 0 };
    }
    const filtered = debouncedSearch
      ? all.filter(
          a =>
            a.did.toLowerCase().includes(debouncedSearch) ||
            a.capabilities.some(c => c.toLowerCase().includes(debouncedSearch)),
        )
      : all;

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const agents = filtered.slice(start, start + perPage);
    const windowStart = totalCount === 0 ? 0 : start + 1;
    const windowEnd = Math.min(start + perPage, totalCount);

    return { agents, totalCount, totalPages, windowStart, windowEnd };
  }, [all, debouncedSearch, page, perPage]);

  return { ...derived, loading, error };
}
