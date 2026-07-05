const BASE_URL = '/api/v1';

/**
 * Server-side search/sort is only available on nodes that support q=/sort= on
 * GET /repos. This is an explicit flag rather than feature detection: older
 * nodes silently ignore unknown query params, which would make a search appear
 * to return everything.
 */
export const SERVER_SEARCH_ENABLED = import.meta.env.VITE_SERVER_SEARCH === 'true';

export type RepoSort = 'updated' | 'created' | 'oldest' | 'name' | 'stars';

export interface ApiRepo {
  id: string;
  name: string;
  owner_did: string;
  description: string | null;
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

export interface ApiIssue {
  id: string;
  title: string;
  body: string;
  author: string;
  created_at: string;
  status: string;
}

export interface ApiPull {
  id: string;
  number: number;
  title: string;
  body: string;
  author_did: string;
  source_branch: string;
  target_branch: string;
  status: string;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiRepoEvent {
  type: string;
  id: string;
  repo: string;
  ref_name: string;
  old_sha: string;
  new_sha: string;
  pusher_did: string;
  node_did: string;
  timestamp: string;
  source: string;
}

export interface ApiCert {
  id: string;
  repo_id: string;
  ref_name: string;
  old_sha: string;
  new_sha: string;
  pusher_did: string;
  node_did: string;
  signature: string;
  issued_at: string;
}

export interface ApiAgent {
  did: string;
  capabilities: string[];
  trust_score: number;
  status: string;
  last_seen: string | null;
  registered_at: string;
}

export interface NodeStats {
  agents: number;
  pushes: number;
  repos: number;
  version: string;
}

export interface ApiPeer {
  did: string;
  http_url: string;
  last_seen: string | null;
  reachable: boolean;
}

export interface P2PInfo {
  enabled: boolean;
  peer_id?: string;
  topics?: string[];
  connected_peers?: number | null;
  gossipsub_mesh_peers?: number | null;
  gossipsub_all_peers?: number | null;
  listen_addrs?: string[] | null;
}

/** Node-level ref-update event from GET /events/ref-updates. */
export interface ApiRefUpdate {
  id: string;
  node_did: string;
  pusher_did: string;
  /** "{full_owner_key}/{repo_name}" — see parseEventRepo. */
  repo: string;
  ref_name: string;
  old_sha: string;
  new_sha: string;
  timestamp: string;
  cert_id: string | null;
  received_at: string;
  /** null/empty for pushes received by this node; set when gossiped from a peer. */
  from_peer: string | null;
}

export type TaskStatus = 'pending' | 'claimed' | 'completed' | 'failed';

export interface ApiTask {
  id: string;
  repo_id: string | null;
  kind: string;
  status: TaskStatus | string;
  delegator_did: string;
  assignee_did: string | null;
  capability: string;
  ucan_token: string | null;
  payload: string | null;
  result: string | null;
  created_at: string;
  updated_at: string;
  deadline: string | null;
}

export interface NodeInfo {
  name: string;
  did: string;
  version: string;
  network: string;
  protocols: string[];
  p2p_peer_id?: string | null;
}

export interface RepoListParams {
  limit: number;
  offset: number;
  owner?: string;
  q?: string;
  sort?: RepoSort;
  signal?: AbortSignal;
}

export interface RepoListResult {
  repos: ApiRepo[];
  totalCount: number;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchRepos(params: RepoListParams): Promise<RepoListResult> {
  const search = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.owner) search.set('owner', params.owner);
  if (params.q) search.set('q', params.q);
  if (params.sort && params.sort !== 'updated') search.set('sort', params.sort);

  const res = await fetch(`${BASE_URL}/repos?${search}`, { signal: params.signal });
  if (!res.ok) throw new Error(`Failed to fetch repos: ${res.status}`);
  const repos = (await res.json()) as ApiRepo[];
  const totalHeader = res.headers.get('X-Total-Count');
  const totalCount = totalHeader !== null ? Number(totalHeader) : repos.length;
  return { repos, totalCount };
}

export function fetchStats(signal?: AbortSignal): Promise<NodeStats> {
  return getJson<NodeStats>(`${BASE_URL}/stats`, signal);
}

export function fetchNodeInfo(signal?: AbortSignal): Promise<NodeInfo> {
  // Proxied to the node's root path (see vite.config.ts) — the SPA owns "/" locally.
  return getJson<NodeInfo>('/node-info', signal);
}

export async function fetchAgents(signal?: AbortSignal): Promise<ApiAgent[]> {
  const data = await getJson<{ agents: ApiAgent[] }>(`${BASE_URL}/agents`, signal);
  return data.agents ?? [];
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

function repoPath(owner: string, name: string, rest = ''): string {
  return `${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}${rest}`;
}

export async function fetchTree(owner: string, name: string, signal?: AbortSignal): Promise<ApiTreeEntry[]> {
  const data = await getJson<{ entries?: ApiTreeEntry[] }>(repoPath(owner, name, '/tree'), signal);
  return data.entries ?? [];
}

export async function fetchCommits(owner: string, name: string, signal?: AbortSignal): Promise<ApiCommit[]> {
  const data = await getJson<{ commits?: ApiCommit[] }>(repoPath(owner, name, '/commits'), signal);
  return data.commits ?? [];
}

export const MAX_INLINE_BYTES = 1_048_576; // 1 MB
// NOT svg — the blob endpoint serves octet-stream and browsers refuse to
// render SVG in <img> without an image/svg+xml content-type.
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'];

export function blobUrl(owner: string, name: string, path: string): string {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return repoPath(owner, name, `/blob/${encoded}`);
}

export type BlobKind = 'text' | 'image' | 'binary' | 'toolarge';

export interface BlobResult {
  kind: BlobKind;
  /** Only set for kind 'text' */
  content?: string;
  /** Raw blob URL (same-origin via proxy) — <img> src / raw / download link */
  url: string;
  size: number;
  sizeLabel: string;
}

/**
 * Fetch and classify a blob. The node guesses content-type from the file
 * extension, so classification relies on extension + NUL-byte sniffing only
 * (mirrors the gitlawb.com web implementation).
 */
export async function getBlob(
  owner: string,
  name: string,
  path: string,
  opts: { force?: boolean; signal?: AbortSignal } = {},
): Promise<BlobResult> {
  const url = blobUrl(owner, name, path);
  const res = await fetch(url, { signal: opts.signal });
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);

  const declaredSize = Number(res.headers.get('content-length') ?? '0');
  const ext = (path.toLowerCase().split('.').pop() ?? '');

  // Image check precedes the size guard: large images still render via <img>.
  if (IMAGE_EXTENSIONS.includes(ext)) {
    void res.body?.cancel();
    return { kind: 'image', url, size: declaredSize, sizeLabel: formatFileSize(declaredSize || null) };
  }

  if (declaredSize > MAX_INLINE_BYTES && !opts.force) {
    void res.body?.cancel();
    return { kind: 'toolarge', url, size: declaredSize, sizeLabel: formatFileSize(declaredSize) };
  }

  const buf = await res.arrayBuffer();
  const size = declaredSize || buf.byteLength;
  if (size > MAX_INLINE_BYTES && !opts.force) {
    return { kind: 'toolarge', url, size, sizeLabel: formatFileSize(size) };
  }

  const head = new Uint8Array(buf.slice(0, 8192));
  if (head.includes(0)) {
    return { kind: 'binary', url, size, sizeLabel: formatFileSize(size) };
  }

  return {
    kind: 'text',
    content: new TextDecoder('utf-8').decode(buf),
    url,
    size,
    sizeLabel: formatFileSize(size),
  };
}

export async function fetchSubtree(
  owner: string,
  name: string,
  subpath: string,
  signal?: AbortSignal,
): Promise<ApiTreeEntry[]> {
  const data = await getJson<{ entries?: ApiTreeEntry[] }>(repoPath(owner, name, `/tree/${subpath}`), signal);
  return data.entries ?? [];
}

export async function fetchPulls(owner: string, name: string, signal?: AbortSignal): Promise<ApiPull[]> {
  const data = await getJson<{ pulls?: ApiPull[] }>(repoPath(owner, name, '/pulls'), signal);
  return data.pulls ?? [];
}

export async function fetchIssues(owner: string, name: string, signal?: AbortSignal): Promise<ApiIssue[]> {
  const data = await getJson<{ issues?: ApiIssue[] }>(repoPath(owner, name, '/issues'), signal);
  return data.issues ?? [];
}

export async function fetchEvents(owner: string, name: string, signal?: AbortSignal): Promise<ApiRepoEvent[]> {
  const data = await getJson<{ events?: ApiRepoEvent[] }>(repoPath(owner, name, '/events?limit=50'), signal);
  return data.events ?? [];
}

export async function fetchCerts(owner: string, name: string, signal?: AbortSignal): Promise<ApiCert[]> {
  const data = await getJson<{ certificates?: ApiCert[] }>(repoPath(owner, name, '/certs'), signal);
  return data.certificates ?? [];
}

export async function fetchPeers(signal?: AbortSignal): Promise<ApiPeer[]> {
  const data = await getJson<{ peers?: ApiPeer[] }>(`${BASE_URL}/peers`, signal);
  return data.peers ?? [];
}

export function fetchP2PInfo(signal?: AbortSignal): Promise<P2PInfo> {
  return getJson<P2PInfo>(`${BASE_URL}/p2p/info`, signal);
}

export async function pingPeer(did: string, signal?: AbortSignal): Promise<boolean> {
  const data = await getJson<{ reachable?: boolean }>(
    `${BASE_URL}/peers/${encodeURIComponent(did)}/ping`,
    signal,
  );
  return data.reachable === true;
}

// Server clamps ref-update limit to 200 (node: api/events.rs).
export const MAX_EVENT_LIMIT = 200;

export async function fetchRefUpdates(limit = MAX_EVENT_LIMIT, signal?: AbortSignal): Promise<ApiRefUpdate[]> {
  const data = await getJson<{ events?: ApiRefUpdate[] }>(
    `${BASE_URL}/events/ref-updates?limit=${limit}`,
    signal,
  );
  return data.events ?? [];
}

export interface TaskListParams {
  status?: TaskStatus;
  limit?: number;
  signal?: AbortSignal;
}

export async function fetchTasks({ status, limit = 200, signal }: TaskListParams = {}): Promise<ApiTask[]> {
  const search = new URLSearchParams({ limit: String(limit) });
  if (status) search.set('status', status);
  const data = await getJson<{ tasks?: ApiTask[] }>(`${BASE_URL}/tasks?${search}`, signal);
  return data.tasks ?? [];
}

export async function fetchTask(id: string, signal?: AbortSignal): Promise<ApiTask> {
  const res = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(id)}`, { signal });
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error(`Failed to fetch task: ${res.status}`);
  return res.json() as Promise<ApiTask>;
}

/** Short display form of a DID: last segment after ':', truncated (mockups show `z6Mkv79S/`). */
export function shortDid(did: string): string {
  const seg = did.split(':').pop() ?? did;
  return seg.length > 8 ? seg.slice(0, 8) : seg;
}

/** Full key segment of a DID (after the last ':') — accepted by the API's owner= filter. */
export function didKeySegment(did: string): string {
  return did.split(':').pop() ?? did;
}

/**
 * Middle-truncated DID for display: keeps the scheme prefix intact and
 * shortens only the key segment (`did:key:z6Mkn…xXxYk`). Copy actions must
 * still use the full DID.
 */
export function truncateDid(did: string, head = 5, tail = 5): string {
  const splitAt = did.lastIndexOf(':') + 1;
  const prefix = did.slice(0, splitAt);
  const key = did.slice(splitAt);
  if (key.length <= head + tail + 1) return did;
  return `${prefix}${key.slice(0, head)}…${key.slice(-tail)}`;
}

/** Trust tiers mirror the node's agents.rs thresholds. */
export function trustTier(score: number): string {
  if (score < 0.1) return 'newcomer';
  if (score < 0.3) return 'contributor';
  if (score < 0.7) return 'trusted';
  return 'maintainer';
}

export function shortSha(sha: string): string {
  return sha ? sha.slice(0, 7) : '—';
}

/** Host (and non-default port) of a peer URL, for compact display. */
export function peerHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

/** `refs/heads/main` → `main`; other refs lose only the `refs/` prefix. */
export function shortRefName(ref: string): string {
  if (ref.startsWith('refs/heads/')) return ref.slice('refs/heads/'.length);
  if (ref.startsWith('refs/')) return ref.slice('refs/'.length);
  return ref;
}

/** An event is "gossip" when it arrived from a peer rather than a local push. */
export function isGossip(event: Pick<ApiRefUpdate, 'from_peer'>): boolean {
  return Boolean(event.from_peer);
}

export interface EventRepoRef {
  /** Full DID usable in /repos/:owner/:name links (`did:key:` + key part). */
  ownerDid: string;
  name: string;
  /** Short owner segment for display (`z6Mkv79S/name`). */
  label: string;
}

/**
 * Ref-update events store repo as "{full_owner_key}/{repo_name}" (node:
 * api/events.rs). Returns null when the field doesn't match that shape.
 */
export function parseEventRepo(repo: string): EventRepoRef | null {
  const slash = repo.indexOf('/');
  if (slash <= 0 || slash === repo.length - 1) return null;
  const key = repo.slice(0, slash);
  const name = repo.slice(slash + 1);
  return {
    ownerDid: key.startsWith('did:') ? key : `did:key:${key}`,
    name,
    label: `${key.length > 8 ? key.slice(0, 8) : key}/${name}`,
  };
}

/**
 * Human title for a task: agents put a `title` in the JSON payload; fall back
 * to the task kind when absent or unparseable.
 */
export function taskTitle(task: Pick<ApiTask, 'kind' | 'payload'>): string {
  if (task.payload) {
    try {
      const parsed: unknown = JSON.parse(task.payload);
      if (parsed && typeof parsed === 'object' && 'title' in parsed) {
        const title = (parsed as { title: unknown }).title;
        if (typeof title === 'string' && title.trim()) return title;
      }
    } catch { /* fall through to kind */ }
  }
  return task.kind;
}

/** Pretty-print a JSON string for display; returns the input when not JSON. */
export function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
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
    dateRaw: c.date,
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
    files: mapTreeEntriesToFiles(treeEntries),
    cloneUrl: apiRepo.clone_url,
    updatedAtRaw: apiRepo.updated_at,
    createdAtRaw: apiRepo.created_at,
  };
}
