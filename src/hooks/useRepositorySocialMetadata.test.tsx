// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Repository } from '../types/repo';
import { useRepositorySocialMetadata } from './useRepositorySocialMetadata';

const REPOSITORY: Repository = {
  id: 'repo-1',
  owner: 'did:key:z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM',
  name: 'digital-garden',
  description: 'A thoughtful collection of digital gardens.',
  branch: 'main',
  updatedAt: '2m ago',
  createdAt: 'Jul 10, 2026',
  stars: 42,
  visibility: 'public',
  isMirror: false,
  commits: [],
  files: [],
  cloneUrl: 'https://node.gitlawb.com/example.git',
  updatedAtRaw: '2026-07-10T01:02:03.456Z',
  createdAtRaw: '2026-01-02T03:04:05.000Z',
};

function Harness({ repo }: { repo: Repository | null }) {
  useRepositorySocialMetadata(repo);
  return null;
}

function metaContent(selector: string): string | null {
  return document.head.querySelector<HTMLMetaElement>(selector)?.content ?? null;
}

describe('useRepositorySocialMetadata', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true;
    document.head.innerHTML = '<title>gitlawb explorer</title>';
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('updates route metadata and restores the generic site metadata on cleanup', () => {
    act(() => root.render(<Harness repo={REPOSITORY} />));

    expect(document.title).toBe('z6MkqRzA/digital-garden · gitlawb explorer');
    expect(metaContent('meta[property="og:description"]')).toBe(REPOSITORY.description);
    expect(metaContent('meta[property="og:image"]')).toContain(
      '/og/repos/z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM/digital-garden/',
    );
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href)
      .toBe(`${window.location.origin}/repos/z6MkqRzACJ5iCDdkiymAPK3gq18z2iecZHeAuUyW6JnwRfoM/digital-garden`);

    act(() => root.render(<Harness repo={null} />));

    expect(document.title).toBe('gitlawb explorer');
    expect(metaContent('meta[property="og:image"]')).toBe(`${window.location.origin}/og.png`);
    expect(metaContent('meta[name="robots"]')).toBe('index,follow');
  });

  it('does not expose private repository metadata in social tags', () => {
    act(() => root.render(
      <Harness repo={{ ...REPOSITORY, visibility: 'private', description: 'secret description' }} />,
    ));

    expect(document.title).toBe('private repository · gitlawb explorer');
    expect(metaContent('meta[property="og:description"]')).not.toContain('secret');
    expect(metaContent('meta[property="og:image"]')).toBe(`${window.location.origin}/og.png`);
    expect(metaContent('meta[name="robots"]')).toBe('noindex,nofollow');
  });
});
