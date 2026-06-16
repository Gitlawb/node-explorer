const BASE_URL = '/api/v1';

export interface ApiRepo {
  id: string;
  name: string;
  owner_did: string;
  description: string;
  is_public: boolean;
  default_branch: string;
  clone_url: string;
  star_count: number;
  created_at: string;
  updated_at: string;
  forked_from: string | null;
}

export interface ApiTreeEntry {
  hash: string;
  mode: string;
  name: string;
  size: number | null;
  type: 'blob' | 'tree';
}

export interface ApiCommit {
  author: string;
  date: string;
  hash: string;
  message: string;
}

let allReposCache: ApiRepo[] | null = null;
let fetchAllPromise: Promise<ApiRepo[]> | null = null;

export function invalidateReposCache() {
  allReposCache = null;
  fetchAllPromise = null;
}

export function fetchAllRepos(): Promise<ApiRepo[]> {
  if (allReposCache !== null) return Promise.resolve(allReposCache);
  if (!fetchAllPromise) {
    fetchAllPromise = fetch(`${BASE_URL}/repos`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch repos: ${res.status}`);
        return res.json() as Promise<ApiRepo[]>;
      })
      .then(data => {
        allReposCache = data;
        fetchAllPromise = null;
        return data;
      })
      .catch(err => {
        fetchAllPromise = null;
        throw err;
      });
  }
  return fetchAllPromise;
}

export async function fetchRepo(owner: string, name: string, signal?: AbortSignal): Promise<ApiRepo> {
  const res = await fetch(
    `${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    { signal },
  );
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error(`Failed to fetch repo: ${res.status}`);
  const data = await res.json();
  if (data.error === 'repo_not_found') throw new Error('not_found');
  return data as ApiRepo;
}

export async function fetchTree(owner: string, name: string, signal?: AbortSignal): Promise<ApiTreeEntry[]> {
  const res = await fetch(
    `${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/tree`,
    { signal },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.entries as ApiTreeEntry[]) ?? [];
}

export async function fetchCommits(owner: string, name: string, signal?: AbortSignal): Promise<ApiCommit[]> {
  const res = await fetch(
    `${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits`,
    { signal },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.commits as ApiCommit[]) ?? [];
}

export async function fetchBlob(
  owner: string,
  name: string,
  path: string,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/blob/${path}`,
    { signal },
  );
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  return res.text();
}

export async function fetchSubtree(
  owner: string,
  name: string,
  subpath: string,
  signal?: AbortSignal,
): Promise<ApiTreeEntry[]> {
  const res = await fetch(
    `${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/tree/${subpath}`,
    { signal },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.entries as ApiTreeEntry[]) ?? [];
}

export async function fetchPulls(owner: string, name: string, signal?: AbortSignal): Promise<number> {
  const res = await fetch(
    `${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls`,
    { signal },
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? (data.pulls?.length ?? 0);
}

export async function fetchIssues(owner: string, name: string, signal?: AbortSignal): Promise<number> {
  const res = await fetch(
    `${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues`,
    { signal },
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? (data.issues?.length ?? 0);
}

export async function fetchEvents(owner: string, name: string, signal?: AbortSignal): Promise<number> {
  const res = await fetch(
    `${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/events`,
    { signal },
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? (data.events?.length ?? 0);
}

export async function fetchCerts(owner: string, name: string, signal?: AbortSignal): Promise<number> {
  const res = await fetch(
    `${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/certs`,
    { signal },
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? (data.certificates?.length ?? 0);
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

import type { Repository, RepoFile, RepoCommit } from '../types/repo';

export function mapTreeEntriesToFiles(entries: ApiTreeEntry[]): RepoFile[] {
  return entries.map(e => ({
    name: e.name,
    size: formatFileSize(e.size),
    type: e.type === 'blob' ? 'file' : 'dir',
  }));
}

export function mapApiRepo(
  apiRepo: ApiRepo,
  commits: ApiCommit[] = [],
  treeEntries: ApiTreeEntry[] = [],
): Repository {
  const mappedCommits: RepoCommit[] = commits.map(c => ({
    hash: c.hash,
    shortHash: c.hash.substring(0, 7),
    message: c.message,
    time: timeAgo(c.date),
    author: c.author,
  }));

  const files: RepoFile[] = treeEntries.map(e => ({
    name: e.name,
    size: formatFileSize(e.size),
    type: e.type === 'blob' ? 'file' : 'dir',
  }));

  return {
    id: apiRepo.id,
    owner: apiRepo.owner_did,
    name: apiRepo.name,
    description: apiRepo.description || '',
    branch: apiRepo.default_branch,
    updatedAt: timeAgo(apiRepo.updated_at),
    createdAt: formatDate(apiRepo.created_at),
    stars: apiRepo.star_count,
    visibility: apiRepo.is_public ? 'public' : 'private',
    isMirror: apiRepo.forked_from !== null,
    latestCommit: mappedCommits[0],
    commits: mappedCommits,
    files,
    cloneUrl: apiRepo.clone_url,
  };
}
