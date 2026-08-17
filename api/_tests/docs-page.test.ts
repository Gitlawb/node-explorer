import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../docs-page.js';

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

const AGENTS_MARKDOWN = '# gitlawb for AI agents\n\nEvery command verified.\n';

const BROWSER_ACCEPT =
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

beforeEach(() => {
  vi.stubEnv('PUBLIC_SITE_URL', '');
});

/** Serves index.html and public/docs/*.md the way the deployment would. */
function stubStaticFetch(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockImplementation((input: URL | RequestInfo) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith('/docs/agents.md')) {
      return Promise.resolve(
        new Response(AGENTS_MARKDOWN, {
          status: 200,
          headers: { 'Content-Type': 'text/markdown' },
        }),
      );
    }
    if (/\/docs\/[^/]+\.md$/.test(url)) {
      return Promise.resolve(new Response('not found', { status: 404 }));
    }
    return Promise.resolve(
      new Response(INDEX_HTML, { status: 200, headers: { 'Content-Type': 'text/html' } }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function docsRequest(slug?: string, headers: Record<string, string> = { accept: BROWSER_ACCEPT }): Request {
  const search = slug === undefined ? '' : `?${new URLSearchParams({ slug })}`;
  return new Request(`https://preview.example/api/docs-page${search}`, { headers });
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('docs page HTML shell', () => {
  it('injects per-section metadata with the docs OG card', async () => {
    const staticFetch = stubStaticFetch();

    const response = await GET(docsRequest('agents'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    );
    expect(response.headers.get('vary')).toBe('Accept, User-Agent');
    expect(staticFetch).toHaveBeenCalledTimes(1);
    expect(html).toContain('<title>for AI agents · docs · gitlawb explorer</title>');
    expect(html).toContain('content="https://preview.example/og-docs.png"');
    expect(html).toContain('href="https://preview.example/docs/agents"');
    expect(html).not.toContain('old metadata');
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('<script type="module" src="/assets/app.js"></script>');
  });

  it('serves hub metadata for the bare /docs route', async () => {
    stubStaticFetch();

    const response = await GET(docsRequest());
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<title>docs · gitlawb explorer</title>');
    expect(html).toContain('href="https://preview.example/docs"');
    expect(html).toContain('content="https://preview.example/og-docs.png"');
  });

  it('falls back to hub metadata for an unknown slug without echoing it', async () => {
    stubStaticFetch();

    const response = await GET(docsRequest('"><script>alert(1)</script>'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<title>docs · gitlawb explorer</title>');
    expect(html).toContain('href="https://preview.example/docs"');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('honors PUBLIC_SITE_URL for canonical and image URLs', async () => {
    vi.stubEnv('PUBLIC_SITE_URL', 'https://explorer.gitlawb.com');
    stubStaticFetch();

    const response = await GET(docsRequest('protocol'));
    const html = await response.text();

    expect(html).toContain('href="https://explorer.gitlawb.com/docs/protocol"');
    expect(html).toContain('content="https://explorer.gitlawb.com/og-docs.png"');
  });

  it('serves the HTML shell to social crawlers that accept */*', async () => {
    stubStaticFetch();

    const response = await GET(docsRequest('agents', {
      accept: '*/*',
      'user-agent': 'Twitterbot/1.0',
    }));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('<title>for AI agents · docs · gitlawb explorer</title>');
    expect(html).toContain('<div id="root"></div>');
  });

  it('returns a plain 502 when the shell cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));

    const response = await GET(docsRequest('agents'));

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0');
    expect(await response.text()).toContain('temporarily unavailable');
  });
});

describe('docs page markdown negotiation', () => {
  it('serves the raw section markdown to text clients', async () => {
    const staticFetch = stubStaticFetch();

    const response = await GET(docsRequest('agents', { accept: '*/*', 'user-agent': 'curl/8.7.1' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(response.headers.get('vary')).toBe('Accept, User-Agent');
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    );
    expect(body).toBe(AGENTS_MARKDOWN);
    expect(String(staticFetch.mock.calls[0][0])).toContain('/docs/agents.md');
  });

  it('serves a markdown index for the bare /docs route', async () => {
    stubStaticFetch();

    const response = await GET(docsRequest(undefined, { accept: '*/*' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(body).toContain('# gitlawb docs');
    expect(body).toContain('https://preview.example/docs/quickstart.md');
    expect(body).toContain('https://preview.example/docs/agents.md');
    expect(body).toContain('https://preview.example/skill.md');
    expect(body).toContain('https://preview.example/llms.txt');
    expect(body).not.toContain('<div id="root">');
  });

  it('serves the markdown index for unknown slugs without echoing them', async () => {
    stubStaticFetch();

    const response = await GET(docsRequest('nope"><script>', { accept: '*/*' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('# gitlawb docs');
    expect(body).not.toContain('nope');
  });

  it('returns a markdown 502 pointer when the section file cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));

    const response = await GET(docsRequest('agents', { accept: '*/*' }));
    const body = await response.text();

    expect(response.status).toBe(502);
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(body).toContain('https://preview.example/docs/agents.md');
  });
});
