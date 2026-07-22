import { describe, expect, it } from 'vitest';
import {
  buildRepoCanonicalPath,
  buildRepoDescription,
  buildRepoSocialModel,
  cleanSocialText,
  escapeHtml,
  normalizeRepoOwner,
  repoCacheVersion,
  type RepoSocialInput,
} from './repoSocial';

const REPO: RepoSocialInput = {
  name: 'digital-garden',
  owner_did: 'did:key:z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM',
  description: 'A thoughtful collection of digital gardens.',
  is_public: true,
  default_branch: 'main',
  star_count: 42,
  created_at: '2026-01-02T03:04:05.000Z',
  updated_at: '2026-07-10T01:02:03.456Z',
  forked_from: null,
};

describe('normalizeRepoOwner', () => {
  it('normalizes raw and full did:key owners to the same canonical key', () => {
    const raw = normalizeRepoOwner('z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM');
    const did = normalizeRepoOwner('did:key:z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM');

    expect(raw).toEqual(did);
    expect(raw).toMatchObject({
      did: 'did:key:z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM',
      key: 'z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM',
      canonicalSegment: 'z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM',
      display: 'z6MkqRzA',
    });
  });

  it('decodes an encoded DID route segment', () => {
    const encoded = normalizeRepoOwner('did%3Akey%3Az6MkqRzACJ5iCDdkiymAPK3gq18z2iec');
    expect(encoded.did).toBe('did:key:z6MkqRzACJ5iCDdkiymAPK3gq18z2iec');
    expect(encoded.canonicalSegment).toBe('z6MkqRzACJ5iCDdkiymAPK3gq18z2iec');
    expect(buildRepoCanonicalPath(encoded.did, 'hello world')).toBe(
      '/repos/z6MkqRzACJ5iCDdkiymAPK3gq18z2iec/hello%20world',
    );
  });

  it('does not throw on malformed URL encoding', () => {
    expect(normalizeRepoOwner('z6Mk%broken').key).toBe('z6Mk%broken');
  });
});

describe('cleanSocialText', () => {
  it('normalizes Unicode and collapses unsafe whitespace and controls', () => {
    expect(cleanSocialText('  Cafe\u0301\n\t世界\u202E  ')).toBe('Café 世界');
  });

  it('clamps by grapheme without splitting Unicode emoji sequences', () => {
    const value = cleanSocialText('A👩‍💻B🇵🇭CD', 5);
    expect(value).toBe('A👩‍💻B🇵🇭…');
    expect(Array.from(value).at(-1)).toBe('…');
  });

  it('returns an explicit fallback description for empty text', () => {
    expect(buildRepoDescription({ ...REPO, description: ' \n\t ' })).toBe(
      'Explore z6MkqRzA/digital-garden on gitlawb explorer.',
    );
  });

  it('clamps long repository content in the social model', () => {
    const model = buildRepoSocialModel({
      ...REPO,
      name: '庭'.repeat(140),
      description: '🌱'.repeat(250),
    });

    expect(Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      .segment(model.name))).toHaveLength(96);
    expect(model.name.endsWith('…')).toBe(true);
    expect(model.canonicalName).toBe('庭'.repeat(140));
    expect(decodeURIComponent(model.canonicalPath).endsWith(`/repos/${model.owner.key}/${'庭'.repeat(140)}`))
      .toBe(true);
    expect(Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      .segment(model.description))).toHaveLength(200);
    expect(model.description.endsWith('…')).toBe(true);
  });
});

describe('escapeHtml', () => {
  it('escapes repository-controlled markup for text and quoted attributes', () => {
    const model = buildRepoSocialModel({
      ...REPO,
      name: '<script>alert("owned")</script>',
      description: `Ship & 'share' <b>bold</b>`,
    });

    expect(escapeHtml(model.title)).toBe(
      'z6MkqRzA/&lt;script&gt;alert(&quot;owned&quot;)&lt;/script&gt; · gitlawb explorer',
    );
    expect(escapeHtml(model.description)).toBe(
      'Ship &amp; &#39;share&#39; &lt;b&gt;bold&lt;/b&gt;',
    );
  });
});

describe('repoCacheVersion', () => {
  it('is stable for identical freshness inputs', () => {
    const first = repoCacheVersion(REPO);
    const second = repoCacheVersion({ ...REPO });

    expect(first).toBe('2026-07-10T01-02-03-456Z-42');
    expect(second).toBe(first);
  });

  it('changes with either the update timestamp or star count', () => {
    const initial = repoCacheVersion(REPO);
    expect(repoCacheVersion({ ...REPO, updated_at: '2026-07-10T01:02:04.456Z' }))
      .not.toBe(initial);
    expect(repoCacheVersion({ ...REPO, star_count: 43 })).not.toBe(initial);
  });
});

describe('buildRepoSocialModel', () => {
  it('builds a deterministic, canonical repository view model', () => {
    expect(buildRepoSocialModel(REPO)).toMatchObject({
      name: 'digital-garden',
      repositoryLabel: 'z6MkqRzA/digital-garden',
      title: 'z6MkqRzA/digital-garden · gitlawb explorer',
      description: REPO.description,
      branch: 'main',
      visibility: 'public',
      isFork: false,
      stars: 42,
      cacheVersion: '2026-07-10T01-02-03-456Z-42',
      canonicalPath: '/repos/z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM/digital-garden',
    });
  });

  it('normalizes unsafe numeric and optional fields', () => {
    const model = buildRepoSocialModel({
      ...REPO,
      is_public: false,
      default_branch: '',
      star_count: Number.NaN,
      forked_from: 'did:key:z6MkParent/repo',
    });

    expect(model).toMatchObject({
      branch: 'default',
      visibility: 'private',
      isFork: true,
      stars: 0,
    });
  });
});
