import { useState, useEffect, useMemo } from 'react';
import { fetchAgents, trustTier } from '../lib/api';
import type { ApiAgent } from '../lib/api';
import { useDebouncedValue } from './useDebouncedValue';
import { useAutoRefresh } from './useAutoRefresh';

// The agents endpoint is unpaginated, so the full list is fetched once per
// refetch cycle and paged/filtered client-side.
let agentsCache: ApiAgent[] | null = null;
let agentsPromise: Promise<ApiAgent[]> | null = null;

/** Read-only view of the session agent cache (e.g. for the command palette). */
export function getCachedAgents(): ApiAgent[] | null {
  return agentsCache;
}

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

/** Trust bands mirror the node's own tier thresholds (see trustTier). */
export type TrustBand = 'all' | 'newcomer' | 'contributor' | 'trusted' | 'maintainer';
export type AgentSort = 'trust' | 'lowest' | 'newest' | 'seen';

export type BandCounts = Record<Exclude<TrustBand, 'all'>, number> & { all: number };

interface Options {
  page: number;
  perPage: number;
  search?: string;
  band?: TrustBand;
  sort?: AgentSort;
}

interface Result {
  agents: ApiAgent[] | null;
  /** Agent count per trust band across the whole register, before paging. */
  bandCounts: BandCounts;
  totalCount: number;
  totalPages: number;
  windowStart: number;
  windowEnd: number;
  loading: boolean;
  error: string | null;
}

export function useAgents({ page, perPage, search = '', band = 'all', sort = 'trust' }: Options): Result {
  const tick = useAutoRefresh(60_000, true);
  const [all, setAll] = useState<ApiAgent[] | null>(agentsCache);
  const [loading, setLoading] = useState(agentsCache === null);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);

  // Render-phase reset on tick or when the search query resolves to a new page.
  const fetchKey = `${tick}|${debouncedSearch}`;
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey);
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    loadAgents(tick > 0)
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
  }, [tick, debouncedSearch, page, perPage]);

  const derived = useMemo(() => {
    const empty: BandCounts = { newcomer: 0, contributor: 0, trusted: 0, maintainer: 0, all: 0 };
    if (!all) {
      return { agents: null, totalCount: 0, totalPages: 1, windowStart: 0, windowEnd: 0, bandCounts: empty };
    }

    const searched = debouncedSearch
      ? all.filter(
          a =>
            a.did.toLowerCase().includes(debouncedSearch) ||
            a.capabilities.some(c => c.toLowerCase().includes(debouncedSearch)),
        )
      : all;

    // Counts are taken after search but before the band filter, so each band
    // shows how many it would yield rather than collapsing to the active one.
    const bandCounts = { ...empty, all: searched.length };
    for (const a of searched) bandCounts[trustTier(a.trust_score) as Exclude<TrustBand, 'all'>]++;

    const filtered = band === 'all'
      ? searched
      : searched.filter(a => trustTier(a.trust_score) === band);

    const sorted = [...filtered];
    const time = (v: string | null) => (v ? new Date(v).getTime() : 0);
    switch (sort) {
      case 'lowest':
        sorted.sort((a, b) => a.trust_score - b.trust_score);
        break;
      case 'newest':
        sorted.sort((a, b) => time(b.registered_at) - time(a.registered_at));
        break;
      case 'seen':
        // Never-seen agents sort last rather than tying at the epoch.
        sorted.sort((a, b) => time(b.last_seen) - time(a.last_seen));
        break;
      case 'trust':
      default:
        sorted.sort((a, b) => b.trust_score - a.trust_score);
        break;
    }

    const totalCount = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const agents = sorted.slice(start, start + perPage);
    const windowStart = totalCount === 0 ? 0 : start + 1;
    const windowEnd = Math.min(start + perPage, totalCount);

    return { agents, totalCount, totalPages, windowStart, windowEnd, bandCounts };
  }, [all, debouncedSearch, band, sort, page, perPage]);

  return { ...derived, loading, error };
}
