import { useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, useParams } from 'react-router-dom';
import { MarkdownView } from '../components/repo-detail/MarkdownView';
import { TocRail } from '../components/repo-detail/TocRail';
import { extractTocHeadings } from '../lib/toc';
import { MicroLabel } from '../components/ui/MicroLabel';
import { cn } from '../lib/utils';

/** Docs are static markdown served from public/docs/ — same files agents fetch raw. */
const DOCS = [
  { slug: 'quickstart', label: 'quickstart', title: 'Quickstart', blurb: 'Install gl and make your first signed push' },
  { slug: 'agents', label: 'for agents', title: 'For AI agents', blurb: 'End-to-end instructions for operating on gitlawb' },
  { slug: 'protocol', label: 'protocol', title: 'Protocol', blurb: 'Identity, storage, networking, and ref consensus' },
  { slug: 'node', label: 'run a node', title: 'Run a node', blurb: 'Stake, register, and operate a gitlawb node' },
] as const;

type DocSlug = (typeof DOCS)[number]['slug'];

const isDocSlug = (s: string): s is DocSlug => DOCS.some(d => d.slug === s);

interface DocState {
  /** Slug the html/error belong to — content for another slug renders as loading */
  slug: string | null;
  html: string | null;
  error: string | null;
}

export default function DocsPage() {
  const { slug = 'quickstart' } = useParams();
  const [loaded, setLoaded] = useState<DocState>({ slug: null, html: null, error: null });

  useEffect(() => {
    if (!isDocSlug(slug)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/docs/${slug}.md`);
        if (!res.ok) throw new Error(`failed to load doc (${res.status})`);
        const md = await res.text();
        const { renderDocsMarkdown } = await import('../lib/markdown');
        const html = await renderDocsMarkdown(md);
        if (!cancelled) setLoaded({ slug, html, error: null });
      } catch (e) {
        if (!cancelled) {
          setLoaded({ slug, html: null, error: e instanceof Error ? e.message : 'failed to load doc' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Crawlers get per-section titles from api/docs-page.ts; this keeps the
  // document title in sync during client-side navigation.
  useEffect(() => {
    const doc = DOCS.find(d => d.slug === slug);
    if (!doc) return;
    const previous = document.title;
    document.title = `${doc.label} · docs · gitlawb explorer`;
    return () => {
      document.title = previous;
    };
  }, [slug]);

  const state: Omit<DocState, 'slug'> =
    loaded.slug === slug ? loaded : { html: null, error: null };

  const headings = useMemo(
    () => (state.html ? extractTocHeadings(state.html) : []),
    [state.html],
  );

  if (!isDocSlug(slug)) return <Navigate to="/docs/quickstart" replace />;
  const doc = DOCS.find(d => d.slug === slug)!;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <aside className="lg:w-48 shrink-0">
          <MicroLabel className="mb-3">docs</MicroLabel>
          <nav aria-label="documentation" className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-none">
            {DOCS.map(d => (
              <NavLink
                key={d.slug}
                to={`/docs/${d.slug}`}
                className={({ isActive }) =>
                  cn(
                    'px-2 py-1.5 text-[13px] lowercase whitespace-nowrap rounded-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm',
                    isActive
                      ? 'text-foreground font-bold bg-muted'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {d.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden lg:block mt-6 pt-4 border-t border-border text-[12px] text-muted-foreground space-y-1.5">
            <p>
              <a className="hover:text-foreground underline" href="/skill.md">skill.md</a>
              {' — agent skill file'}
            </p>
            <p>
              <a className="hover:text-foreground underline" href="/llms.txt">llms.txt</a>
              {' — machine index'}
            </p>
            <p>
              <a className="hover:text-foreground underline" href={`/docs/${slug}.md`}>raw markdown</a>
              {' — this page'}
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 max-w-[820px]">
          {state.error && (
            <p className="text-[13px] text-muted-foreground py-8">{doc.title}: {state.error}</p>
          )}
          {!state.error && state.html === null && (
            <p className="text-[13px] text-muted-foreground py-8">loading…</p>
          )}
          {state.html !== null && <MarkdownView html={state.html} />}
        </main>

        {headings.length >= 3 && <TocRail headings={headings} />}
      </div>
    </div>
  );
}
