// Tiny synchronous language/path helpers — kept free of shiki/marked imports
// so the pages that only need detection don't pull the rendering engines into
// the entry bundle (those load lazily via dynamic import).

export type ShikiLang =
  | 'typescript' | 'tsx' | 'javascript' | 'jsx' | 'json' | 'jsonc'
  | 'markdown' | 'css' | 'scss' | 'html' | 'shellscript' | 'rust'
  | 'python' | 'go' | 'yaml' | 'toml' | 'sql' | 'docker' | 'diff';

// Fence-info strings / file extensions → shiki lang ids
const ALIASES: Record<string, ShikiLang> = {
  ts: 'typescript', typescript: 'typescript', mts: 'typescript', cts: 'typescript',
  tsx: 'tsx',
  js: 'javascript', javascript: 'javascript', mjs: 'javascript', cjs: 'javascript', node: 'javascript',
  jsx: 'jsx',
  json: 'json', jsonc: 'jsonc', json5: 'jsonc',
  md: 'markdown', markdown: 'markdown',
  css: 'css', scss: 'scss', sass: 'scss', less: 'css',
  html: 'html', htm: 'html', xml: 'html', svg: 'html', vue: 'html',
  sh: 'shellscript', bash: 'shellscript', shell: 'shellscript', zsh: 'shellscript',
  shellscript: 'shellscript', console: 'shellscript', shellsession: 'shellscript',
  rust: 'rust', rs: 'rust',
  python: 'python', py: 'python',
  go: 'go', golang: 'go',
  yaml: 'yaml', yml: 'yaml',
  toml: 'toml', sql: 'sql',
  docker: 'docker', dockerfile: 'docker',
  diff: 'diff', patch: 'diff',
};

export function resolveShikiLang(info: string | undefined | null): ShikiLang | null {
  const id = (info ?? '').trim().toLowerCase().split(/\s+/)[0] ?? '';
  return ALIASES[id] ?? null;
}

export function getShikiLangFromPath(path: string): ShikiLang | null {
  const base = path.toLowerCase().split('/').pop() ?? '';
  if (base === 'dockerfile' || base.startsWith('dockerfile.')) return 'docker';
  const ext = base.includes('.') ? base.split('.').pop()! : '';
  return ALIASES[ext] ?? null;
}

export function escapeHtml(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const README_NAMES = ['README.md', 'readme.md', 'README', 'readme.txt'];

export function findReadmeName(entries: { name: string }[]): string | null {
  return README_NAMES.find(n => entries.some(e => e.name === n)) ?? null;
}

export function isMarkdownPath(path: string): boolean {
  return /\.(md|markdown)$/i.test(path);
}

// Resolve a repo-relative path: drop empty/"." segments, let ".." pop without
// ever escaping the repo root — collapses every "../../" variant from README
// relative links onto its one canonical path.
export function normalizeRepoPath(path: string): string {
  const out: string[] = [];
  for (const seg of path.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      out.pop();
      continue;
    }
    out.push(seg);
  }
  return out.join('/');
}
