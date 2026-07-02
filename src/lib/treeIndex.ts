import { fetchSubtree, fetchTree } from './api';

// Background BFS walker over the repo tree (the node API is per-directory
// only — no recursive endpoint). Concurrency 2 matches the upstream
// connection-limit convention; caps keep huge repos from hammering the node.
// Shaped for useSyncExternalStore: stable snapshots, subscriber notifications.

export const MAX_INDEX_FILES = 2000;
export const MAX_INDEX_DIRS = 300;
const CONCURRENCY = 2;

export interface TreeIndex {
  files: string[];
  status: 'building' | 'done';
  partial: boolean;
}

interface InternalIndex {
  snapshot: TreeIndex;
  started: boolean;
  subscribers: Set<() => void>;
}

const indices = new Map<string, InternalIndex>();

function getEntry(repoId: string): InternalIndex {
  let entry = indices.get(repoId);
  if (!entry) {
    entry = {
      snapshot: { files: [], status: 'building', partial: false },
      started: false,
      subscribers: new Set(),
    };
    indices.set(repoId, entry);
  }
  return entry;
}

export function getTreeIndex(repoId: string): TreeIndex {
  return getEntry(repoId).snapshot;
}

export function subscribeTreeIndex(repoId: string, cb: () => void): () => void {
  const entry = getEntry(repoId);
  entry.subscribers.add(cb);
  return () => entry.subscribers.delete(cb);
}

function publish(entry: InternalIndex, update: Partial<TreeIndex>) {
  entry.snapshot = { ...entry.snapshot, ...update };
  entry.subscribers.forEach(cb => cb());
}

export function ensureTreeIndex(owner: string, name: string, repoId: string): void {
  const entry = getEntry(repoId);
  if (entry.started) return;
  entry.started = true;

  const queue: string[] = [''];
  const files: string[] = [];
  let dirsWalked = 0;
  let partial = false;
  let active = 0;
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    publish(entry, { files: [...files], status: 'done', partial });
  };

  const pump = () => {
    if (done) return;
    if (files.length >= MAX_INDEX_FILES || dirsWalked >= MAX_INDEX_DIRS) {
      partial = partial || queue.length > 0;
      queue.length = 0;
    }
    if (queue.length === 0 && active === 0) {
      finish();
      return;
    }
    while (active < CONCURRENCY && queue.length > 0) {
      const dir = queue.shift()!;
      active++;
      dirsWalked++;
      // Root uses /tree (no trailing slash); subdirs use /tree/{path}
      (dir ? fetchSubtree(owner, name, dir) : fetchTree(owner, name))
        .then(entries => {
          for (const e of entries) {
            const full = dir ? `${dir}/${e.name}` : e.name;
            if (e.type === 'blob') {
              if (files.length < MAX_INDEX_FILES) files.push(full);
              else partial = true;
            } else {
              queue.push(full);
            }
          }
          publish(entry, { files: [...files], partial });
        })
        .catch(() => {
          partial = true;
        })
        .finally(() => {
          active--;
          pump();
        });
    }
  };

  pump();
}
