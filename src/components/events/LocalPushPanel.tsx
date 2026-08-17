import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Circle } from 'lucide-react';
import {
  fetchRepos, fetchEvents, didKeySegment, shortDid, shortRefName, shortSha, timeAgo,
} from '../../lib/api';
import type { ApiRepo, ApiRepoEvent } from '../../lib/api';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { MicroLabel } from '../ui/MicroLabel';

interface RepoPushes {
  repo: ApiRepo;
  pushes: ApiRepoEvent[];
}

const MAX_REPOS = 3;
const MAX_PUSHES_PER_REPO = 3;
// The node's /repos endpoint has no server-side text search (the `q` param is
// behind SERVER_SEARCH_ENABLED and unsupported by the node today), so match
// against one page of the most-recently-updated repos — a freshly pushed repo,
// the case this panel exists for, is at the top of that ordering.
const SEARCH_WINDOW = 200;

function matchesQuery(repo: ApiRepo, q: string): boolean {
  return (
    repo.name.toLowerCase().includes(q) ||
    (repo.description ?? '').toLowerCase().includes(q) ||
    repo.owner_did.toLowerCase().includes(q)
  );
}

/**
 * Local pushes matching the current search, looked up from repo records.
 *
 * The global ref-updates feed only carries gossip from peer nodes, so a push
 * received directly by this node never appears in it. Without this panel a
 * search for a freshly pushed repo comes up empty and reads as a failed
 * write. One bounded repo lookup per (debounced) search term.
 */
export function LocalPushPanel({ query }: { query: string }) {
  const debounced = useDebouncedValue(query.trim(), 300);
  // Keyed by the query it answers, so a stale result never renders for a new
  // search and the effect needs no synchronous reset.
  const [loaded, setLoaded] = useState<{ forQuery: string; data: RepoPushes[] } | null>(null);

  useEffect(() => {
    if (!debounced) return;

    const controller = new AbortController();
    (async () => {
      const { repos } = await fetchRepos({
        limit: SEARCH_WINDOW, offset: 0, signal: controller.signal,
      });
      const q = debounced.toLowerCase();
      const matches = repos.filter(repo => matchesQuery(repo, q)).slice(0, MAX_REPOS);
      const withPushes = await Promise.all(
        matches.map(async repo => {
          const events = await fetchEvents(
            didKeySegment(repo.owner_did), repo.name, controller.signal,
          ).catch(() => []);
          return {
            repo,
            pushes: events.filter(e => e.source === 'local').slice(0, MAX_PUSHES_PER_REPO),
          };
        }),
      );
      if (!controller.signal.aborted) setLoaded({ forQuery: debounced, data: withPushes });
    })().catch(() => {
      // Best-effort panel: a failed lookup just leaves the gossip list alone.
    });
    return () => controller.abort();
  }, [debounced]);

  const results = loaded && loaded.forQuery === debounced ? loaded.data : null;
  if (!debounced || results === null || results.length === 0) return null;

  return (
    <div className="border border-border mb-4">
      <div className="flex items-baseline gap-3 px-4 sm:px-6 h-10 border-b border-border bg-surface">
        <MicroLabel>local pushes</MicroLabel>
        <span className="text-[11px] text-muted">
          signed certificates from matching repos — these never appear in the gossip feed below
        </span>
      </div>
      <ul className="m-0 p-0 list-none">
        {results.map(({ repo, pushes }) => {
          const ownerKey = didKeySegment(repo.owner_did);
          return (
            <li key={repo.id} className="px-4 sm:px-6 py-3 border-b border-separator last:border-b-0">
              <Link
                to={`/repos/${encodeURIComponent(ownerKey)}/${encodeURIComponent(repo.name)}`}
                className="text-[13px] font-bold text-foreground hover:text-accent transition-colors"
              >
                {shortDid(repo.owner_did)}/{repo.name}
              </Link>
              {pushes.length === 0 ? (
                <p className="m-0 mt-1 text-[12px] text-muted">no pushes recorded yet</p>
              ) : (
                <ul className="m-0 mt-1 p-0 list-none flex flex-col gap-1">
                  {pushes.map(push => (
                    <li key={push.id} className="flex flex-wrap items-baseline gap-x-3 text-[12px] text-muted">
                      <span aria-hidden="true" className="text-success self-center">
                        <Circle size={6} fill="currentColor" />
                      </span>
                      <span>{shortRefName(push.ref_name)}</span>
                      <span className="tabular-nums">
                        {push.old_sha.startsWith('0000000')
                          ? `new · ${shortSha(push.new_sha)}`
                          : `${shortSha(push.old_sha)} → ${shortSha(push.new_sha)}`}
                      </span>
                      <span className="truncate max-w-[220px]" title={push.id}>cert {push.id.slice(0, 8)}</span>
                      <span title={push.pusher_did}>{shortDid(push.pusher_did)}</span>
                      <span className="tabular-nums">{timeAgo(push.timestamp)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
