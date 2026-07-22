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

function docsRequest(slug?: string): Request {
  const search = slug === undefined ? '' : `?${new URLSearchParams({ slug })}`;
  return new Request(`https://preview.example/api/docs-page${search}`);
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('docs page HTML shell', () => {
  it('injects per-section metadata with the docs OG card', async () => {
    const indexFetch = stubIndexHtml();

    const response = await GET(docsRequest('agents'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    );
    expect(indexFetch).toHaveBeenCalledTimes(1);
    expect(html).toContain('<title>for AI agents · docs · gitlawb explorer</title>');
    expect(html).toContain('content="https://preview.example/og-docs.png"');
    expect(html).toContain('href="https://preview.example/docs/agents"');
    expect(html).not.toContain('old metadata');
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('<script type="module" src="/assets/app.js"></script>');
  });

  it('serves hub metadata for the bare /docs route', async () => {
    stubIndexHtml();

    const response = await GET(docsRequest());
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<title>docs · gitlawb explorer</title>');
    expect(html).toContain('href="https://preview.example/docs"');
    expect(html).toContain('content="https://preview.example/og-docs.png"');
  });

  it('falls back to hub metadata for an unknown slug without echoing it', async () => {
    stubIndexHtml();

    const response = await GET(docsRequest('"><script>alert(1)</script>'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<title>docs · gitlawb explorer</title>');
    expect(html).toContain('href="https://preview.example/docs"');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('honors PUBLIC_SITE_URL for canonical and image URLs', async () => {
    vi.stubEnv('PUBLIC_SITE_URL', 'https://explorer.gitlawb.com');
    stubIndexHtml();

    const response = await GET(docsRequest('protocol'));
    const html = await response.text();

    expect(html).toContain('href="https://explorer.gitlawb.com/docs/protocol"');
    expect(html).toContain('content="https://explorer.gitlawb.com/og-docs.png"');
  });

  it('returns a plain 502 when the shell cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));

    const response = await GET(docsRequest('agents'));

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0');
    expect(await response.text()).toContain('temporarily unavailable');
  });
});
