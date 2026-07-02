import { useState, useEffect } from 'react';
import { fetchRepo, fetchTree, fetchCommits, mapApiRepo } from '../lib/api';
import { getCachedRepo, putCachedRepo, getInflight, claimInflight, repoCacheKey } from '../lib/repoCache';
import type { Repository } from '../types/repo';

interface Result {
  repo: Repository | null;
  notFound: boolean;
  loading: boolean;
  error: string | null;
  /** Set when the repo loaded but tree/commits could not be fetched */
  partialError: string | null;
}

export function useRepository(owner: string, name: string): Result {
  const repoKey = repoCacheKey(owner, name);

  // Session cache (hover prefetch / recently visited) serves instantly with
  // zero loading frame.
  const [repo, setRepo] = useState<Repository | null>(() => getCachedRepo(repoKey) ?? null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(() => !getCachedRepo(repoKey));
  const [error, setError] = useState<string | null>(null);
  const [partialError, setPartialError] = useState<string | null>(null);

  // Render-phase reset when the target repo changes (react-hooks/set-state-in-effect)
  const [prevRepoKey, setPrevRepoKey] = useState(repoKey);
  if (prevRepoKey !== repoKey) {
    setPrevRepoKey(repoKey);
    const cached = getCachedRepo(repoKey) ?? null;
    setRepo(cached);
    setLoading(!cached);
    setNotFound(false);
    setError(null);
    setPartialError(null);
  }

  useEffect(() => {
    if (!owner || !name) return;
    if (getCachedRepo(repoKey)) return; // served from cache — no revalidation

    const controller = new AbortController();
    const { signal } = controller;

    // A hover prefetch may already be in flight — consume it instead of
    // duplicating the request chain.
    const inflight = getInflight(repoKey);
    if (inflight) {
      claimInflight(repoKey);
      let cancelled = false;
      inflight
        .then(result => {
          if (!cancelled) {
            setRepo(result);
            setLoading(false);
          }
        })
        .catch(() => {
          // Prefetch failed — fall through to a normal fetch on next render
          // is complex; just surface the standard error path by refetching.
          if (!cancelled) runFetch();
        });
      return () => { cancelled = true; };
    }

    function runFetch() {
      // Requests are sequential because the upstream limits concurrent connections.
      (async () => {
        try {
          const apiRepo = await fetchRepo(owner, name, signal);
          let treeEntries: Awaited<ReturnType<typeof fetchTree>> = [];
          let commits: Awaited<ReturnType<typeof fetchCommits>> = [];
          const partials: string[] = [];
          try {
            treeEntries = await fetchTree(owner, name, signal);
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            partials.push('file tree');
          }
          try {
            commits = await fetchCommits(owner, name, signal);
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            partials.push('commits');
          }
          const mapped = mapApiRepo(apiRepo, commits, treeEntries);
          // Only clean loads enter the session cache
          if (partials.length === 0) putCachedRepo(repoKey, mapped);
          setRepo(mapped);
          setPartialError(partials.length ? `failed to load ${partials.join(' and ')}` : null);
          setLoading(false);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          if (err instanceof Error && err.message === 'not_found') {
            setNotFound(true);
          } else {
            setError(err instanceof Error ? err.message : 'Failed to load repository');
          }
          setLoading(false);
        }
      })();
    }

    runFetch();
    return () => { controller.abort(); };
  }, [owner, name, repoKey]);

  return { repo, notFound, loading, error, partialError };
}
