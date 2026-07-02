import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import type { RepoSort } from '../lib/api';
import { useRepositories } from '../hooks/useRepositories';
import { useRefreshKey } from '../hooks/useRefreshKey';
import { RepoList } from '../components/repos/RepoList';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';
import { RepoToolbar } from '../components/repos/RepoToolbar';
import type { ForkFilter } from '../components/repos/RepoToolbar';
import { ExploreTabs } from '../components/layout/ExploreTabs';
import { Pill } from '../components/ui/Pill';

const SORTS: RepoSort[] = ['updated', 'created', 'oldest', 'name', 'stars'];
const FORK_FILTERS: ForkFilter[] = ['all', 'forks', 'sources'];

export default function RepositoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const owner = searchParams.get('owner') ?? '';
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawPer = Number(searchParams.get('per'));
  const perPage = PER_PAGE_OPTIONS.includes(rawPer) ? rawPer : DEFAULT_PER_PAGE;
  const rawSort = searchParams.get('sort') as RepoSort | null;
  const sort: RepoSort = rawSort && SORTS.includes(rawSort) ? rawSort : 'updated';
  const rawFork = searchParams.get('fork') as ForkFilter | null;
  const forkFilter: ForkFilter = rawFork && FORK_FILTERS.includes(rawFork) ? rawFork : 'all';

  const { refreshKey, refresh } = useRefreshKey();

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

  const { repos, totalCount, totalPages, windowStart, windowEnd, loading, error, searchScope } =
    useRepositories({ page, perPage, search, sort, owner, refreshKey });

  const visibleRepos = useMemo(() => {
    if (!repos || forkFilter === 'all') return repos;
    return repos.filter(r => (forkFilter === 'forks' ? r.isMirror : !r.isMirror));
  }, [repos, forkFilter]);

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-12">

      <ExploreTabs />

      <RepoHero
        totalCount={totalCount}
        page={page}
        perPage={perPage}
        windowStart={windowStart}
        windowEnd={windowEnd}
        refreshing={loading}
        onRefresh={refresh}
      />

      <div className="pt-8 pb-20">

        <RepoToolbar
          search={search}
          onSearchChange={v => setParams({ q: v, page: null }, true)}
          sort={sort}
          onSortChange={v => setParams({ sort: v === 'updated' ? null : v })}
          forkFilter={forkFilter}
          onForkFilterChange={v => setParams({ fork: v === 'all' ? null : v })}
          searchScope={searchScope}
          loadedCount={repos?.length ?? 0}
        />

        {/* Owner filter chip */}
        {owner && (
          <div className="flex items-center gap-2 mb-4">
            <span className="micro-label">owner</span>
            <Pill onClick={() => setParams({ owner: null, page: null })} aria-label={`clear owner filter ${owner}`}>
              {owner.length > 16 ? `${owner.slice(0, 16)}…` : owner} ✕
            </Pill>
          </div>
        )}

        {error ? (
          <div className="border border-border py-16 text-center">
            <p className="m-0 text-[13px] text-destructive mb-4">failed to load repositories: {error}</p>
            <Pill onClick={refresh}>retry</Pill>
          </div>
        ) : (
          <>
            <RepoList
              repos={visibleRepos}
              loading={loading}
              skeletonCount={Math.min(perPage, 12)}
              emptyMessage={search || forkFilter !== 'all' ? 'no repositories match' : 'no repositories yet'}
            />
            <RepoPagination
              page={page}
              totalPages={totalPages}
              perPage={perPage}
              totalCount={totalCount}
              windowStart={windowStart}
              windowEnd={windowEnd}
              onPageChange={p => setParams({ page: p <= 1 ? null : String(p) })}
              onPerPageChange={n => setParams({ per: n === DEFAULT_PER_PAGE ? null : String(n), page: null })}
            />
          </>
        )}

      </div>
    </div>
  );
}
