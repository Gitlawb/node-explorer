import { afterEach, describe, expect, it, vi } from 'vitest';

import { repoCacheVersion } from '../../src/lib/repoSocial';
import type { ApiRepository } from '../_lib/repository';
import { GET } from '../og';

const repository = {
  id: 'repo-1',
  name: 'lyz-code-best-of-digital-gardens',
  owner_did: 'did:key:z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM',
  description: 'A carefully curated collection of digital garden tools and references.',
  is_public: true,
  default_branch: 'main',
  clone_url: 'https://node.gitlawb.com/repo.git',
  star_count: 42,
  created_at: '2025-01-02T03:04:05.000Z',
  updated_at: '2026-07-10T12:00:00.000Z',
  forked_from: null,
} satisfies ApiRepository;

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}

async function expectPng(response: Response): Promise<Uint8Array> {
  expect(response.headers.get('content-type')).toBe('image/png');

  const bytes = new Uint8Array(await response.arrayBuffer());
  expect(Array.from(bytes.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(String.fromCharCode(...bytes.slice(12, 16))).toBe('IHDR');
  expect(view.getUint32(16)).toBe(1200);
  expect(view.getUint32(20)).toBe(630);
  return bytes;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('repository OG image', () => {
  it('renders a versioned public repository as a detailed immutable PNG', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(repository));
    vi.stubGlobal('fetch', fetchMock);

    const owner = encodeURIComponent(repository.owner_did);
    const version = encodeURIComponent(repoCacheVersion(repository));
    const response = await GET(new Request(
      `https://explorer.gitlawb.com/api/og?owner=${owner}&name=${repository.name}&v=${version}`,
    ));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0].toString()).toContain(
      `/api/v1/repos/${repository.owner_did.slice('did:key:'.length)}/${repository.name}`,
    );
    expect(response.headers.get('x-gitlawb-og-variant')).toBe('repository');
    expect(response.headers.get('cache-control')).toContain('max-age=31536000');
    expect(response.headers.get('cache-control')).toContain('immutable');
    await expectPng(response);
  }, 15_000);

  it('renders a short-cached generic PNG for a private repository', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      ...repository,
      description: 'private details must not reach the renderer',
      is_public: false,
      name: 'private-repository',
    } satisfies ApiRepository));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request(
      'https://explorer.gitlawb.com/api/og?owner=z6Private&name=private-repository&v=stale',
    ));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get('x-gitlawb-og-variant')).toBe('generic');
    expect(response.headers.get('cache-control')).toContain('s-maxage=300');
    expect(response.headers.get('cache-control')).not.toContain('immutable');
    await expectPng(response);
  }, 15_000);

  it('renders the generic card without fetching when repository input is malformed', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request('https://explorer.gitlawb.com/api/og?owner=z6Only'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get('x-gitlawb-og-variant')).toBe('generic');
    expect(response.headers.get('cache-control')).toContain('s-maxage=300');
    await expectPng(response);
  }, 15_000);

  it('keeps Unicode repository content from triggering remote font or emoji fetches', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      ...repository,
      name: '庭園-notes-🌱-フィリピン',
      description: 'A garden of notes — mga tala, 日本語, and ideas 🌿',
    } satisfies ApiRepository));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request(
      'https://explorer.gitlawb.com/api/og?owner=z6Unicode&name=unicode-repository',
    ));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get('x-gitlawb-og-variant')).toBe('repository');
    await expectPng(response);
  }, 15_000);
});
