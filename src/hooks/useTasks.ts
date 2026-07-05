import { useState, useEffect, useMemo } from 'react';
import { fetchTasks, taskTitle } from '../lib/api';
import type { ApiTask, TaskStatus } from '../lib/api';
import { useDebouncedValue } from './useDebouncedValue';
import { useAutoRefresh } from './useAutoRefresh';

interface Options {
  page: number;
  perPage: number;
  /** Server-side filter — refetches when it changes. */
  status?: TaskStatus;
  search?: string;
  refreshKey?: number;
}

interface Result {
  tasks: ApiTask[] | null;
  allCount: number;
  totalCount: number;
  totalPages: number;
  windowStart: number;
  windowEnd: number;
  loading: boolean;
  error: string | null;
}

export function useTasks({ page, perPage, status, search = '', refreshKey = 0 }: Options): Result {
  const tick = useAutoRefresh(30_000, true);
  const [all, setAll] = useState<ApiTask[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);

  // Render-phase reset when the fetch key changes (manual refresh or filter).
  const fetchKey = `${refreshKey}|${status ?? ''}`;
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey);
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchTasks({ status, signal: controller.signal })
      .then(tasks => {
        if (controller.signal.aborted) return;
        setAll(tasks);
        setLoading(false);
        setError(null);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
        setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey, status, tick]);

  const derived = useMemo(() => {
    if (!all) {
      return { tasks: null, allCount: 0, totalCount: 0, totalPages: 1, windowStart: 0, windowEnd: 0 };
    }
    const filtered = debouncedSearch
      ? all.filter(
          t =>
            t.kind.toLowerCase().includes(debouncedSearch) ||
            taskTitle(t).toLowerCase().includes(debouncedSearch) ||
            t.delegator_did.toLowerCase().includes(debouncedSearch) ||
            (t.assignee_did ?? '').toLowerCase().includes(debouncedSearch) ||
            t.capability.toLowerCase().includes(debouncedSearch),
        )
      : all;

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;

    return {
      tasks: filtered.slice(start, start + perPage),
      allCount: all.length,
      totalCount,
      totalPages,
      windowStart: totalCount === 0 ? 0 : start + 1,
      windowEnd: Math.min(start + perPage, totalCount),
    };
  }, [all, debouncedSearch, page, perPage]);

  return { ...derived, loading, error };
}
