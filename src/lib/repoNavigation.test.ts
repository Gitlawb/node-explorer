import { describe, expect, it } from 'vitest';
import { buildRepoCodeSearch } from './repoNavigation';

describe('buildRepoCodeSearch', () => {
  it('builds a canonical file URL and removes stale code state', () => {
    const current = new URLSearchParams(
      'tab=commits&path=old&file=old.ts&view=code&force=1&ref=head',
    );

    expect(buildRepoCodeSearch(current, { file: './docs/a b#?.md' })).toBe(
      '?ref=head&file=docs%2Fa+b%23%3F.md',
    );
  });

  it('normalizes directory paths without letting them escape the repo root', () => {
    expect(buildRepoCodeSearch(new URLSearchParams(), { path: '../../src/./components' }))
      .toBe('?path=src%2Fcomponents');
  });

  it('returns to the code root without leaving an empty query string', () => {
    expect(buildRepoCodeSearch(new URLSearchParams('path=src'))).toBe('');
  });

  it('keeps code view and force state only when a file target requests them', () => {
    expect(buildRepoCodeSearch(new URLSearchParams(), {
      file: 'README.md',
      view: 'code',
      force: true,
    })).toBe('?file=README.md&view=code&force=1');
  });
});
