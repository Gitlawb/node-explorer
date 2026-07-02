import { describe, it, expect } from 'vitest';
import {
  resolveShikiLang,
  getShikiLangFromPath,
  escapeHtml,
  findReadmeName,
  isMarkdownPath,
  normalizeRepoPath,
} from './lang';

describe('resolveShikiLang', () => {
  it('resolves common aliases', () => {
    expect(resolveShikiLang('ts')).toBe('typescript');
    expect(resolveShikiLang('js')).toBe('javascript');
    expect(resolveShikiLang('py')).toBe('python');
    expect(resolveShikiLang('bash')).toBe('shellscript');
    expect(resolveShikiLang('yml')).toBe('yaml');
  });

  it('ignores case and trailing fence metadata', () => {
    expect(resolveShikiLang('TS')).toBe('typescript');
    expect(resolveShikiLang('rust title="main.rs"')).toBe('rust');
  });

  it('returns null for unknown or missing info', () => {
    expect(resolveShikiLang('brainfuck')).toBeNull();
    expect(resolveShikiLang('')).toBeNull();
    expect(resolveShikiLang(undefined)).toBeNull();
    expect(resolveShikiLang(null)).toBeNull();
  });
});

describe('getShikiLangFromPath', () => {
  it('resolves by file extension', () => {
    expect(getShikiLangFromPath('src/lib/api.ts')).toBe('typescript');
    expect(getShikiLangFromPath('README.md')).toBe('markdown');
    expect(getShikiLangFromPath('Cargo.toml')).toBe('toml');
  });

  it('recognizes Dockerfiles with and without extensions', () => {
    expect(getShikiLangFromPath('Dockerfile')).toBe('docker');
    expect(getShikiLangFromPath('docker/Dockerfile.prod')).toBe('docker');
  });

  it('returns null for extensionless or unknown files', () => {
    expect(getShikiLangFromPath('LICENSE')).toBeNull();
    expect(getShikiLangFromPath('binary.exe')).toBeNull();
  });
});

describe('escapeHtml', () => {
  it('escapes ampersands, angle brackets, and nothing else', () => {
    expect(escapeHtml('<script>a && b</script>')).toBe(
      '&lt;script&gt;a &amp;&amp; b&lt;/script&gt;',
    );
    expect(escapeHtml('plain "text"')).toBe('plain "text"');
  });
});

describe('findReadmeName', () => {
  it('finds the canonical README first', () => {
    const entries = [{ name: 'readme.md' }, { name: 'README.md' }];
    expect(findReadmeName(entries)).toBe('README.md');
  });

  it('falls back through the accepted variants', () => {
    expect(findReadmeName([{ name: 'readme.txt' }])).toBe('readme.txt');
  });

  it('returns null when no readme exists', () => {
    expect(findReadmeName([{ name: 'main.rs' }])).toBeNull();
  });
});

describe('isMarkdownPath', () => {
  it('accepts .md and .markdown, case-insensitively', () => {
    expect(isMarkdownPath('docs/guide.md')).toBe(true);
    expect(isMarkdownPath('CHANGELOG.MARKDOWN')).toBe(true);
  });

  it('rejects other extensions', () => {
    expect(isMarkdownPath('mdfile.txt')).toBe(false);
    expect(isMarkdownPath('script.mdx')).toBe(false);
  });
});

describe('normalizeRepoPath', () => {
  it('drops empty and dot segments', () => {
    expect(normalizeRepoPath('./docs//guide.md')).toBe('docs/guide.md');
  });

  it('resolves parent segments', () => {
    expect(normalizeRepoPath('docs/../src/main.rs')).toBe('src/main.rs');
  });

  it('never escapes the repo root', () => {
    expect(normalizeRepoPath('../../etc/passwd')).toBe('etc/passwd');
    expect(normalizeRepoPath('a/../../b')).toBe('b');
  });
});
