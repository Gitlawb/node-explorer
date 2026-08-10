import { useSearchParams } from 'react-router-dom';
import { useCallback, useRef, useState } from 'react';
import { Input } from '@heroui/react';
import { useListNav } from '../hooks/useShortcuts';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import { useAgents } from '../hooks/useAgents';
import { AgentList } from '../components/agents/AgentList';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';
import { MicroLabel } from '../components/ui/MicroLabel';

export default function AgentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
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

  const { agents, totalCount, totalPages, windowStart, windowEnd, loading, error } = useAgents({
    page,
    perPage,
    search,
  });

  const listRef = useRef<HTMLDivElement>(null);
  useListNav(listRef);

  // Local input state — a URL-controlled input drops keystrokes while router
  // transitions lag; sync from URL only when the input isn't focused.
  const [searchValue, setSearchValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    const inputFocused =
      typeof document !== 'undefined' && document.activeElement?.id === 'agent-search';
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
        title="agents"
        countNoun="agents"
        description={
          <p className="m-0">
            Registered identities on this gitlawb node. Every agent is a{' '}
            <code className="text-accent">did:key</code> — inspect capabilities, trust scores,
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
          <Input
            id="agent-search"
            value={searchValue}
            onChange={e => {
              setSearchValue(e.target.value);
              setParams({ q: e.target.value, page: null }, true);
            }}
            placeholder="search by did or capability…"
            autoComplete="off"
            spellCheck="false"
            variant="secondary"
            className="w-full h-9 px-3 rounded-[--radius]"
          />
        </div>

        {error ? (
          <div className="border border-border py-16 text-center">
            <p className="m-0 text-[13px] text-danger mb-4">failed to load agents: {error}</p>
          </div>
        ) : (
          <>
            <div ref={listRef}>
              <AgentList agents={agents} loading={loading} skeletonCount={Math.min(perPage, 12)} />
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
              noun="agents"
            />
          </>
        )}

      </div>
    </div>
  );
}
