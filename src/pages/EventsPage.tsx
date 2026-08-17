import { Circle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useCallback, useRef, useState } from 'react';
import { Input } from '@heroui/react';
import { useListNav } from '../hooks/useShortcuts';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import { useRefUpdates } from '../hooks/useRefUpdates';
import { timeAgo, MAX_EVENT_LIMIT } from '../lib/api';
import { RefUpdateList } from '../components/events/RefUpdateList';
import { LocalPushPanel } from '../components/events/LocalPushPanel';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';
import { MicroLabel } from '../components/ui/MicroLabel';
import { Pill } from '../components/ui/Pill';

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const live = searchParams.get('live') !== 'off';
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

  const {
    events, allCount, peerCount, latest,
    totalCount, totalPages, windowStart, windowEnd, loading, error,
  } = useRefUpdates({ page, perPage, search, live });

  const listRef = useRef<HTMLDivElement>(null);
  useListNav(listRef);

  const [searchValue, setSearchValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    const inputFocused =
      typeof document !== 'undefined' && document.activeElement?.id === 'event-search';
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
        title="events"
        countNoun="events"
        description={
          <p className="m-0">
            Ref updates gossiped in from peer nodes over libp2p{' '}
            (<Circle size={6} fill="currentColor" className="inline text-accent" aria-hidden="true" /> gossip).
            Pushes received directly by this node are recorded as signed certificates on each
            repository's page — search below to find them. The feed keeps the
            latest {MAX_EVENT_LIMIT} events{live ? ' and refreshes itself every 30s' : ''}.
          </p>
        }
        cells={[
          { label: 'in feed', value: allCount > 0 ? allCount.toLocaleString() : '—' },
          { label: 'peer nodes', value: allCount > 0 ? peerCount.toLocaleString() : '—' },
          { label: 'latest', value: latest ? timeAgo(latest.timestamp) : '—' },
        ]}
      />

      <div className="pt-8 pb-20">

        {/* Toolbar: search + live toggle */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mb-4">
          <div className="flex-1 min-w-[240px] max-w-[560px]">
            <MicroLabel className="block mb-1.5">
              <label htmlFor="event-search">search</label>
            </MicroLabel>
            <Input
              id="event-search"
              value={searchValue}
              onChange={e => {
                setSearchValue(e.target.value);
                setParams({ q: e.target.value, page: null }, true);
              }}
              placeholder="search by repo, ref, or pusher…"
              autoComplete="off"
              spellCheck="false"
              variant="secondary"
              className="w-full h-9 px-3 rounded-[--radius]"
            />
          </div>

          <div>
            <MicroLabel className="block mb-1.5">feed</MicroLabel>
            <Pill
              active={live}
              onClick={() => setParams({ live: live ? 'off' : null })}
              aria-pressed={live}
              title="auto-refresh every 30s while the tab is visible"
            >
              {live ? <><Circle size={6} fill="currentColor" className="text-success inline" /> live</> : 'paused'}
            </Pill>
          </div>
        </div>

        <LocalPushPanel query={search} />

        {error ? (
          <div className="border border-border py-16 text-center">
            <p className="m-0 text-[13px] text-danger mb-4">failed to load events: {error}</p>
          </div>
        ) : (
          <>
            <div ref={listRef} className="border border-border">
              <RefUpdateList
                events={events}
                loading={loading}
                skeletonCount={Math.min(perPage, 12)}
                emptyMessage={
                  search
                    ? 'no gossip events match — pushes to this node show up under local pushes and on the repo page'
                    : 'no gossip from peer nodes yet'
                }
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
              noun="events"
            />
          </>
        )}

      </div>
    </div>
  );
}
