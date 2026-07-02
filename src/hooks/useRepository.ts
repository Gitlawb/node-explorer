import { useState, useEffect } from 'react';
import { fetchRepo, fetchTree, fetchCommits, mapApiRepo } from '../lib/api';
import type { Repository } from '../types/repo';

interface Result {
  repo: Repository | null;
  notFound: boolean;
  loading: boolean;
  error: string | null;
}

export function useRepository(owner: string, name: string): Result {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!owner || !name) return;
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setNotFound(false);
    setError(null);
    setRepo(null);

    // Requests are sequential because the upstream limits concurrent connections.
    (async () => {
      try {
        const apiRepo = await fetchRepo(owner, name, signal);
        const treeEntries = await fetchTree(owner, name, signal);
        const commits = await fetchCommits(owner, name, signal);
        setRepo(mapApiRepo(apiRepo, commits, treeEntries));
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

  return { repo, notFound, loading, error };
}
