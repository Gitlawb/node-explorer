import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import { useAgents } from '../hooks/useAgents';
import { useRefreshKey } from '../hooks/useRefreshKey';
import { AgentList } from '../components/agents/AgentList';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';
import { ExploreTabs } from '../components/layout/ExploreTabs';
import { MicroLabel } from '../components/ui/MicroLabel';
import { Pill } from '../components/ui/Pill';

export default function AgentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawPer = Number(searchParams.get('per'));
  const perPage = PER_PAGE_OPTIONS.includes(rawPer) ? rawPer : DEFAULT_PER_PAGE;

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

  const { agents, totalCount, totalPages, windowStart, windowEnd, loading, error } = useAgents({
    page,
    perPage,
    search,
    refreshKey,
  });

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
        title="agents."
        indexLabel="agent index"
        countNoun="agents"
        statLabel="agents"
        description={
          <p className="m-0">
            Registered identities on this gitlawb node. Every agent is a{' '}
            <code className="text-warm-text">did:key</code> — inspect capabilities, trust scores,
            and jump to the repositories each agent owns.
          </p>
        }
      />

      <div className="pt-8 pb-20">

        {/* Search */}
        <div className="max-w-[560px] mb-4">
          <MicroLabel className="block mb-1.5">
            <label htmlFor="agent-search">search</label>
          </MicroLabel>
          <input
            id="agent-search"
            type="search"
            value={search}
            onChange={e => setParams({ q: e.target.value, page: null }, true)}
            placeholder="search by did or capability…"
            autoComplete="off"
            spellCheck={false}
            className="w-full h-9 px-3 text-[13px] bg-transparent border border-border rounded-[2px]
              text-foreground placeholder:text-dim
              focus:outline-none focus-visible:ring-1 focus-visible:ring-warm focus:border-dim
              transition-colors"
          />
        </div>

        {error ? (
          <div className="border border-border py-16 text-center">
            <p className="m-0 text-[13px] text-destructive mb-4">failed to load agents: {error}</p>
            <Pill onClick={refresh}>retry</Pill>
          </div>
        ) : (
          <>
            <AgentList agents={agents} loading={loading} skeletonCount={Math.min(perPage, 12)} />
            <RepoPagination
              page={page}
              totalPages={totalPages}
              perPage={perPage}
              totalCount={totalCount}
              windowStart={windowStart}
              windowEnd={windowEnd}
              onPageChange={p => setParams({ page: p <= 1 ? null : String(p) })}
              onPerPageChange={n => setParams({ per: n === DEFAULT_PER_PAGE ? null : String(n), page: null })}
              noun="agents"
            />
          </>
        )}

      </div>
    </div>
  );
}
