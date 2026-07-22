import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRepository, type ApiRepository } from '../_lib/repository';
import { GET } from '../repo-page';

vi.mock('../_lib/repository', () => ({
  fetchRepository: vi.fn(),
}));

const INDEX_HTML = `<!doctype html>
<html>
  <head>
    <!-- gitlawb:social-meta:start -->
    <title>old metadata</title>
    <!-- gitlawb:social-meta:end -->
    <link rel="stylesheet" href="/assets/app.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/app.js"></script>
  </body>
</html>`;

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

const fetchRepositoryMock = vi.mocked(fetchRepository);

beforeEach(() => {
  vi.stubEnv('PUBLIC_SITE_URL', '');
});

function stubIndexHtml(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(INDEX_HTML, { status: 200, headers: { 'Content-Type': 'text/html' } }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function repositoryRequest(name = 'demo'): Request {
  const search = new URLSearchParams({ owner: 'z6Owner', name });
  return new Request(`https://preview.example/api/repo-page?${search}`);
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('repository page HTML shell', () => {
  it('injects escaped repository metadata and preserves the built SPA shell', async () => {
    const indexFetch = stubIndexHtml();
    fetchRepositoryMock.mockResolvedValue({
      status: 'ok',
      repository: {
        ...REPOSITORY,
        name: 'demo<&',
        description: 'A "quoted" <repository> & more',
      },
    });

    const response = await GET(repositoryRequest('demo<&'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
    );
    expect(indexFetch).toHaveBeenCalledTimes(1);
    expect(fetchRepositoryMock).toHaveBeenCalledTimes(1);
    expect(fetchRepositoryMock).toHaveBeenCalledWith('z6Owner', 'demo<&', expect.any(AbortSignal));
    expect(html).toContain('<title>z6Owner/demo&lt;&amp; · gitlawb explorer</title>');
    expect(html).toContain('content="A &quot;quoted&quot; &lt;repository&gt; &amp; more"');
    expect(html).toContain(
      'href="https://preview.example/repos/z6Owner/demo%3C%26"',
    );
    expect(html).toContain(
      'content="https://preview.example/og/repos/z6Owner/demo%3C%26/2026-07-10T00-00-00-000Z-7"',
    );
    expect(html).not.toContain('<repository>');
    expect(html).toContain('<link rel="stylesheet" href="/assets/app.css" />');
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('<script type="module" src="/assets/app.js"></script>');
  });

  it('keeps the complete repository name in canonical and OG request paths', async () => {
    stubIndexHtml();
    const longName = 'r'.repeat(140);
    fetchRepositoryMock.mockResolvedValue({
      status: 'ok',
      repository: { ...REPOSITORY, name: longName },
    });

    const response = await GET(repositoryRequest(longName));
    const html = await response.text();

    expect(html).toContain(`href="https://preview.example/repos/z6Owner/${longName}"`);
    expect(html).toContain(`content="https://preview.example/og/repos/z6Owner/${longName}/`);
  });

  it('never places private repository data in the response', async () => {
    stubIndexHtml();
    fetchRepositoryMock.mockResolvedValue({
      status: 'ok',
      repository: {
        ...REPOSITORY,
        name: 'secret-name',
        description: 'extremely secret description',
        is_public: false,
      },
    });

    const response = await GET(repositoryRequest('secret-name'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, noarchive');
    expect(html).toContain('<title>gitlawb explorer</title>');
    expect(html).toContain('<meta name="robots" content="noindex, noarchive" />');
    expect(html).not.toContain('secret-name');
    expect(html).not.toContain('extremely secret description');
  });

  it('uses a generic no-store shell when the repository upstream fails', async () => {
    stubIndexHtml();
    fetchRepositoryMock.mockResolvedValue({ status: 'error', reason: 'timeout' });

    const response = await GET(repositoryRequest());
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, noarchive');
    expect(html).toContain('https://preview.example/og.png');
    expect(html).toContain('<script type="module" src="/assets/app.js"></script>');
  });

  it('returns a short-cached generic 404 shell for a missing repository', async () => {
    stubIndexHtml();
    fetchRepositoryMock.mockResolvedValue({ status: 'not_found' });

    const response = await GET(repositoryRequest('missing'));
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=30');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, noarchive');
    expect(html).toContain('<div id="root"></div>');
  });
});
