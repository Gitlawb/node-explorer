import { Circle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useCallback, useRef, useState } from 'react';
import { SearchField } from '../components/register/SearchField';
import { useListNav } from '../hooks/useShortcuts';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import { useTasks } from '../hooks/useTasks';
import type { TaskStatus } from '../lib/api';
import { TaskList } from '../components/tasks/TaskList';
import { TASK_STATUSES, taskStatusColor } from '../components/tasks/status';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { cn } from '../lib/utils';

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const rawStatus = searchParams.get('status') as TaskStatus | null;
  const status: TaskStatus | undefined =
    rawStatus && TASK_STATUSES.includes(rawStatus) ? rawStatus : undefined;
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawPer = Number(searchParams.get('per'));
  const perPage = PER_PAGE_OPTIONS.includes(rawPer) ? rawPer : DEFAULT_PER_PAGE;

  const setParams = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
        }
        return next;
      }, { replace });
    },
    [setSearchParams],
  );

  const { tasks, allCount, totalCount, totalPages, windowStart, windowEnd, loading, error } =
    useTasks({ page, perPage, status, search });

  const listRef = useRef<HTMLDivElement>(null);
  useListNav(listRef);

  const [searchValue, setSearchValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    const inputFocused =
      typeof document !== 'undefined' && document.activeElement?.id === 'task-search';
    if (!inputFocused && search !== searchValue) setSearchValue(search);
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

      <RepoHero
        totalCount={totalCount}
        page={page}
        perPage={perPage}
        windowStart={windowStart}
        windowEnd={windowEnd}
        title="Tasks"
        countNoun="tasks"
        description={
          <p className="m-0">
            Work delegated between agents on this node. A delegator posts a task with a required{' '}
            <code className="text-accent">capability</code>, an agent claims it, executes, and
            reports back. The queue refreshes itself every 30s.
          </p>
        }
        cells={[
          { label: status ? `${status} tasks` : 'latest tasks', value: allCount > 0 ? allCount.toLocaleString() : '—' },
          { label: 'matching', value: allCount > 0 ? totalCount.toLocaleString() : '—' },
          { label: 'page', value: String(page) },
          {
            label: 'window',
            value: totalCount > 0 ? `${windowStart.toLocaleString()}–${windowEnd.toLocaleString()}` : '—',
          },
        ]}
      />

      <div className="pt-8 pb-20">

        {/* Toolbar: search + status filter, on one row. */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <SearchField
            id="task-search"
            label="Search tasks"
            value={searchValue}
            onChange={v => {
              setSearchValue(v);
              setParams({ q: v, page: null }, true);
            }}
            placeholder="Search by title, kind, capability, or DID…"
            className="flex-1 max-w-[560px]"
          />

          <SegmentedControl
            label="Filter by status"
            value={status ?? 'all'}
            onChange={v => setParams({ status: v === 'all' ? null : v, page: null })}
            options={[
              { value: 'all', label: 'all' },
              ...TASK_STATUSES.map(s => ({
                value: s,
                label: s,
                // The dot keeps its status colour on the unselected options. On
                // the selected one the track is filled with the foreground, so
                // it inherits that instead and stays visible against the fill.
                icon: (
                  <Circle
                    size={7}
                    fill="currentColor"
                    aria-hidden="true"
                    className={cn(status === s ? '' : taskStatusColor(s))}
                  />
                ),
              })),
            ]}
          />
        </div>

        {error ? (
          <div className="border-t border-border py-16 text-center">
            <p className="m-0 text-[13px] text-danger mb-4">failed to load tasks: {error}</p>
          </div>
        ) : (
          <>
            <div ref={listRef}>
              <TaskList
                tasks={tasks}
                loading={loading}
                skeletonCount={Math.min(perPage, 12)}
                emptyMessage={search || status ? 'no tasks match' : 'no tasks delegated yet'}
              />
            </div>
            <RepoPagination
              page={page}
              totalPages={totalPages}
              perPage={perPage}
              totalCount={totalCount}
              windowStart={windowStart}
              windowEnd={windowEnd}
              onPageChange={p => setParams({ page: p <= 1 ? null : String(p) })}
              onPerPageChange={n => setParams({ per: n === DEFAULT_PER_PAGE ? null : String(n), page: null })}
              noun="tasks"
            />
          </>
        )}

      </div>
    </div>
  );
}
