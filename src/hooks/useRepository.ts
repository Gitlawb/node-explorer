import { useState, useEffect } from 'react';
import { fetchRepo, fetchTree, fetchCommits, mapApiRepo } from '../lib/api';
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
  const [repo, setRepo] = useState<Repository | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partialError, setPartialError] = useState<string | null>(null);

  // Render-phase reset when the target repo changes (react-hooks/set-state-in-effect)
  const repoKey = `${owner}/${name}`;
  const [prevRepoKey, setPrevRepoKey] = useState(repoKey);
  if (prevRepoKey !== repoKey) {
    setPrevRepoKey(repoKey);
    setLoading(true);
    setNotFound(false);
    setError(null);
    setPartialError(null);
    setRepo(null);
  }

  useEffect(() => {
    if (!owner || !name) return;
    const controller = new AbortController();
    const { signal } = controller;

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
        setRepo(mapApiRepo(apiRepo, commits, treeEntries));
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

    return () => { controller.abort(); };
  }, [owner, name]);

  return { repo, notFound, loading, error, partialError };
}
