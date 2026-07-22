const REPOSITORY_API_ORIGIN = 'https://node.gitlawb.com';
const REPOSITORY_FETCH_TIMEOUT_MS = 3_500;

export interface ApiRepository {
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

export type RepositoryFetchResult =
  | { status: 'ok'; repository: ApiRepository }
  | { status: 'not_found' }
  | {
      status: 'error';
      reason: 'timeout' | 'aborted' | 'upstream' | 'invalid_response';
      upstreamStatus?: number;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiRepository(value: unknown): value is ApiRepository {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.owner_did === 'string'
    && (typeof value.description === 'string' || value.description === null)
    && typeof value.is_public === 'boolean'
    && typeof value.default_branch === 'string'
    && typeof value.clone_url === 'string'
    && typeof value.star_count === 'number'
    && Number.isFinite(value.star_count)
    && typeof value.created_at === 'string'
    && typeof value.updated_at === 'string'
    && (typeof value.forked_from === 'string' || value.forked_from === null)
  );
}

/**
 * Fetches just the repository record used by repository metadata and OG images.
 * Expected upstream failures are returned as data so callers can safely render
 * a generic response without leaking an upstream error page.
 */
export async function fetchRepository(
  owner: string,
  name: string,
  signal?: AbortSignal,
): Promise<RepositoryFetchResult> {
  const controller = new AbortController();
  let timedOut = false;

  const abortFromCaller = () => controller.abort(signal?.reason);
  if (signal?.aborted) abortFromCaller();
  else signal?.addEventListener('abort', abortFromCaller, { once: true });

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error('Repository request timed out'));
  }, REPOSITORY_FETCH_TIMEOUT_MS);

  const repositoryUrl = new URL(
    `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    REPOSITORY_API_ORIGIN,
  );

  try {
    const response = await fetch(repositoryUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (response.status === 404) return { status: 'not_found' };
    if (!response.ok) {
      return {
        status: 'error',
        reason: 'upstream',
        upstreamStatus: response.status,
      };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { status: 'error', reason: 'invalid_response' };
    }

    if (isRecord(data) && data.error === 'repo_not_found') {
      return { status: 'not_found' };
    }
    if (!isApiRepository(data)) {
      return { status: 'error', reason: 'invalid_response' };
    }

    return { status: 'ok', repository: data };
  } catch {
    if (timedOut) return { status: 'error', reason: 'timeout' };
    if (signal?.aborted) return { status: 'error', reason: 'aborted' };
    return { status: 'error', reason: 'upstream' };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
