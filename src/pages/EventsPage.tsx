import { Radio } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useCallback, useRef, useState } from 'react';
import { SearchField } from '../components/register/SearchField';
import { useListNav } from '../hooks/useShortcuts';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import { useRefUpdates } from '../hooks/useRefUpdates';
import { timeAgo, MAX_EVENT_LIMIT } from '../lib/api';
import { RefUpdateList } from '../components/events/RefUpdateList';
import { LocalPushPanel } from '../components/events/LocalPushPanel';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';

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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

      <RepoHero
        totalCount={totalCount}
        page={page}
        perPage={perPage}
        windowStart={windowStart}
        windowEnd={windowEnd}
        title="Events"
        countNoun="events"
        description={
          <p className="m-0">
            Ref updates gossiped in from peer nodes over libp2p{' '}
            (<Radio size={12} className="inline text-accent align-[-1px]" aria-hidden="true" /> gossip).
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

        {/* Toolbar: one row — a search field with its icon inside, and the
            live/paused state as a single toggle rather than a labelled chip. */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <SearchField
            id="event-search"
            label="Search events"
            value={searchValue}
            onChange={v => {
              setSearchValue(v);
              setParams({ q: v, page: null }, true);
            }}
            placeholder="Search by repo, ref, or pusher…"
            className="flex-1 max-w-[560px]"
          />

          <button
            type="button"
            onClick={() => setParams({ live: live ? 'off' : null })}
            aria-pressed={live}
            title="Auto-refresh every 30s while the tab is visible"
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px]',
              'transition-colors',
              live
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-border text-muted hover:text-foreground',
            )}
          >
            <span className="relative flex size-2">
              {live && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
              )}
              <span
                className={cn(
                  'relative inline-flex size-2 rounded-full',
                  live ? 'bg-success' : 'bg-muted',
                )}
              />
            </span>
            {live ? 'Live' : 'Paused'}
          </button>
        </div>

        <LocalPushPanel query={search} />

        {error ? (
          <div className="border-t border-border py-16 text-center">
            <p className="m-0 text-[14px] text-danger">Failed to load events: {error}</p>
          </div>
        ) : (
          <>
            {/* No wrapper: each event is its own card, so a container border
                around them stacks a box on top of a stack of boxes. */}
            <div ref={listRef}>
              <RefUpdateList
                events={events}
                loading={loading}
                skeletonCount={Math.min(perPage, 12)}
                emptyMessage={
                  search
                    ? 'No gossip events match — pushes to this node appear under local pushes and on the repo page'
                    : 'No gossip from peer nodes yet'
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
