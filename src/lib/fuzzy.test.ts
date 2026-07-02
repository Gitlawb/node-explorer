import { describe, it, expect } from 'vitest';
import { fuzzyScore, fuzzyFilter } from './fuzzy';

describe('fuzzyScore', () => {
  it('returns 0 for an empty query', () => {
    expect(fuzzyScore('', 'anything')).toBe(0);
  });

  it('returns null when the query is longer than the candidate', () => {
    expect(fuzzyScore('abcdef', 'abc')).toBeNull();
  });

  it('returns null when query chars do not appear in order', () => {
    expect(fuzzyScore('ba', 'ab')).toBeNull();
    expect(fuzzyScore('xyz', 'src/lib/api.ts')).toBeNull();
  });

  it('matches case-insensitively', () => {
    expect(fuzzyScore('README', 'readme.md')).not.toBeNull();
    expect(fuzzyScore('readme', 'README.md')).not.toBeNull();
  });

  it('scores an exact-prefix basename match above a scattered match', () => {
    const basename = fuzzyScore('api', 'src/lib/api.ts')!;
    const scattered = fuzzyScore('api', 'src/pages/RepositoriesPage.tsx')!;
    expect(basename).toBeGreaterThan(scattered);
  });

  it('rewards consecutive runs over gapped matches', () => {
    const consecutive = fuzzyScore('abc', 'abcdef')!;
    const gapped = fuzzyScore('abc', 'axbxcx')!;
    expect(consecutive).toBeGreaterThan(gapped);
  });

  it('prefers the shorter candidate at equal match quality', () => {
    const short = fuzzyScore('app', 'App.tsx')!;
    const long = fuzzyScore('app', 'App.tsx.backup')!;
    expect(short).toBeGreaterThan(long);
  });
});

describe('fuzzyFilter', () => {
  const files = [
    'src/lib/api.ts',
    'src/lib/fuzzy.ts',
    'src/pages/AgentsPage.tsx',
    'README.md',
    'package.json',
  ];

  it('returns the first N candidates unchanged for a blank query', () => {
    expect(fuzzyFilter('', files, 3)).toEqual(files.slice(0, 3));
    expect(fuzzyFilter('   ', files, 3)).toEqual(files.slice(0, 3));
  });

  it('drops non-matching candidates', () => {
    expect(fuzzyFilter('fuzzy', files)).toEqual(['src/lib/fuzzy.ts']);
  });

  it('sorts matches best-first', () => {
    const result = fuzzyFilter('api', files);
    expect(result[0]).toBe('src/lib/api.ts');
  });

  it('respects the limit', () => {
    expect(fuzzyFilter('s', files, 2)).toHaveLength(2);
  });
});
