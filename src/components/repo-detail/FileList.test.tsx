// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileList } from './FileList';
import type { RepoFile } from '../../types/repo';

const FILES: RepoFile[] = [
  { name: 'README.md', size: '3.8 KB', type: 'file' },
  { name: 'src', size: '—', type: 'dir' },
];

function LocationProbe() {
  const location = useLocation();
  return <output data-location>{location.pathname}{location.search}</output>;
}

describe('FileList', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders each full row as a link and navigates to the selected entry', async () => {
    act(() => root.render(
      <MemoryRouter initialEntries={['/repos/alice/demo']}>
        <FileList
          files={FILES}
          getEntryTo={entry => entry.type === 'dir' ? `?path=${entry.name}` : `?file=${entry.name}`}
        />
        <LocationProbe />
      </MemoryRouter>,
    ));

    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[data-row-link]'));
    expect(container.querySelectorAll('thead > tr > th')).toHaveLength(2);
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/repos/alice/demo?file=README.md');
    expect(links[1].getAttribute('href')).toBe('/repos/alice/demo?path=src');

    await act(async () => {
      links[0].dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }));
      await Promise.resolve();
    });

    expect(container.querySelector('[data-location]')?.textContent)
      .toBe('/repos/alice/demo?file=README.md');
  });
});
