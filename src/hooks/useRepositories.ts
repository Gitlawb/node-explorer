import { useState, useEffect, useMemo } from 'react';
import { fetchRepos, mapApiRepo, SERVER_SEARCH_ENABLED } from '../lib/api';
import type { ApiRepo, RepoSort } from '../lib/api';
import type { Repository } from '../types/repo';
import { DEFAULT_PER_PAGE } from '../lib/constants';
import { useDebouncedValue } from './useDebouncedValue';

interface Options {
  page: number;
  perPage?: number;
  search?: string;
  sort?: RepoSort;
  owner?: string;
  refreshKey?: number;
}

interface Result {
  /** null until the first page has ever loaded (render skeletons) */
  repos: Repository[] | null;
  totalCount: number;
  totalPages: number;
  windowStart: number;
  windowEnd: number;
  loading: boolean;
  error: string | null;
  /** 'server' when the node filters/sorts; 'page' when search/sort apply only to the loaded page */
  searchScope: 'server' | 'page';
}

function sortPage(repos: ApiRepo[], sort: RepoSort): ApiRepo[] {
  const sorted = [...repos];
  switch (sort) {
    case 'created':
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
    case 'oldest':
      sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'stars':
      sorted.sort((a, b) => b.star_count - a.star_count);
      break;
    case 'updated':
    default:
      break; // server order is updated_at DESC
  }
  return sorted;
}

export function useRepositories({
  page,
  perPage = DEFAULT_PER_PAGE,
  search = '',
  sort = 'updated',
  owner = '',
  refreshKey = 0,
}: Options): Result {
  const [apiRepos, setApiRepos] = useState<ApiRepo[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const serverQuery = SERVER_SEARCH_ENABLED ? debouncedSearch : '';
  const serverSort: RepoSort = SERVER_SEARCH_ENABLED ? sort : 'updated';

  // Render-phase reset: flip to loading as soon as the query inputs change,
  // without a cascading effect (react-hooks/set-state-in-effect).
  const fetchKey = `${page}|${perPage}|${owner}|${serverQuery}|${serverSort}|${refreshKey}`;
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey);
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchRepos({
      limit: perPage,
      offset: (page - 1) * perPage,
      owner: owner || undefined,
      q: serverQuery || undefined,
      sort: serverSort,
      signal: controller.signal,
    })
      .then(({ repos, totalCount }) => {
        setApiRepos(repos);
        setTotalCount(totalCount);
        setLoading(false);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load repositories');
        setLoading(false);
      });
    return () => controller.abort();
  }, [page, perPage, owner, serverQuery, serverSort, refreshKey]);

  const derived = useMemo(() => {
    if (!apiRepos) {
      return { repos: null, totalPages: 1, windowStart: 0, windowEnd: 0 };
    }
    let rows = apiRepos;
    if (!SERVER_SEARCH_ENABLED) {
      const q = debouncedSearch.toLowerCase();
      if (q) {
        rows = rows.filter(
          r =>
            r.name.toLowerCase().includes(q) ||
            (r.description ?? '').toLowerCase().includes(q) ||
            r.owner_did.toLowerCase().includes(q),
        );
      }
      rows = sortPage(rows, sort);
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    const start = (page - 1) * perPage;
    const windowStart = totalCount === 0 ? 0 : start + 1;
    const windowEnd = Math.min(start + apiRepos.length, totalCount);

    return { repos: rows.map(r => mapApiRepo(r)), totalPages, windowStart, windowEnd };
  }, [apiRepos, totalCount, page, perPage, debouncedSearch, sort]);

  return {
    ...derived,
    totalCount,
    loading,
    error,
    searchScope: SERVER_SEARCH_ENABLED ? 'server' : 'page',
  };
}
