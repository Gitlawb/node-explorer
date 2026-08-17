import { Circle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useCallback, useRef, useState } from 'react';
import { Input } from '@heroui/react';
import { useListNav } from '../hooks/useShortcuts';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import { useTasks } from '../hooks/useTasks';
import type { TaskStatus } from '../lib/api';
import { TaskList } from '../components/tasks/TaskList';
import { TASK_STATUSES, taskStatusColor } from '../components/tasks/status';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';
import { MicroLabel } from '../components/ui/MicroLabel';
import { Pill } from '../components/ui/Pill';
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">

      <RepoHero
        totalCount={totalCount}
        page={page}
        perPage={perPage}
        windowStart={windowStart}
        windowEnd={windowEnd}
        title="tasks"
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

        {/* Toolbar: search + status chips */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mb-4">
          <div className="flex-1 min-w-[240px] max-w-[560px]">
            <MicroLabel className="block mb-1.5">
              <label htmlFor="task-search">search</label>
            </MicroLabel>
            <Input
              id="task-search"
              value={searchValue}
              onChange={e => {
                setSearchValue(e.target.value);
                setParams({ q: e.target.value, page: null }, true);
              }}
              placeholder="search by title, kind, capability, or did…"
              autoComplete="off"
              spellCheck="false"
              variant="secondary"
              className="w-full h-9 px-3 rounded-[--radius]"
            />
          </div>

          <div>
            <MicroLabel className="block mb-1.5">status</MicroLabel>
            <div className="flex gap-1.5 flex-wrap">
              <Pill
                active={!status}
                onClick={() => setParams({ status: null, page: null })}
                aria-pressed={!status}
              >
                all
              </Pill>
              {TASK_STATUSES.map(s => (
                <Pill
                  key={s}
                  active={status === s}
                  onClick={() => setParams({ status: status === s ? null : s, page: null })}
                  aria-pressed={status === s}
                >
                  <Circle size={7} fill="currentColor" aria-hidden="true" className={cn(taskStatusColor(s))} />
                  {s}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="border border-border py-16 text-center">
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
