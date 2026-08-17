import { escapeHtml } from './_lib/repoSocial.js';
import { markdownResponse, prefersHtml, NEGOTIATION_VARY } from './_lib/negotiation.js';

// Serves /docs and /docs/:slug. Browsers and social/search crawlers get the
// SPA shell with docs-specific social metadata (og-docs.png card, per-section
// title/description) swapped into the marker-delimited block of the built
// index.html — same mechanism as api/repo-page.ts. The shell-fetch/inject
// helpers are intentionally duplicated from repo-page rather than shared:
// repo-page is verified in production and stays untouched.
//
// Clients that don't advertise text/html (curl, AI agents, scripts) get raw
// markdown instead: the slug's public/docs/*.md file, or a generated index
// for the hub — the built shell is an empty <div id="root"> to anything that
// doesn't run JS.
//
// Raw markdown URLs are unaffected: the filesystem (public/docs/*.md) is
// served before rewrites, so only extensionless page routes reach this
// function.

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
      Vary: NEGOTIATION_VARY,
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

/**
 * A line unique to the generated hub index.
 *
 * `fetchDocMarkdown` checks for it: when a document's static file is absent the
 * subrequest can be rewritten back into this function and answered with the hub
 * index at status 200, which would then be served as though it were the
 * requested document.
 */
const HUB_MARKER = 'All guides are served as raw markdown at stable URLs';

/** Markdown index served to text clients at the bare /docs route. */
function hubMarkdown(origin: string): string {
  const lines = [
    '# gitlawb docs',
    '',
    '> gitlawb is a decentralized git network where AI agents and humans collaborate as equals. Identity is an Ed25519 DID keypair; every push is signed and produces a verifiable ref-update certificate.',
    '',
    `${HUB_MARKER} — fetch these directly:`,
    '',
  ];
  for (const [slug, meta] of Object.entries(DOCS)) {
    const label = meta.title.replace(` · docs · ${SITE_NAME}`, '');
    lines.push(`- ${origin}/docs/${slug}.md — ${label}: ${meta.description}`);
  }
  lines.push(
    '',
    `- ${origin}/skill.md — packaged agent skill: full CLI reference, MCP server setup, workflows, and edge cases`,
    `- ${origin}/llms.txt — machine-readable index of everything on this site`,
    '',
    `Live network explorer (repos, agents, events): ${origin}/`,
    `Node API: https://node.gitlawb.com/api/v1 (e.g. /repos, /repos/{owner}/{repo}/events, /repos/{owner}/{repo}/certs)`,
    '',
  );
  return lines.join('\n');
}

const MARKDOWN_FETCH_TIMEOUT_MS = 3_500;

/**
 * Marks the subrequest this function makes for a document's markdown.
 *
 * vercel.json has no path that 404s: `/docs/:slug` rewrites here and `:slug`
 * matches a segment containing a dot, and anything else falls to the `/(.*)`
 * catch-all serving index.html. So when `/docs/<slug>.md` misses the
 * filesystem, the subrequest below does not fail — it is rewritten back into
 * this function, which answers 200 with the hub index (the subrequest's Accept
 * is not html), and that would then be served to the client as the requested
 * document, with `Content-Type: text/markdown` and an hour of CDN caching.
 *
 * A request carrying this header therefore means exactly one thing: the static
 * file was not there, because a file that exists is served before rewrites are
 * consulted. Answering 404 breaks the loop at the first hop.
 */
const INTERNAL_MARKDOWN_HEADER = 'x-gitlawb-doc-markdown';

type MarkdownResult =
  | { ok: true; markdown: string }
  | { ok: false; reason: 'missing' | 'unavailable' };

/**
 * Whether a fetched body is a document rather than something a rewrite
 * substituted. `fetchIndexHtml` guards its own fetch the same way, by testing
 * the body instead of trusting the status.
 */
function isDocumentBody(text: string): boolean {
  const head = text.slice(0, 500).trimStart();
  if (/^<(!doctype|html\b|\?xml)/i.test(head)) return false; // the SPA shell
  if (text.includes(HUB_MARKER)) return false; // this function's own hub index
  return true;
}

async function fetchDocMarkdown(request: Request, slug: string): Promise<MarkdownResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error('Markdown request timed out')),
    MARKDOWN_FETCH_TIMEOUT_MS,
  );

  try {
    const response = await fetch(new URL(`/docs/${slug}.md`, request.url), {
      method: 'GET',
      headers: { [INTERNAL_MARKDOWN_HEADER]: '1', Accept: 'text/markdown, text/plain' },
      cache: 'force-cache',
      redirect: 'follow',
      signal: controller.signal,
    });
    if (response.status === 404) return { ok: false, reason: 'missing' };
    if (!response.ok) return { ok: false, reason: 'unavailable' };

    const text = await response.text();
    if (!isDocumentBody(text)) return { ok: false, reason: 'missing' };
    return { ok: true, markdown: text };
  } catch {
    return { ok: false, reason: 'unavailable' };
  } finally {
    clearTimeout(timeout);
  }
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

  // The markdown subrequest was rewritten back into this function, which means
  // the static file it asked for does not exist. Answer 404 rather than the hub
  // index, which the caller would otherwise serve as the document itself.
  if (request.headers.get(INTERNAL_MARKDOWN_HEADER) !== null) {
    return new Response('Not found\n', {
      status: 404,
      headers: {
        'Cache-Control': NO_CACHE,
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // Unknown slugs get the hub metadata; the SPA redirects them client-side.
  const known = slug !== null && slug !== '' && Object.hasOwn(DOCS, slug);

  if (!prefersHtml(request)) {
    if (!known) return markdownResponse(hubMarkdown(origin), { cacheControl: DOCS_CACHE });

    const result = await fetchDocMarkdown(request, slug);
    if (result.ok) return markdownResponse(result.markdown, { cacheControl: DOCS_CACHE });

    // A listed slug whose file is absent is a broken deploy, not a passing
    // outage, so it is not cached and does not claim to be temporary.
    if (result.reason === 'missing') {
      return markdownResponse(
        `# Not found\n\nThere is no document at /docs/${slug}. The current guides are listed at ${origin}/docs\n`,
        { status: 404, cacheControl: NO_CACHE },
      );
    }
    return markdownResponse(
      `This page is temporarily unavailable. Raw markdown lives at ${origin}/docs/${slug}.md\n`,
      { status: 502, cacheControl: NO_CACHE },
    );
  }

  const indexHtml = await fetchIndexHtml(request);
  if (!indexHtml) return shellUnavailable();

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
