import GithubSlugger from 'github-slugger';

/**
 * Full-text search over the site documentation.
 *
 * The four documents are static markdown in public/docs/, so they are fetched
 * once, split at their headings, and searched in the browser — no index to
 * build, no service to call. Each result points at a heading anchor rather than
 * the top of a document, so a hit lands on the paragraph that matched.
 *
 * Anchors are generated with `github-slugger`, the same slugger
 * `marked-gfm-heading-id` uses when the page is rendered. Re-deriving the rule
 * by hand would drift and produce links to anchors that do not exist.
 */
export interface DocSource {
  slug: string;
  title: string;
}

export interface DocSection {
  /** Document slug, e.g. "quickstart". */
  docSlug: string;
  docTitle: string;
  /** Heading anchor id; empty for the text before the first heading. */
  id: string;
  heading: string;
  level: number;
  /** Section prose, fences included — commands are worth finding. */
  body: string;
}

export interface DocHit extends DocSection {
  score: number;
  /** Text around the match, for display under the result. */
  snippet: string;
}

let cache: DocSection[] | null = null;
let inFlight: Promise<DocSection[]> | null = null;

/** Fenced regions are skipped: `# npm` inside a shell block is a comment. */
const FENCE = /^\s*(```|~~~)/;
const HEADING = /^(#{1,6})\s+(.*)$/;

function parseSections(markdown: string, source: DocSource): DocSection[] {
  const slugger = new GithubSlugger();
  const sections: DocSection[] = [];
  let current: DocSection = {
    docSlug: source.slug,
    docTitle: source.title,
    id: '',
    heading: source.title,
    level: 1,
    body: '',
  };
  let inFence = false;

  // Split on either ending. These files are checked out CRLF on Windows, and
  // splitting on "\n" alone leaves a trailing "\r" on every line — which the
  // heading pattern below can never match, because `.` in JavaScript excludes
  // carriage return as a line terminator, so `(.*)$` stops short of the end of
  // the string. Every heading silently failed and each document indexed as one
  // undivided section.
  for (const line of markdown.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      current.body += `${line}\n`;
      continue;
    }

    const match = inFence ? null : HEADING.exec(line);
    if (!match) {
      current.body += `${line}\n`;
      continue;
    }

    if (current.body.trim() || current.id) sections.push(current);

    // Strip inline markdown so the heading reads as it does on the page.
    const text = match[2]
      .replace(/[*_`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .trim();

    current = {
      docSlug: source.slug,
      docTitle: source.title,
      id: slugger.slug(text),
      heading: text,
      level: match[1].length,
      body: '',
    };
  }

  if (current.body.trim() || current.id) sections.push(current);
  return sections;
}

/** Exposed for tests; production callers go through `loadDocSections`. */
export const __parseSectionsForTest = parseSections;

/** Fetch and index every document. Cached for the session. */
export function loadDocSections(sources: readonly DocSource[]): Promise<DocSection[]> {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = Promise.all(
      sources.map(async source => {
        try {
          const res = await fetch(`/docs/${source.slug}.md`);
          if (!res.ok) return [];
          return parseSections(await res.text(), source);
        } catch {
          // One unreachable document must not blank the whole search.
          return [];
        }
      }),
    )
      .then(groups => {
        cache = groups.flat();
        inFlight = null;
        return cache;
      })
      .catch(err => {
        inFlight = null;
        throw err;
      });
  }
  return inFlight;
}

function buildSnippet(body: string, query: string): string {
  // Collapse fences and whitespace so the snippet is one readable line, and
  // drop the emphasis and code markers — a result row is plain text, so `**`
  // and backticks show up literally instead of styling anything. Underscores
  // are left alone: they carry meaning inside identifiers like `from_peer`.
  const flat = body
    .replace(/```[a-z]*|~~~[a-z]*/gi, ' ')
    .replace(/\*\*|`/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const at = flat.toLowerCase().indexOf(query);
  if (at < 0) return flat.slice(0, 100);
  const start = Math.max(0, at - 32);
  const text = flat.slice(start, start + 110).trim();
  return `${start > 0 ? '…' : ''}${text}`;
}

/**
 * Rank sections against a query. A heading match outranks a body match, and an
 * earlier body match outranks a later one, so the most on-topic section wins
 * rather than whichever document happens to mention the word most.
 */
export function searchDocs(sections: DocSection[], rawQuery: string, limit = 5): DocHit[] {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return [];

  const hits: DocHit[] = [];
  for (const section of sections) {
    const heading = section.heading.toLowerCase();
    const body = section.body.toLowerCase();

    let score = 0;
    if (heading === query) score = 100;
    else if (heading.startsWith(query)) score = 80;
    else if (heading.includes(query)) score = 60;

    const bodyAt = body.indexOf(query);
    if (bodyAt >= 0) {
      // Shallower headings are more general, so their sections are usually the
      // better landing point for the same term.
      score += 30 - Math.min(20, Math.floor(bodyAt / 200)) - section.level;
    }

    if (score <= 0) continue;
    hits.push({ ...section, score, snippet: buildSnippet(section.body, query) });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Route for a hit, including the heading anchor when there is one. */
export function docHitPath(hit: DocSection): string {
  return `/docs/${hit.docSlug}${hit.id ? `#${hit.id}` : ''}`;
}
