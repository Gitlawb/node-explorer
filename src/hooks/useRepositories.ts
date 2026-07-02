import { useState, useEffect, useMemo } from 'react';
import { fetchAllRepos, invalidateReposCache, mapApiRepo } from '../lib/api';
import type { ApiRepo } from '../lib/api';
import type { Repository } from '../types/repo';
import { DEFAULT_PER_PAGE } from '../lib/mock-data';

interface Options {
  page: number;
  perPage?: number;
  search?: string;
  refreshKey?: number;
}

interface Result {
  repos: Repository[];
  totalCount: number;
  totalPages: number;
  windowStart: number;
  windowEnd: number;
  loading: boolean;
  error: string | null;
}

export function useRepositories({
  page,
  perPage = DEFAULT_PER_PAGE,
  search = '',
  refreshKey = 0,
}: Options): Result {
  const [apiRepos, setApiRepos] = useState<ApiRepo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (refreshKey > 0) invalidateReposCache();
    setLoading(true);
    setError(null);
    fetchAllRepos()
      .then(data => {
        if (!cancelled) {
          setApiRepos(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load repositories');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const derived = useMemo(() => {
    if (!apiRepos) {
      return { repos: [], totalCount: 0, totalPages: 1, windowStart: 0, windowEnd: 0 };
    }
    const q = search.trim().toLowerCase();
    const filtered = q
      ? apiRepos.filter(
          r =>
            r.name.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.owner_did.toLowerCase().includes(q),
        )
      : apiRepos;

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const repos = filtered.slice(start, start + perPage).map(r => mapApiRepo(r));
    const windowStart = totalCount === 0 ? 0 : start + 1;
    const windowEnd = Math.min(start + perPage, totalCount);

    return { repos, totalCount, totalPages, windowStart, windowEnd };
  }, [apiRepos, page, perPage, search]);

  return { ...derived, loading, error };
}
