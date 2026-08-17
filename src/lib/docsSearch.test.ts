import { describe, it, expect } from 'vitest';
import GithubSlugger from 'github-slugger';
import { __parseSectionsForTest as parseSections, searchDocs, docHitPath } from './docsSearch';

const SOURCE = { slug: 'quickstart', title: 'Quickstart' };

const DOC = [
  '# Quickstart',
  '',
  'Your identity is a keypair generated on your machine.',
  '',
  '## 1. Install the CLI',
  '',
  '```sh',
  '# npm',
  'npm install -g @gitlawb/gl',
  '```',
  '',
  'Each installs two binaries.',
  '',
  '## 2. Publish a repository',
  '',
  'Run `gl init` to start.',
].join('\n');

describe('parseSections', () => {
  it('splits a document at its headings', () => {
    const sections = parseSections(DOC, SOURCE);
    expect(sections.map(s => s.heading)).toEqual([
      'Quickstart',
      '1. Install the CLI',
      '2. Publish a repository',
    ]);
  });

  it('splits identically when the file uses CRLF line endings', () => {
    // These files are checked out CRLF on Windows. Splitting on "\n" alone
    // leaves a trailing "\r" that the heading pattern cannot match, which
    // collapsed every document into a single undivided section.
    const crlf = parseSections(DOC.replace(/\n/g, '\r\n'), SOURCE);
    const lf = parseSections(DOC, SOURCE);
    expect(crlf.map(s => s.heading)).toEqual(lf.map(s => s.heading));
    expect(crlf).toHaveLength(3);
  });

  it('does not treat a shell comment inside a fence as a heading', () => {
    const sections = parseSections(DOC, SOURCE);
    expect(sections.map(s => s.heading)).not.toContain('npm');
    expect(sections[1].body).toContain('npm install -g @gitlawb/gl');
  });

  it('generates the same anchors the rendered page uses', () => {
    // marked-gfm-heading-id slugs headings with github-slugger; deriving the
    // rule by hand would drift and produce links to anchors that do not exist.
    const sections = parseSections(DOC, SOURCE);
    const slugger = new GithubSlugger();
    for (const section of sections) {
      expect(section.id).toBe(slugger.slug(section.heading));
    }
  });

  it('carries the document identity onto every section', () => {
    for (const section of parseSections(DOC, SOURCE)) {
      expect(section.docSlug).toBe('quickstart');
      expect(section.docTitle).toBe('Quickstart');
    }
  });
});

describe('searchDocs', () => {
  const sections = parseSections(DOC, SOURCE);

  it('ignores queries shorter than two characters', () => {
    expect(searchDocs(sections, 'a')).toEqual([]);
    expect(searchDocs(sections, ' ')).toEqual([]);
  });

  it('finds a term that appears only in the prose', () => {
    const hits = searchDocs(sections, 'keypair');
    expect(hits).toHaveLength(1);
    expect(hits[0].heading).toBe('Quickstart');
    expect(hits[0].snippet).toContain('keypair');
  });

  it('finds a term that appears only inside a fenced command', () => {
    const hits = searchDocs(sections, 'gitlawb/gl');
    expect(hits.map(h => h.heading)).toContain('1. Install the CLI');
  });

  it('ranks a heading match above a body-only match', () => {
    const hits = searchDocs(sections, 'install');
    expect(hits[0].heading).toBe('1. Install the CLI');
  });

  it('respects the result limit', () => {
    expect(searchDocs(sections, 'the', 2).length).toBeLessThanOrEqual(2);
  });

  it('strips inline markdown from the snippet', () => {
    // A result row is plain text, so `**bold**` and backticks would otherwise
    // be shown literally.
    const doc = ['## Verify', '', 'Your push is recorded as a **certificate**, see `gl cert show`.'].join('\n');
    const [hit] = searchDocs(parseSections(doc, SOURCE), 'certificate');
    expect(hit.snippet).toContain('a certificate');
    expect(hit.snippet).not.toContain('**');
    expect(hit.snippet).not.toContain('`');
  });

  it('keeps underscores, which carry meaning in identifiers', () => {
    const doc = ['## Fields', '', 'The from_peer column is null for local pushes.'].join('\n');
    const [hit] = searchDocs(parseSections(doc, SOURCE), 'from_peer');
    expect(hit.snippet).toContain('from_peer');
  });
});

describe('docHitPath', () => {
  it('links to the heading anchor', () => {
    const section = parseSections(DOC, SOURCE)[1];
    expect(docHitPath(section)).toBe('/docs/quickstart#1-install-the-cli');
  });

  it('links to the document when a section has no anchor', () => {
    expect(
      docHitPath({ docSlug: 'protocol', docTitle: 'Protocol', id: '', heading: 'Protocol', level: 1, body: '' }),
    ).toBe('/docs/protocol');
  });
});
