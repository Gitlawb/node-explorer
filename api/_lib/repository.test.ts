import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRepository, type ApiRepository } from './repository';

const REPOSITORY: ApiRepository = {
  id: 'repo-1',
  name: 'demo',
  owner_did: 'did:key:z6Owner',
  description: 'A demo repository',
  is_public: true,
  default_branch: 'main',
  clone_url: 'gitlawb://z6Owner/demo',
  star_count: 7,
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-10T00:00:00.000Z',
  forked_from: null,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchRepository', () => {
  it('fetches one absolute, encoded upstream URL and returns a valid repository', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(REPOSITORY));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchRepository('did:key:z6 Owner', 'demo/name')).resolves.toEqual({
      status: 'ok',
      repository: REPOSITORY,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://node.gitlawb.com/api/v1/repos/did%3Akey%3Az6%20Owner/demo%2Fname',
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'GET', cache: 'no-store' });
  });

  it('returns not_found for a 404 without parsing the response body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status: 404 })));

    await expect(fetchRepository('z6Owner', 'missing')).resolves.toEqual({ status: 'not_found' });
  });

  it('rejects invalid JSON and invalid repository shapes', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{', { status: 200 }))
      .mockResolvedValueOnce(Response.json({ ...REPOSITORY, star_count: 'many' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchRepository('z6Owner', 'demo')).resolves.toEqual({
      status: 'error',
      reason: 'invalid_response',
    });
    await expect(fetchRepository('z6Owner', 'demo')).resolves.toEqual({
      status: 'error',
      reason: 'invalid_response',
    });
  });

  it('returns an upstream error with the response status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })));

    await expect(fetchRepository('z6Owner', 'demo')).resolves.toEqual({
      status: 'error',
      reason: 'upstream',
      upstreamStatus: 503,
    });
  });

  it('honors a caller abort without waiting for the internal timeout', async () => {
    const fetchMock = vi.fn((_url: URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      const rejectAbort = () => reject(new DOMException('Aborted', 'AbortError'));
      if (signal?.aborted) rejectAbort();
      else signal?.addEventListener('abort', rejectAbort, { once: true });
    }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    const result = fetchRepository('z6Owner', 'demo', controller.signal);
    controller.abort();

    await expect(result).resolves.toEqual({ status: 'error', reason: 'aborted' });
  });
});
