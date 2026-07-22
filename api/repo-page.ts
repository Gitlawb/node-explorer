import { buildRepoSocialModel, escapeHtml } from './_lib/repoSocial';
import { fetchRepository } from './_lib/repository';

const GENERIC_TITLE = 'gitlawb explorer';
const GENERIC_DESCRIPTION =
  'Browse live repositories on the gitlawb network — clone over gitlawb://, inspect ownership, and verify push certificates.';
const GENERIC_IMAGE_ALT =
  'gitlawb explorer — a terminal-style browser for live repositories on the gitlawb network';

const SOCIAL_META_PATTERN =
  /<!-- gitlawb:social-meta:start -->[\s\S]*?<!-- gitlawb:social-meta:end -->/;
const INDEX_FETCH_TIMEOUT_MS = 3_500;

const SUCCESS_CACHE = 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600';
const NOT_FOUND_CACHE = 'public, max-age=0, s-maxage=30';
const NO_CACHE = 'private, no-store, max-age=0';

interface Metadata {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  imageAlt: string;
  noIndex?: boolean;
}

interface RepositoryParams {
  owner: string;
  name: string;
}

function decodePathSegment(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function isSafeRouteSegment(value: string, maxLength: number): boolean {
  const hasControlCharacter = Array.from(value).some(character => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });

  return (
    value.length > 0
    && value.length <= maxLength
    && !value.includes('/')
    && !value.includes('\\')
    && !hasControlCharacter
  );
}

function repositoryParams(request: Request): RepositoryParams | null {
  const url = new URL(request.url);
  let owner = url.searchParams.get('owner');
  let name = url.searchParams.get('name');

  // Keeping this fallback makes the handler straightforward to exercise
  // outside Vercel, where the rewrite query parameters may not be present.
  if (owner === null || name === null) {
    const match = url.pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/?$/u);
    if (!match) return null;
    owner = decodePathSegment(match[1]);
    name = decodePathSegment(match[2]);
  }

  if (
    owner === null
    || name === null
    || !isSafeRouteSegment(owner, 512)
    || !isSafeRouteSegment(name, 255)
  ) {
    return null;
  }

  return { owner, name };
}

function renderMetadata(metadata: Metadata): string {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const canonicalUrl = escapeHtml(metadata.canonicalUrl);
  const imageUrl = escapeHtml(metadata.imageUrl);
  const imageAlt = escapeHtml(metadata.imageAlt);
  const robots = metadata.noIndex
    ? '\n    <meta name="robots" content="noindex, noarchive" />'
    : '';

  return `<!-- gitlawb:social-meta:start -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />${robots}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="gitlawb explorer" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${imageAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
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

function genericMetadata(origin: string, noIndex = false): Metadata {
  return {
    title: GENERIC_TITLE,
    description: GENERIC_DESCRIPTION,
    canonicalUrl: `${origin}/`,
    imageUrl: `${origin}/og.png`,
    imageAlt: GENERIC_IMAGE_ALT,
    noIndex,
  };
}

function injectMetadata(html: string, metadata: Metadata): string | null {
  if (!SOCIAL_META_PATTERN.test(html)) return null;
  return html.replace(SOCIAL_META_PATTERN, renderMetadata(metadata));
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

function htmlResponse(
  html: string,
  init: { status?: number; cacheControl: string; noIndex?: boolean },
): Response {
  const headers = new Headers({
    'Cache-Control': init.cacheControl,
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  if (init.noIndex) headers.set('X-Robots-Tag', 'noindex, noarchive');

  return new Response(html, { status: init.status ?? 200, headers });
}

function shellUnavailable(): Response {
  return new Response('Repository page is temporarily unavailable.', {
    status: 502,
    headers: {
      'Cache-Control': NO_CACHE,
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const params = repositoryParams(request);
  const origin = siteOrigin(request);
  if (!params) {
    const indexHtml = await fetchIndexHtml(request);
    if (!indexHtml) return shellUnavailable();
    const html = injectMetadata(indexHtml, genericMetadata(origin, true));
    if (!html) return shellUnavailable();
    return htmlResponse(html, { status: 400, cacheControl: NO_CACHE, noIndex: true });
  }

  // The shell and the single upstream repository request are independent, so
  // run them together to keep crawler response latency to one network round trip.
  const [indexHtml, repositoryResult] = await Promise.all([
    fetchIndexHtml(request),
    fetchRepository(params.owner, params.name, request.signal),
  ]);

  if (!indexHtml) return shellUnavailable();

  if (repositoryResult.status === 'ok' && repositoryResult.repository.is_public) {
    const model = buildRepoSocialModel(repositoryResult.repository);
    const canonicalUrl = new URL(model.canonicalPath, origin).toString();
    const imagePath = [
      'og',
      'repos',
      encodeURIComponent(model.owner.canonicalSegment),
      encodeURIComponent(model.canonicalName),
      encodeURIComponent(model.cacheVersion),
    ].join('/');
    const imageUrl = new URL(`/${imagePath}`, origin).toString();
    const html = injectMetadata(indexHtml, {
      title: model.title,
      description: model.description,
      canonicalUrl,
      imageUrl,
      imageAlt: model.imageAlt,
    });

    if (!html) return shellUnavailable();
    return htmlResponse(html, { cacheControl: SUCCESS_CACHE });
  }

  const noIndexHtml = injectMetadata(indexHtml, genericMetadata(origin, true));
  if (!noIndexHtml) return shellUnavailable();

  if (repositoryResult.status === 'not_found') {
    return htmlResponse(noIndexHtml, {
      status: 404,
      cacheControl: NOT_FOUND_CACHE,
      noIndex: true,
    });
  }

  // Private repositories and transient upstream errors both receive the same
  // site-wide metadata. Never interpolate a private repository response here.
  return htmlResponse(noIndexHtml, { cacheControl: NO_CACHE, noIndex: true });
}
