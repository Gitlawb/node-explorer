import { escapeHtml } from './_lib/repoSocial.js';

// Serves /docs and /docs/:slug to crawlers with docs-specific social metadata
// (og-docs.png card, per-section title/description) by swapping the
// marker-delimited block in the built index.html — same mechanism as
// api/repo-page.ts. The shell-fetch/inject helpers are intentionally
// duplicated from repo-page rather than shared: repo-page is verified in
// production and stays untouched.
//
// Raw markdown is unaffected: the filesystem (public/docs/*.md) is served
// before rewrites, so only extensionless page routes reach this function.

const SITE_NAME = 'gitlawb explorer';
const IMAGE_ALT = 'gitlawb docs — guides for agents, humans, and node operators';

const SOCIAL_META_PATTERN =
  /<!-- gitlawb:social-meta:start -->[\s\S]*?<!-- gitlawb:social-meta:end -->/;
const INDEX_FETCH_TIMEOUT_MS = 3_500;

// Docs content changes only on deploy; let the CDN hold pages for an hour and
// serve stale for a day while revalidating.
const DOCS_CACHE = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';
const NO_CACHE = 'private, no-store, max-age=0';

interface DocMeta {
  title: string;
  description: string;
}

/** Mirrors the DOCS list in src/pages/DocsPage.tsx — keep the slugs in sync. */
const DOCS: Record<string, DocMeta> = {
  quickstart: {
    title: `quickstart · docs · ${SITE_NAME}`,
    description: 'Install gl and make your first signed push on the gitlawb network in about two minutes.',
  },
  agents: {
    title: `for AI agents · docs · ${SITE_NAME}`,
    description:
      'End-to-end instructions for agents operating on gitlawb — install, identity, signed pushes, PRs, bounties, MCP server, and failure modes.',
  },
  protocol: {
    title: `protocol · docs · ${SITE_NAME}`,
    description:
      'How gitlawb works: DIDs, RFC 9421 signed pushes, UCAN delegation, iCaptcha, three-tier storage, libp2p networking, and ref consensus without a blockchain.',
  },
  node: {
    title: `run a node · docs · ${SITE_NAME}`,
    description: 'Stake, register on-chain, and operate a gitlawb node — deployment, environment reference, and rewards.',
  },
};

const HUB: DocMeta = {
  title: `docs · ${SITE_NAME}`,
  description:
    'End-to-end guides for agents and humans — quickstart, agent instructions, protocol internals, and running a node.',
};

function renderMetadata(meta: DocMeta, canonicalUrl: string, imageUrl: string): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = escapeHtml(canonicalUrl);
  const image = escapeHtml(imageUrl);
  const imageAlt = escapeHtml(IMAGE_ALT);

  return `<!-- gitlawb:social-meta:start -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${imageAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${imageAlt}" />
    <!-- gitlawb:social-meta:end -->`;
}

function siteOrigin(request: Request): string {
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.PUBLIC_SITE_URL?.trim();
  if (!configuredOrigin) return requestOrigin;

  try {
    return new URL(configuredOrigin).origin;
  } catch {
    return requestOrigin;
  }
}

async function fetchIndexHtml(request: Request): Promise<string | null> {
  const controller = new AbortController();
  const abortFromRequest = () => controller.abort(request.signal.reason);

  if (request.signal.aborted) abortFromRequest();
  else request.signal.addEventListener('abort', abortFromRequest, { once: true });

  const timeout = setTimeout(() => controller.abort(new Error('Index request timed out')), INDEX_FETCH_TIMEOUT_MS);
  const headers = new Headers({ Accept: 'text/html' });
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  try {
    const response = await fetch(new URL('/index.html', request.url), {
      method: 'GET',
      headers,
      cache: 'force-cache',
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const html = await response.text();
    return SOCIAL_META_PATTERN.test(html) ? html : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', abortFromRequest);
  }
}

function htmlResponse(html: string, init: { status?: number; cacheControl: string }): Response {
  return new Response(html, {
    status: init.status ?? 200,
    headers: {
      'Cache-Control': init.cacheControl,
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function shellUnavailable(): Response {
  return new Response('Docs page is temporarily unavailable.', {
    status: 502,
    headers: {
      'Cache-Control': NO_CACHE,
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function docSlug(request: Request): string | null {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('slug');
  if (fromQuery !== null) return fromQuery;

  // Fallback for exercising the handler outside Vercel's rewrite.
  const match = url.pathname.match(/^\/docs(?:\/([^/]+))?\/?$/u);
  if (!match) return null;
  return match[1] ?? '';
}

export async function GET(request: Request): Promise<Response> {
  const slug = docSlug(request);
  const origin = siteOrigin(request);

  const indexHtml = await fetchIndexHtml(request);
  if (!indexHtml) return shellUnavailable();

  // Unknown slugs get the hub metadata; the SPA redirects them client-side.
  const known = slug !== null && slug !== '' && Object.hasOwn(DOCS, slug);
  const meta = known ? DOCS[slug] : HUB;
  const canonicalPath = known ? `/docs/${slug}` : '/docs';

  const html = indexHtml.replace(
    SOCIAL_META_PATTERN,
    renderMetadata(
      meta,
      new URL(canonicalPath, origin).toString(),
      new URL('/og-docs.png', origin).toString(),
    ),
  );

  return htmlResponse(html, { cacheControl: DOCS_CACHE });
}
