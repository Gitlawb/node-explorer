import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shortDid,
  didKeySegment,
  truncateDid,
  trustTier,
  shortSha,
  timeAgo,
  formatFileSize,
  mapTreeEntriesToFiles,
  mapApiRepo,
  fetchRepos,
  getBlob,
  blobUrl,
  MAX_INLINE_BYTES,
  type ApiRepo,
  type ApiTreeEntry,
} from './api';

describe('shortDid', () => {
  it('returns the last DID segment truncated to 8 chars', () => {
    expect(shortDid('did:key:z6Mkv79SabcdefXYZ')).toBe('z6Mkv79S');
  });

  it('keeps short segments intact', () => {
    expect(shortDid('did:key:z6Mk')).toBe('z6Mk');
  });

  it('handles values without colons', () => {
    expect(shortDid('plain')).toBe('plain');
  });
});

describe('didKeySegment', () => {
  it('returns the full segment after the last colon', () => {
    expect(didKeySegment('did:key:z6Mkv79SabcdefXYZ')).toBe('z6Mkv79SabcdefXYZ');
    expect(didKeySegment('nocolon')).toBe('nocolon');
  });
});

describe('truncateDid', () => {
  it('keeps the scheme prefix and middle-truncates the key', () => {
    expect(truncateDid('did:key:z6Mknr6CvFV5SzJvRWBnE9Fwefi8o24FsiyUUEHEwioxXxYk'))
      .toBe('did:key:z6Mkn…xXxYk');
  });

  it('leaves short keys untouched', () => {
    expect(truncateDid('did:key:z6Mknr6CvFV')).toBe('did:key:z6Mknr6CvFV');
  });

  it('truncates values without a scheme prefix', () => {
    expect(truncateDid('z6Mknr6CvFV5SzJvRWBnE9Fwefi8o24Fsiy')).toBe('z6Mkn…4Fsiy');
  });

  it('respects custom head/tail lengths', () => {
    expect(truncateDid('did:key:z6Mknr6CvFV5SzJvRWBnE9Fwefi8o24Fsiy', 8, 4))
      .toBe('did:key:z6Mknr6C…Fsiy');
  });
});

describe('trustTier', () => {
  it('maps scores onto the node thresholds', () => {
    expect(trustTier(0)).toBe('newcomer');
    expect(trustTier(0.09)).toBe('newcomer');
    expect(trustTier(0.1)).toBe('contributor');
    expect(trustTier(0.3)).toBe('trusted');
    expect(trustTier(0.7)).toBe('maintainer');
    expect(trustTier(1)).toBe('maintainer');
  });
});

describe('shortSha', () => {
  it('truncates to 7 chars', () => {
    expect(shortSha('abcdef1234567890')).toBe('abcdef1');
  });

  it('renders a dash for empty values', () => {
    expect(shortSha('')).toBe('—');
  });
});

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats each magnitude', () => {
    expect(timeAgo('2026-07-03T11:59:30Z')).toBe('30s ago');
    expect(timeAgo('2026-07-03T11:15:00Z')).toBe('45m ago');
    expect(timeAgo('2026-07-03T07:00:00Z')).toBe('5h ago');
    expect(timeAgo('2026-06-30T12:00:00Z')).toBe('3d ago');
    expect(timeAgo('2026-05-01T12:00:00Z')).toBe('2mo ago');
    expect(timeAgo('2024-06-01T12:00:00Z')).toBe('2y ago');
  });
});

describe('formatFileSize', () => {
  it('renders a dash for null', () => {
    expect(formatFileSize(null)).toBe('—');
  });

  it('formats bytes, KB, and MB', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('blobUrl', () => {
  it('encodes each path segment but keeps slashes', () => {
    expect(blobUrl('alice', 'repo', 'docs/a b.md')).toBe(
      '/api/v1/repos/alice/repo/blob/docs/a%20b.md',
    );
  });
});

const API_REPO: ApiRepo = {
  id: 'r1',
  name: 'demo',
  owner_did: 'did:key:z6MkOwner',
  description: null,
  is_public: true,
  default_branch: 'main',
  clone_url: 'https://node.example/demo.git',
  star_count: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
  forked_from: null,
};

describe('mapTreeEntriesToFiles', () => {
  it('maps blobs to files and trees to dirs', () => {
    const entries: ApiTreeEntry[] = [
      { hash: 'a', mode: '100644', name: 'main.rs', size: 100, type: 'blob' },
      { hash: 'b', mode: '040000', name: 'src', size: null, type: 'tree' },
    ];
    expect(mapTreeEntriesToFiles(entries)).toEqual([
      { name: 'main.rs', size: '100 B', type: 'file' },
      { name: 'src', size: '—', type: 'dir' },
    ]);
  });
});

describe('mapApiRepo', () => {
  it('maps API fields onto the view model', () => {
    const repo = mapApiRepo(API_REPO, [
      { author: 'alice', date: '2026-07-01T00:00:00Z', hash: 'abcdef1234', message: 'init' },
    ]);
    expect(repo.id).toBe('r1');
    expect(repo.visibility).toBe('public');
    expect(repo.isMirror).toBe(false);
    expect(repo.description).toBe('');
    expect(repo.latestCommit?.shortHash).toBe('abcdef1');
  });

  it('marks forked repos as mirrors', () => {
    const repo = mapApiRepo({ ...API_REPO, forked_from: 'other', is_public: false });
    expect(repo.isMirror).toBe(true);
    expect(repo.visibility).toBe('private');
    expect(repo.latestCommit).toBeUndefined();
  });
});

describe('fetchRepos', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(body: unknown, headers: Record<string, string> = {}) {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), { headers }),
    );
    vi.stubGlobal('fetch', mock);
    return mock;
  }

  it('builds the query string and reads X-Total-Count', async () => {
    const mock = stubFetch([API_REPO], { 'X-Total-Count': '42' });
    const result = await fetchRepos({ limit: 25, offset: 50, owner: 'z6Mk', q: 'demo', sort: 'stars' });

    const url = mock.mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('limit')).toBe('25');
    expect(params.get('offset')).toBe('50');
    expect(params.get('owner')).toBe('z6Mk');
    expect(params.get('q')).toBe('demo');
    expect(params.get('sort')).toBe('stars');
    expect(result.totalCount).toBe(42);
    expect(result.repos).toHaveLength(1);
  });

  it('omits the default sort and falls back to page length without the header', async () => {
    const mock = stubFetch([API_REPO, API_REPO]);
    const result = await fetchRepos({ limit: 10, offset: 0, sort: 'updated' });

    const url = mock.mock.calls[0][0] as string;
    expect(url).not.toContain('sort=');
    expect(url).not.toContain('owner=');
    expect(result.totalCount).toBe(2);
  });

  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));
    await expect(fetchRepos({ limit: 10, offset: 0 })).rejects.toThrow('500');
  });
});

describe('getBlob', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubBlobFetch(body: BodyInit, headers: Record<string, string> = {}) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { headers })));
  }

  it('classifies text files and decodes their content', async () => {
    stubBlobFetch('fn main() {}');
    const blob = await getBlob('alice', 'repo', 'src/main.rs');
    expect(blob.kind).toBe('text');
    expect(blob.content).toBe('fn main() {}');
  });

  it('classifies image extensions without reading the body', async () => {
    stubBlobFetch('...', { 'content-length': '5000000' });
    const blob = await getBlob('alice', 'repo', 'assets/logo.png');
    expect(blob.kind).toBe('image');
    expect(blob.url).toBe('/api/v1/repos/alice/repo/blob/assets/logo.png');
  });

  it('classifies NUL-containing content as binary', async () => {
    stubBlobFetch(new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x00, 0x01]));
    const blob = await getBlob('alice', 'repo', 'bin/tool');
    expect(blob.kind).toBe('binary');
    expect(blob.content).toBeUndefined();
  });

  it('refuses oversized files unless forced', async () => {
    stubBlobFetch('x', { 'content-length': String(MAX_INLINE_BYTES + 1) });
    const blob = await getBlob('alice', 'repo', 'big.txt');
    expect(blob.kind).toBe('toolarge');
  });

  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('missing', { status: 404 })));
    await expect(getBlob('alice', 'repo', 'nope.txt')).rejects.toThrow('404');
  });
});
