import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Navigate, useParams, useLocation } from 'react-router-dom';

import { DocArticle } from '../components/docs/DocArticle';
import { DocsPager } from '../components/docs/DocsPager';
import { AgentTextPanel } from '../components/docs/AgentTextPanel';
import { TocRail } from '../components/repo-detail/TocRail';
import { Skeleton } from '../components/register/controls';
import { ScrollProgress } from '../components/ui/scroll-progress';
import { extractTocHeadings } from '../lib/toc';
import { cn } from '../lib/utils';

/** Docs are static markdown served from public/docs/ — same files agents fetch raw. */
const DOCS = [
  { slug: 'quickstart', label: 'Quickstart', title: 'Quickstart', blurb: 'Install gl and make your first signed push' },
  { slug: 'agents', label: 'For agents', title: 'For AI agents', blurb: 'End-to-end instructions for operating on gitlawb' },
  { slug: 'protocol', label: 'Protocol', title: 'Protocol', blurb: 'Identity, storage, networking, and ref consensus' },
  { slug: 'node', label: 'Run a node', title: 'Run a node', blurb: 'Register and operate a gitlawb node' },
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
  const { hash } = useLocation();
  const docNavRef = useRef<HTMLElement>(null);
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

  // Arriving at /docs/<slug>#<heading> — from the command palette or a shared
  // link — the browser only scrolls for a hash present at load. Under client
  // navigation the target does not exist until the markdown has rendered, so
  // the scroll waits for the document to land.
  //
  // The hash comes from the router and is a dependency. Reading
  // window.location.hash and keying only on the slug meant a jump into a
  // document already open changed nothing this effect watched: following a
  // second search result within the same page left the reader where they were.
  useEffect(() => {
    if (loaded.slug !== slug || !loaded.html) return;
    const id = decodeURIComponent(hash.slice(1));
    if (!id) return;
    // Scrolled directly, not inside requestAnimationFrame. DocArticle rewrites
    // this markup in a layout effect — dropping the duplicate h1, wrapping each
    // fence — and a child layout effect runs before this parent effect, so the
    // heading already sits at its final offset here. Waiting for a frame only
    // added a dependency on the tab being painted: opened in a background tab,
    // the callback was deferred and the reader arrived at the top of the page.
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, [loaded.slug, loaded.html, slug, hash]);

  // Keep the current document visible in the section nav.
  //
  // Below lg the nav is a horizontal strip, and four labels come to 419px in
  // 351px of room. Opening /docs/node therefore left "Run a node" past the
  // right edge with the strip unscrolled, so the reader could not see which
  // document they were in. Only the strip scrolls, never the page.
  useLayoutEffect(() => {
    const nav = docNavRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]') ??
      nav?.querySelector<HTMLElement>('a[class*="bg-foreground"]');
    if (!nav || !active) return;
    const navBox = nav.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    if (box.left < navBox.left) nav.scrollLeft -= navBox.left - box.left + 12;
    else if (box.right > navBox.right) nav.scrollLeft += box.right - navBox.right + 12;
  }, [slug]);

  const headings = useMemo(
    () => (state.html ? extractTocHeadings(state.html) : []),
    [state.html],
  );

  if (!isDocSlug(slug)) return <Navigate to="/docs/quickstart" replace />;
  const index = DOCS.findIndex(d => d.slug === slug);
  const doc = DOCS[index];

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 sm:px-6 lg:px-8">
      <ScrollProgress />

      <div className="flex flex-col gap-8 pt-8 lg:flex-row lg:gap-12">

        {/* Section nav. Sticky on wide screens so the set of documents stays
            in view while reading a long one. */}
        <aside className="shrink-0 lg:w-[215px]">
          <div className="lg:sticky lg:top-20">
            <p className="m-0 mb-3 text-[11.5px] text-muted">Documentation</p>
            <nav
              ref={docNavRef}
              aria-label="documentation"
              className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
            >
              {DOCS.map(d => (
                <NavLink
                  key={d.slug}
                  to={`/docs/${d.slug}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center whitespace-nowrap rounded-[var(--radius-control)] px-3.5 sm:px-3 text-[13.5px] transition-colors',
                      'h-10 sm:h-auto sm:py-1.5',
                      isActive
                        ? 'bg-foreground font-medium text-background'
                        : 'text-muted hover:bg-surface-secondary hover:text-foreground',
                    )
                  }
                >
                  {d.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 hidden lg:block">
              <AgentTextPanel slug={slug} />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-8">
            <h1 className="m-0 text-[30px] font-semibold leading-tight text-foreground">
              {doc.title}
            </h1>
            <p className="m-0 mt-2 max-w-[68ch] text-[15px] text-muted">{doc.blurb}</p>
          </header>

          <article className="max-w-[72ch]">
            {state.error && (
              <div className="py-10">
                <p className="m-0 text-[14px] font-medium text-danger">{state.error}</p>
                <p className="m-0 mt-2 text-[13px] text-muted">
                  The source file is still readable directly at{' '}
                  <a href={`/docs/${slug}.md`} className="text-accent hover:underline">
                    /docs/{slug}.md
                  </a>
                  .
                </p>
              </div>
            )}
            {!state.error && state.html === null && (
              <div className="flex flex-col gap-3 py-6" aria-busy="true">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-28 w-full mt-3" />
                <Skeleton className="h-4 w-10/12 mt-3" />
                <Skeleton className="h-4 w-9/12" />
              </div>
            )}
            {state.html !== null && <DocArticle html={state.html} />}
          </article>

          {/* Below the article on narrow screens, where the sidebar is not
              sticky and the panel would otherwise sit above the content. */}
          <div className="mt-10 lg:hidden">
            <AgentTextPanel slug={slug} />
          </div>

          <DocsPager previous={DOCS[index - 1]} next={DOCS[index + 1]} />
        </main>

        {headings.length >= 3 && <TocRail headings={headings} />}
      </div>
    </div>
  );
}
