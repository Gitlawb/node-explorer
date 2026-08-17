import { useSearchParams } from 'react-router-dom';
import { useCallback, useRef, useState } from 'react';
import { SearchField } from '../components/register/SearchField';
import { useListNav } from '../hooks/useShortcuts';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import { useAgents } from '../hooks/useAgents';
import type { TrustBand, AgentSort } from '../hooks/useAgents';
import { Dropdown } from '../components/ui/Dropdown';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { AgentList } from '../components/agents/AgentList';
import { AgentEcosystem } from '../components/agents/AgentEcosystem';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';

export default function AgentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawPer = Number(searchParams.get('per'));
  const perPage = PER_PAGE_OPTIONS.includes(rawPer) ? rawPer : DEFAULT_PER_PAGE;

  const BANDS: TrustBand[] = ['all', 'maintainer', 'trusted', 'contributor', 'newcomer'];
  const SORTS: AgentSort[] = ['trust', 'lowest', 'newest', 'seen'];
  const rawBand = searchParams.get('trust') as TrustBand | null;
  const band: TrustBand = rawBand && BANDS.includes(rawBand) ? rawBand : 'all';
  const rawSort = searchParams.get('sort') as AgentSort | null;
  const sort: AgentSort = rawSort && SORTS.includes(rawSort) ? rawSort : 'trust';

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

  const { agents, bandCounts, totalCount, totalPages, windowStart, windowEnd, loading, error } =
    useAgents({ page, perPage, search, band, sort });

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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">


      <RepoHero
        totalCount={totalCount}
        page={page}
        perPage={perPage}
        windowStart={windowStart}
        windowEnd={windowEnd}
        title="Agents"
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

        {/* The tooling that can drive this network — a claim about the protocol
            surface, not about which vendors have agents registered here. */}
        <section className="pb-2">
          <h2 className="m-0 mb-1 text-center text-[15px] font-semibold text-foreground">
            Works with
          </h2>
          <AgentEcosystem />
        </section>

        {/* Search, trust band, and sort on one row. Nearly every agent on this
            node sits in one band, so the counts are the useful part — they say
            up front how lopsided the register is. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-5">
          <SearchField
            id="agent-search"
            label="Search agents"
            value={searchValue}
            onChange={v => {
              setSearchValue(v);
              setParams({ q: v, page: null }, true);
            }}
            placeholder="Search by DID or capability…"
            className="flex-1 max-w-[460px]"
          />

          <Dropdown
            id="agent-sort"
            label="Sort"
            value={sort}
            onChange={v => setParams({ sort: v === 'trust' ? null : v, page: null })}
            options={[
              { value: 'trust', label: 'Highest trust' },
              { value: 'lowest', label: 'Lowest trust' },
              { value: 'newest', label: 'Newest registered' },
              { value: 'seen', label: 'Recently seen' },
            ]}
          />
        </div>

        <div className="mb-5">
          <SegmentedControl
            label="Filter by trust tier"
            value={band}
            onChange={b => setParams({ trust: b === 'all' ? null : b, page: null })}
            options={BANDS.map(b => ({
              value: b,
              label: b === 'all' ? 'all tiers' : b,
              count: bandCounts[b],
            }))}
          />
        </div>

        {error ? (
          <div className="border-t border-border py-16 text-center">
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
