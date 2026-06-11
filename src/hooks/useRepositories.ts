import { useMemo } from 'react';
import { mockRepositories, TOTAL_REPOS, DEFAULT_PER_PAGE } from '../lib/mock-data';
import type { Repository } from '../types/repo';

interface Options {
  page: number;
  perPage?: number;
  search?: string;
}

interface Result {
  repos: Repository[];
  totalCount: number;
  totalPages: number;
  windowStart: number;
  windowEnd: number;
}

export function useRepositories({ page, perPage = DEFAULT_PER_PAGE, search = '' }: Options): Result {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? mockRepositories.filter(
          r =>
            r.name.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.owner.toLowerCase().includes(q),
        )
      : mockRepositories;

    const totalCount = q ? filtered.length : TOTAL_REPOS;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const repos = filtered.slice(start, start + perPage);
    const windowStart = totalCount === 0 ? 0 : start + 1;
    const windowEnd = Math.min(start + perPage, totalCount);

    return { repos, totalCount, totalPages, windowStart, windowEnd };
  }, [page, perPage, search]);
}
