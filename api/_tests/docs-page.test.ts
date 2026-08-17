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

/**
 * Serves index.html and public/docs/*.md the way the deployment does.
 *
 * The important detail is that **nothing 404s**. vercel.json rewrites
 * `/docs/:slug` into this function — and `:slug` matches a segment containing
 * a dot — while `/(.*)` catches everything else and serves index.html. A
 * missing `public/docs/<slug>.md` therefore does not produce a 404: it is
 * rewritten back into the handler. An earlier version of this stub returned
 * 404 for absent files, which is why a real bug went unnoticed — the handler
 * served the hub index as though it were the requested document.
 */
function stubStaticFetch(present: readonly string[] = ['agents']): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockImplementation(async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));

    const docMatch = url.match(/\/docs\/([^/]+)\.md$/);
    if (docMatch) {
      if (present.includes(docMatch[1])) {
        return new Response(AGENTS_MARKDOWN, {
          status: 200,
          headers: { 'Content-Type': 'text/markdown' },
        });
      }
      // Filesystem miss → vercel.json rewrites `/docs/<slug>.md` back into
      // this same function with slug="<slug>.md".
      const rewritten = new Request(
        `https://preview.example/api/docs-page?${new URLSearchParams({ slug: `${docMatch[1]}.md` })}`,
        { headers },
      );
      return GET(rewritten);
    }

    return new Response(INDEX_HTML, { status: 200, headers: { 'Content-Type': 'text/html' } });
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

  it('never serves the hub index in place of a listed document', async () => {
    // The file for "protocol" is absent, so the subrequest is rewritten back
    // into this handler. Before the fix that answered 200 with the hub index,
    // which was then served as the protocol document — wrong content, correct
    // content-type, cached for an hour.
    stubStaticFetch(['agents']);

    const response = await GET(docsRequest('protocol', { accept: '*/*' }));
    const body = await response.text();

    expect(body).not.toContain('# gitlawb docs');
    expect(body).not.toContain('All guides are served as raw markdown');
    expect(response.status).toBe(404);
  });

  it('does not cache the response for an absent document', async () => {
    stubStaticFetch(['agents']);

    const response = await GET(docsRequest('node', { accept: '*/*' }));

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0');
  });

  it('still serves a document whose file is present', async () => {
    stubStaticFetch(['agents']);

    const response = await GET(docsRequest('agents', { accept: '*/*' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toBe(AGENTS_MARKDOWN);
  });

  it('rejects the internal markdown subrequest rather than answering it', async () => {
    // Reaching the handler with this header means the static file was missing,
    // because a file that exists is served before rewrites are consulted.
    stubStaticFetch();

    const response = await GET(
      docsRequest('agents.md', { accept: '*/*', 'x-gitlawb-doc-markdown': '1' }),
    );

    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('# gitlawb docs');
  });

  it('rejects an HTML shell served in place of a document', async () => {
    // The other rewrite outcome: the `/(.*)` catch-all serves index.html, so
    // the body is the SPA shell rather than markdown.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(INDEX_HTML, { status: 200, headers: { 'Content-Type': 'text/html' } }),
      ),
    );

    const response = await GET(docsRequest('agents', { accept: '*/*' }));
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(body).not.toContain('<div id="root">');
  });
});
