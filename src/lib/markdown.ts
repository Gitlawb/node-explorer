// Markdown pipeline ported from web/src/app/node/repos/[owner]/[repo]/page.tsx:
// marked + GFM plugins, shiki-highlighted fences, then sanitization. The SPA
// uses DOMPurify (browser-native) instead of sanitize-html; the effective
// whitelist mirrors the web app's config via an afterSanitizeAttributes hook.
import { Marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import markedAlert from 'marked-alert';
import markedFootnote from 'marked-footnote';
import { markedEmoji } from 'marked-emoji';
import { markedHighlight } from 'marked-highlight';
import { nameToEmoji } from 'gemoji';
import createDOMPurify from 'dompurify';
import { highlightFenceHtml } from './highlight';
import { resolveShikiLang, escapeHtml, normalizeRepoPath } from './lang';
import { blobUrl } from './api';

const engine = new Marked({ gfm: true })
  .use(gfmHeadingId())
  .use(markedAlert())
  .use(markedFootnote())
  .use(markedEmoji({ emojis: nameToEmoji, renderer: token => token.emoji }))
  .use(
    markedHighlight({
      async: true,
      async highlight(code, lang) {
        const shikiLang = resolveShikiLang(lang);
        if (shikiLang) {
          const html = await highlightFenceHtml(code, shikiLang);
          if (html !== null) return html;
        }
        return escapeHtml(code); // unknown langs / size guard → plain
      },
    }),
  );

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'br', 'hr',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'ul', 'ol', 'li', 'code', 'pre', 'blockquote',
  'strong', 'b', 'em', 'i', 'del', 's', 'sup', 'sub', 'kbd',
  'details', 'summary', 'span', 'div', 'input', 'section',
];

const ALLOWED_ATTR = [
  'href', 'name', 'id', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'align', 'colspan', 'rowspan', 'start',
  'type', 'checked', 'disabled', 'class',
  'data-footnote-ref', 'data-footnote-backref', 'data-footnotes', 'data-repo-link',
  'aria-describedby', 'aria-label',
];

// Classes marked/shiki emit that the stylesheet knows about (mirrors the web
// app's allowedClasses).
const CLASS_KEEP =
  /^(language-|markdown-alert|tok-)/;
const CLASS_KEEP_EXACT = new Set(['footnotes', 'sr-only', 'markdown-alert-title', 'italic', 'underline']);

interface MarkdownCtx {
  owner: string;
  name: string;
  /** Directory the markdown file lives in — relative links resolve against it */
  basePath?: string;
}

export async function renderMarkdown(md: string, ctx: MarkdownCtx): Promise<string> {
  // Relative links/images inside e.g. docs/foo.md resolve against docs/
  const prefix = ctx.basePath ? `${ctx.basePath.replace(/\/$/, '')}/` : '';
  const isAbsolute = (url: string) =>
    /^https?:\/\//.test(url) || url.startsWith('mailto:') || url.startsWith('#');

  const raw = await engine.parse(md, { async: true });

  // Fresh instance per call: hooks close over this render's ctx, and
  // concurrent renders (README + file preview) must not share hooks.
  const purifier = createDOMPurify(window);

  purifier.addHook('afterSanitizeAttributes', node => {
    if (node.hasAttribute('class')) {
      const kept = (node.getAttribute('class') ?? '')
        .split(/\s+/)
        .filter(c => CLASS_KEEP.test(c) || CLASS_KEEP_EXACT.has(c));
      if (kept.length) node.setAttribute('class', kept.join(' '));
      else node.removeAttribute('class');
    }

    if (node.tagName === 'A') {
      const href = node.getAttribute('href') ?? '';
      if (href && !isAbsolute(href)) {
        // Relative links (LICENSE, docs/foo.md, ../README.md) → in-app file
        // view, resolved against basePath so "../" can't leak into the URL
        const [pathPart, hash] = href.split('#', 2);
        node.setAttribute(
          'href',
          `?tab=code&file=${encodeURIComponent(normalizeRepoPath(`${prefix}${pathPart}`))}${hash ? `#${hash}` : ''}`,
        );
        node.setAttribute('data-repo-link', '1');
      } else if (/^https?:\/\//.test(href)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener');
      }
    }

    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') ?? '';
      if (src && !/^https?:\/\//.test(src)) {
        // Relative image paths resolve against the repo's blob endpoint
        // (relative URL → same-origin proxy), normalized against "../" chains
        node.setAttribute('src', blobUrl(ctx.owner, ctx.name, normalizeRepoPath(`${prefix}${src}`)));
      }
      node.setAttribute('loading', 'lazy');
    }
  });

  // DOMPurify's default URI policy already blocks javascript:/data: schemes
  // (it runs before the rewrite hook, so raw hrefs are what get vetted).
  return purifier.sanitize(raw, { ALLOWED_TAGS, ALLOWED_ATTR });
}

/**
 * Render site documentation (public/docs/*.md) through the same engine and
 * sanitizer as repo markdown, minus the repo-specific link/image rewriting:
 * docs link internally with root-absolute paths (/docs/…) that need no
 * translation, and externally with https URLs that open in a new tab.
 */
export async function renderDocsMarkdown(md: string): Promise<string> {
  const raw = await engine.parse(md, { async: true });
  const purifier = createDOMPurify(window);

  purifier.addHook('afterSanitizeAttributes', node => {
    if (node.hasAttribute('class')) {
      const kept = (node.getAttribute('class') ?? '')
        .split(/\s+/)
        .filter(c => CLASS_KEEP.test(c) || CLASS_KEEP_EXACT.has(c));
      if (kept.length) node.setAttribute('class', kept.join(' '));
      else node.removeAttribute('class');
    }

    if (node.tagName === 'A' && /^https?:\/\//.test(node.getAttribute('href') ?? '')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener');
    }

    if (node.tagName === 'IMG') node.setAttribute('loading', 'lazy');
  });

  return purifier.sanitize(raw, { ALLOWED_TAGS, ALLOWED_ATTR });
}
