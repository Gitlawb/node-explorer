// Content negotiation between the SPA's HTML shell and raw markdown.
//
// The explorer's primary audience includes AI agents and CLI tools that never
// execute JavaScript — to them the built SPA shell is an empty page. Any
// client that does not advertise `text/html` in its Accept header receives
// markdown instead.
//
// Social and search crawlers are the exception: many of them send a wildcard
// Accept header exactly like curl does, but they consume the meta-tagged HTML
// shell (OG cards, canonical URLs). They are recognized by user agent and
// always receive HTML, so link previews keep working.
const HTML_CRAWLERS =
  /googlebot|bingbot|duckduckbot|yandex|baiduspider|applebot|facebookexternalhit|facebot|twitterbot|slackbot|slack-imgproxy|discordbot|linkedinbot|whatsapp|telegrambot|pinterestbot|redditbot|embedly|iframely|skypeuripreview/i;

/** Responses that negotiate on these headers must declare it to caches. */
export const NEGOTIATION_VARY = 'Accept, User-Agent';

export function prefersHtml(request: Request): boolean {
  const accept = request.headers.get('accept') ?? '';
  if (/\btext\/html\b/i.test(accept)) return true;
  return HTML_CRAWLERS.test(request.headers.get('user-agent') ?? '');
}

export function markdownResponse(
  body: string,
  init: { status?: number; cacheControl: string },
): Response {
  return new Response(body, {
    status: init.status ?? 200,
    headers: {
      'Cache-Control': init.cacheControl,
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      Vary: NEGOTIATION_VARY,
    },
  });
}
