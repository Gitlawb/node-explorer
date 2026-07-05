import { useSearchParams } from 'react-router-dom';
import { useCallback, useRef, useState } from 'react';
import { useListNav } from '../hooks/useShortcuts';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import { usePeers } from '../hooks/usePeers';
import { useRefreshKey } from '../hooks/useRefreshKey';
import { PeerList } from '../components/peers/PeerList';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';
import { MicroLabel } from '../components/ui/MicroLabel';
import { Pill } from '../components/ui/Pill';
import { CopyButton } from '../components/ui/CopyButton';
import { cn } from '../lib/utils';

export default function PeersPage() {
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

  const {
    peers, p2p, allCount, reachableCount,
    totalCount, totalPages, windowStart, windowEnd, loading, error,
  } = usePeers({ page, perPage, search, refreshKey });

  const listRef = useRef<HTMLDivElement>(null);
  useListNav(listRef);

  const [searchValue, setSearchValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    const inputFocused =
      typeof document !== 'undefined' && document.activeElement?.id === 'peer-search';
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
        title="peers."
        indexLabel="peer directory"
        countNoun="peers"
        description={
          <p className="m-0">
            Other gitlawb nodes this node has discovered. Peers announce over HTTP, exchange{' '}
            <code className="text-warm-text">ref-update</code> gossip on libp2p, and replicate
            repos across the federation. Ping any peer to check it live.
          </p>
        }
        cells={[
          { label: 'known peers', value: allCount > 0 ? allCount.toLocaleString() : '—' },
          { label: 'reachable', value: allCount > 0 ? reachableCount.toLocaleString() : '—' },
          { label: 'unreachable', value: allCount > 0 ? (allCount - reachableCount).toLocaleString() : '—' },
          {
            label: 'gossip mesh',
            value: p2p?.enabled
              ? String(p2p.connected_peers ?? p2p.gossipsub_all_peers ?? 0)
              : p2p ? 'off' : '—',
          },
        ]}
      />

      <div className="pt-8 pb-20">

        {/* P2P identity strip */}
        {p2p?.enabled && p2p.peer_id && (
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap border border-border px-4 sm:px-6 py-3 mb-6">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="text-[8px] text-ok">◆</span>
              <MicroLabel>libp2p</MicroLabel>
            </span>
            <span className="text-[12px] text-muted-foreground truncate" title={p2p.peer_id}>
              {p2p.peer_id.slice(0, 12)}…{p2p.peer_id.slice(-8)}
            </span>
            <CopyButton value={p2p.peer_id} label="peer id" />
            {(p2p.topics ?? []).map(t => (
              <span key={t} className="text-[10px] text-warm-text border border-border-inner rounded-[2px] px-1.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="max-w-[560px] mb-4">
          <MicroLabel className="block mb-1.5">
            <label htmlFor="peer-search">search</label>
          </MicroLabel>
          <input
            id="peer-search"
            type="search"
            value={searchValue}
            onChange={e => {
              setSearchValue(e.target.value);
              setParams({ q: e.target.value, page: null }, true);
            }}
            placeholder="search by did or host…"
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

        {error ? (
          <div className="border border-border py-16 text-center">
            <p className="m-0 text-[13px] text-destructive mb-4">failed to load peers: {error}</p>
            <Pill onClick={refresh}>retry</Pill>
          </div>
        ) : (
          <>
            <div ref={listRef}>
              <PeerList peers={peers} loading={loading} skeletonCount={Math.min(perPage, 12)} />
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
              noun="peers"
            />
          </>
        )}

      </div>
    </div>
  );
}
