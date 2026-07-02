// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { extractTocHeadings } from './toc';

describe('extractTocHeadings', () => {
  it('extracts h1–h4 headings that carry ids', () => {
    const html = `
      <h1 id="title">Title</h1>
      <p>intro</p>
      <h2 id="setup">Setup</h2>
      <h3 id="deps">Dependencies</h3>
      <h4 id="notes">Notes</h4>
    `;
    expect(extractTocHeadings(html)).toEqual([
      { id: 'title', text: 'Title', level: 1 },
      { id: 'setup', text: 'Setup', level: 2 },
      { id: 'deps', text: 'Dependencies', level: 3 },
      { id: 'notes', text: 'Notes', level: 4 },
    ]);
  });

  it('skips headings without ids, empty headings, and h5+', () => {
    const html = `
      <h2>No id</h2>
      <h2 id="empty">   </h2>
      <h5 id="deep">Too deep</h5>
      <h2 id="kept">Kept</h2>
    `;
    expect(extractTocHeadings(html)).toEqual([{ id: 'kept', text: 'Kept', level: 2 }]);
  });

  it('uses the text content of nested markup', () => {
    const html = '<h2 id="link"><a href="#x">Linked <code>heading</code></a></h2>';
    expect(extractTocHeadings(html)).toEqual([
      { id: 'link', text: 'Linked heading', level: 2 },
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(extractTocHeadings('')).toEqual([]);
  });
});
