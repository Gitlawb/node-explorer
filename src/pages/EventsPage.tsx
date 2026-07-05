import { useSearchParams } from 'react-router-dom';
import { useCallback, useRef, useState } from 'react';
import { useListNav } from '../hooks/useShortcuts';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import { useRefUpdates } from '../hooks/useRefUpdates';
import type { EventSourceFilter } from '../hooks/useRefUpdates';
import { useRefreshKey } from '../hooks/useRefreshKey';
import { timeAgo, MAX_EVENT_LIMIT } from '../lib/api';
import { RefUpdateList } from '../components/events/RefUpdateList';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';
import { MicroLabel } from '../components/ui/MicroLabel';
import { Pill } from '../components/ui/Pill';
import { cn } from '../lib/utils';

const SOURCES: EventSourceFilter[] = ['all', 'local', 'gossip'];

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const rawSource = searchParams.get('src') as EventSourceFilter | null;
  const source: EventSourceFilter = rawSource && SOURCES.includes(rawSource) ? rawSource : 'all';
  const live = searchParams.get('live') !== 'off';
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

  const {
    events, allCount, gossipCount, latest,
    totalCount, totalPages, windowStart, windowEnd, loading, error,
  } = useRefUpdates({ page, perPage, search, source, live, refreshKey });

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
        refreshing={loading}
        onRefresh={refresh}
        title="events."
        indexLabel="ref-update feed"
        countNoun="events"
        description={
          <p className="m-0">
            Every ref update this node knows about — pushes it received directly{' '}
            (<span aria-hidden="true" className="text-status-dot">◆</span> local) and updates gossiped
            in from peer nodes over libp2p{' '}
            (<span aria-hidden="true" className="text-warm">◆</span> gossip). The feed keeps the
            latest {MAX_EVENT_LIMIT} events{live ? ' and refreshes itself every 30s' : ''}.
          </p>
        }
        cells={[
          { label: 'in feed', value: allCount > 0 ? allCount.toLocaleString() : '—' },
          { label: 'local', value: allCount > 0 ? (allCount - gossipCount).toLocaleString() : '—' },
          { label: 'gossip', value: allCount > 0 ? gossipCount.toLocaleString() : '—' },
          { label: 'latest', value: latest ? timeAgo(latest.timestamp) : '—' },
        ]}
      />

      <div className="pt-8 pb-20">

        {/* Toolbar: search + source filter + live toggle */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mb-4">
          <div className="flex-1 min-w-[240px] max-w-[560px]">
            <MicroLabel className="block mb-1.5">
              <label htmlFor="event-search">search</label>
            </MicroLabel>
            <input
              id="event-search"
              type="search"
              value={searchValue}
              onChange={e => {
                setSearchValue(e.target.value);
                setParams({ q: e.target.value, page: null }, true);
              }}
              placeholder="search by repo, ref, or pusher…"
              autoComplete="off"
              spellCheck={false}
              className={cn(
                'w-full h-9 px-3 text-[13px] bg-transparent border border-border rounded-[2px]',
                'text-foreground placeholder:text-dim',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-warm focus:border-dim',
                'transition-colors',
              )}
            />
          </div>

          <div>
            <MicroLabel className="block mb-1.5">source</MicroLabel>
            <div className="flex gap-1.5">
              {SOURCES.map(s => (
                <Pill
                  key={s}
                  active={source === s}
                  onClick={() => setParams({ src: s === 'all' ? null : s, page: null })}
                  aria-pressed={source === s}
                >
                  {s}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <MicroLabel className="block mb-1.5">feed</MicroLabel>
            <Pill
              active={live}
              onClick={() => setParams({ live: live ? 'off' : null })}
              aria-pressed={live}
              title="auto-refresh every 30s while the tab is visible"
            >
              {live ? '◆ live' : 'paused'}
            </Pill>
          </div>
        </div>

        {error ? (
          <div className="border border-border py-16 text-center">
            <p className="m-0 text-[13px] text-destructive mb-4">failed to load events: {error}</p>
            <Pill onClick={refresh}>retry</Pill>
          </div>
        ) : (
          <>
            <div ref={listRef} className="border border-border">
              <RefUpdateList
                events={events}
                loading={loading}
                skeletonCount={Math.min(perPage, 12)}
                emptyMessage={
                  search || source !== 'all'
                    ? 'no events match'
                    : 'no ref updates yet — push a repo to this node to see activity'
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
