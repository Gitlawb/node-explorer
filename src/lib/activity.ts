import { fetchCommits } from './api';
import { getCachedRepo, repoCacheKey } from './repoCache';

// Weekly commit-activity buckets for the repo list sparklines.
// The node's /commits endpoint returns at most the 30 most recent commits,
// so this is a "recent activity" window, not full history.

export const ACTIVITY_WEEKS = 12;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Bucket ISO commit dates into weekly counts, oldest → newest. */
export function bucketCommitDates(
  dates: string[],
  now: number,
  weeks: number = ACTIVITY_WEEKS,
): number[] {
  const buckets = new Array<number>(weeks).fill(0);
  for (const iso of dates) {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) continue;
    // Future dates (clock skew between node and client) count as this week.
    const age = Math.max(0, now - t);
    const idx = weeks - 1 - Math.floor(age / WEEK_MS);
    if (idx >= 0) buckets[idx]++;
  }
  return buckets;
}

const cache = new Map<string, number[]>();
const inflight = new Map<string, Promise<number[]>>();

// The node limits concurrent connections (see repoCache.ts), so list-page
// activity fetches funnel through a small slot pool instead of firing one
// request per visible row at once.
const MAX_CONCURRENT = 2;
let active = 0;
const waiting: Array<() => void> = [];

async function withSlot<T>(job: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>(resolve => waiting.push(resolve));
  }
  active++;
  try {
    return await job();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

export function getCachedActivity(owner: string, name: string): number[] | undefined {
  return cache.get(repoCacheKey(owner, name));
}

/**
 * Load weekly activity buckets for a repo. Deduped per repo and cached for
 * the session; a hover-prefetched repo (repoCache) resolves without a fetch.
 * Errors resolve to an empty array — the sparkline is decorative, so a repo
 * whose commits can't load renders as "no data" rather than retrying.
 */
export function loadActivity(owner: string, name: string): Promise<number[]> {
  const key = repoCacheKey(owner, name);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const prefetched = getCachedRepo(key);
    const dates = prefetched
      ? prefetched.commits.flatMap(c => (c.dateRaw ? [c.dateRaw] : []))
      : (await withSlot(() => fetchCommits(owner, name))).map(c => c.date);
    return bucketCommitDates(dates, Date.now());
  })()
    .catch(() => [] as number[])
    .then(buckets => {
      cache.set(key, buckets);
      return buckets;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
