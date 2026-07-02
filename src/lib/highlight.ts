// Client-side Shiki singleton (JS regex engine, no WASM) with the gitlawb
// accent theme — ported from web/src/lib/highlight.ts. The theme uses SENTINEL
// hex colors that are never rendered — codeToTokens returns them as token.color
// and we map them to tok-* classes; index.css owns the real (light/dark-aware)
// colors. Languages are loaded lazily via a static import map (a template
// import specifier would not code-split under Vite/Rollup).
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { LanguageRegistration, ThemeRegistrationRaw } from 'shiki';
import { escapeHtml, type ShikiLang } from './lang';

export { resolveShikiLang, getShikiLangFromPath, escapeHtml } from './lang';
export type { ShikiLang } from './lang';

const C = {
  fg: '#e6e6e7', // default — intentionally NOT in COLOR_CLASS → no span class
  kw: '#60a5fa',
  str: '#4ade80',
  type: '#facc15',
  num: '#facc16', // distinct sentinel; CSS renders the same yellow as type
  cmt: '#777778',
  fn: '#f0f0f1',
  prop: '#d0d0d1',
  punc: '#909091',
} as const;

const COLOR_CLASS: Record<string, string> = {
  [C.kw]: 'tok-kw',
  [C.str]: 'tok-str',
  [C.type]: 'tok-type',
  [C.num]: 'tok-num',
  [C.cmt]: 'tok-cmt',
  [C.fn]: 'tok-fn',
  [C.prop]: 'tok-prop',
  [C.punc]: 'tok-punc',
};

export const gitlawbTheme: ThemeRegistrationRaw = {
  name: 'gitlawb',
  type: 'dark',
  colors: { 'editor.foreground': C.fg, 'editor.background': '#000000' },
  // Raw VS Code theme format: first entry (no scope) sets the global fg/bg
  settings: [
    { settings: { foreground: C.fg, background: '#000000' } },
    { scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: { foreground: C.cmt, fontStyle: 'italic' } },
    { scope: ['string', 'string.quoted', 'string.template', 'punctuation.definition.string',
              'constant.character.escape', 'string.regexp', 'markup.inline.raw'],
      settings: { foreground: C.str } },
    { scope: ['keyword', 'keyword.control', 'storage', 'storage.type', 'storage.modifier',
              'keyword.operator.new', 'keyword.operator.expression', 'variable.language',
              'entity.name.tag', 'support.type.builtin'],
      settings: { foreground: C.kw } },
    { scope: ['entity.name.type', 'entity.name.class', 'entity.name.namespace',
              'entity.other.inherited-class', 'support.class', 'support.type',
              'constant.language', 'constant.other', 'support.constant',
              'variable.other.constant', 'entity.name.constant'],
      settings: { foreground: C.type } },
    { scope: ['constant.numeric'], settings: { foreground: C.num } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.method',
              'markup.heading', 'markup.bold'],
      settings: { foreground: C.fn } },
    { scope: ['variable.other.property', 'variable.other.object.property',
              'support.type.property-name', 'meta.object-literal.key',
              'entity.other.attribute-name'],
      settings: { foreground: C.prop } },
    { scope: ['punctuation', 'punctuation.separator', 'punctuation.terminator',
              'meta.brace', 'keyword.operator'],
      settings: { foreground: C.punc } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
  ],
};

// Literal import per language so Vite splits each into its own lazy chunk.
const LANG_IMPORTERS: Record<ShikiLang, () => Promise<{ default: LanguageRegistration[] }>> = {
  typescript: () => import('@shikijs/langs/typescript'),
  tsx: () => import('@shikijs/langs/tsx'),
  javascript: () => import('@shikijs/langs/javascript'),
  jsx: () => import('@shikijs/langs/jsx'),
  json: () => import('@shikijs/langs/json'),
  jsonc: () => import('@shikijs/langs/jsonc'),
  markdown: () => import('@shikijs/langs/markdown'),
  css: () => import('@shikijs/langs/css'),
  scss: () => import('@shikijs/langs/scss'),
  html: () => import('@shikijs/langs/html'),
  shellscript: () => import('@shikijs/langs/shellscript'),
  rust: () => import('@shikijs/langs/rust'),
  python: () => import('@shikijs/langs/python'),
  go: () => import('@shikijs/langs/go'),
  yaml: () => import('@shikijs/langs/yaml'),
  toml: () => import('@shikijs/langs/toml'),
  sql: () => import('@shikijs/langs/sql'),
  docker: () => import('@shikijs/langs/docker'),
  diff: () => import('@shikijs/langs/diff'),
};

// Singleton on globalThis so dev HMR re-evals don't leak highlighters.
const g = globalThis as { __gitlawbShiki?: Promise<HighlighterCore> };
function getHighlighter(): Promise<HighlighterCore> {
  g.__gitlawbShiki ??= createHighlighterCore({
    themes: [gitlawbTheme],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
  return g.__gitlawbShiki;
}

const loadedLangs = new Set<ShikiLang>();
async function ensureLang(hl: HighlighterCore, lang: ShikiLang): Promise<void> {
  if (loadedLangs.has(lang)) return;
  const mod = await LANG_IMPORTERS[lang]();
  await hl.loadLanguage(...mod.default);
  loadedLangs.add(lang);
}

// Above these, callers fall back to plain escaped text.
export const MAX_HIGHLIGHT_LINES = 3000;
export const MAX_HIGHLIGHT_BYTES = 300_000;

function tooBig(code: string): boolean {
  if (code.length > MAX_HIGHLIGHT_BYTES) return true;
  let lines = 1;
  for (let i = 0; i < code.length; i++) if (code.charCodeAt(i) === 10) lines++;
  return lines > MAX_HIGHLIGHT_LINES;
}

/**
 * Whole-file tokenization → one HTML string per line (correct across
 * multi-line strings/comments/template literals).
 * Returns null on guard/error → caller falls back to plain text.
 */
export async function highlightToHtmlLines(code: string, lang: ShikiLang): Promise<string[] | null> {
  if (tooBig(code)) return null;
  try {
    const hl = await getHighlighter();
    await ensureLang(hl, lang);
    const { tokens } = hl.codeToTokens(code, { lang, theme: 'gitlawb' });
    return tokens.map(line =>
      line
        .map(t => {
          const cls = COLOR_CLASS[(t.color ?? '').toLowerCase()];
          const content = escapeHtml(t.content);
          return cls ? `<span class="${cls}">${content}</span>` : content;
        })
        .join(''),
    );
  } catch {
    return null;
  }
}

/** README/md-preview fenced blocks: same tokens, joined with \n. */
export async function highlightFenceHtml(code: string, lang: ShikiLang): Promise<string | null> {
  const lines = await highlightToHtmlLines(code, lang);
  return lines ? lines.join('\n') : null;
}
