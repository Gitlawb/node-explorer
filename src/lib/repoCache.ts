import { fetchRepo, fetchTree, fetchCommits, mapApiRepo } from './api';
import type { Repository } from '../types/repo';

// Session cache of fully-loaded repo details (LRU, small) + hover prefetch.
// Prefetches run sequentially (fetchRepo → tree → commits) because the
// upstream node limits concurrent connections.

const MAX_ENTRIES = 20;

const cache = new Map<string, Repository>();

interface Inflight {
  promise: Promise<Repository>;
  ctrl: AbortController;
  claimed: boolean;
}
const inflight = new Map<string, Inflight>();

export function repoCacheKey(owner: string, name: string): string {
  return `${owner}/${name}`;
}

export function getCachedRepo(key: string): Repository | undefined {
  return cache.get(key);
}

export function putCachedRepo(key: string, repo: Repository): void {
  cache.delete(key); // refresh LRU position
  cache.set(key, repo);
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

export function getInflight(key: string): Promise<Repository> | undefined {
  return inflight.get(key)?.promise;
}

/** A navigation consumed this prefetch — mouseleave must no longer abort it. */
export function claimInflight(key: string): void {
  const entry = inflight.get(key);
  if (entry) entry.claimed = true;
}

export function startPrefetch(owner: string, name: string): void {
  const key = repoCacheKey(owner, name);
  if (cache.has(key) || inflight.has(key)) return;

  const ctrl = new AbortController();
  const { signal } = ctrl;
  const promise = (async () => {
    const apiRepo = await fetchRepo(owner, name, signal);
    const tree = await fetchTree(owner, name, signal);
    const commits = await fetchCommits(owner, name, signal);
    const repo = mapApiRepo(apiRepo, commits, tree);
    putCachedRepo(key, repo);
    return repo;
  })();

  inflight.set(key, { promise, ctrl, claimed: false });
  promise
    .catch(() => { /* silent — useRepository owns error UX */ })
    .finally(() => {
      if (inflight.get(key)?.promise === promise) inflight.delete(key);
    });
}

export function cancelPrefetch(key: string): void {
  const entry = inflight.get(key);
  if (entry && !entry.claimed) {
    entry.ctrl.abort();
    inflight.delete(key);
  }
}
