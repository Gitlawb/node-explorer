import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { Input, Kbd } from '../register/controls';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useShortcuts } from '../../hooks/useShortcuts';
import { fetchRepos, shortDid, SERVER_SEARCH_ENABLED } from '../../lib/api';
import type { ApiRepo } from '../../lib/api';
import { getCachedAgents } from '../../hooks/useAgents';
import { loadDocSections, searchDocs, docHitPath } from '../../lib/docsSearch';
import type { DocSection, DocSource } from '../../lib/docsSearch';
import { cn } from '../../lib/utils';

let recentReposCache: ApiRepo[] | null = null;
let recentReposPromise: Promise<ApiRepo[]> | null = null;

function loadRecentRepos(): Promise<ApiRepo[]> {
  if (recentReposCache) return Promise.resolve(recentReposCache);
  if (!recentReposPromise) {
    recentReposPromise = fetchRepos({ limit: 200, offset: 0 })
      .then(({ repos }) => {
        recentReposCache = repos;
        recentReposPromise = null;
        return repos;
      })
      .catch(err => {
        recentReposPromise = null;
        throw err;
      });
  }
  return recentReposPromise;
}

const TAB_IDS = ['code', 'commits', 'pulls', 'issues', 'certs', 'events'];

/** Mirrors the DOCS list in DocsPage; the search indexes exactly these. */
const DOC_SOURCES: readonly DocSource[] = [
  { slug: 'quickstart', title: 'Quickstart' },
  { slug: 'agents', title: 'For AI agents' },
  { slug: 'protocol', title: 'Protocol' },
  { slug: 'node', title: 'Run a node' },
];

/** What a row points at, so each kind is recognisable before it is read. */
type PaletteKind = 'action' | 'repo' | 'agent' | 'doc';

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  kind: PaletteKind;
  /** Already matched against the query; skip the generic label/hint filter. */
  prematched?: boolean;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setOpenModal } = useShortcuts();
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const [repos, setRepos] = useState<ApiRepo[] | null>(SERVER_SEARCH_ENABLED ? [] : recentReposCache);
  const [docSections, setDocSections] = useState<DocSection[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const detailMatch = matchPath('/repos/:owner/:name', pathname);

  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setQuery('');
      setSel(0);
    }
  }

  useEffect(() => {
    if (!open) return;
    if (SERVER_SEARCH_ENABLED) {
      const ctrl = new AbortController();
      fetchRepos({ limit: 20, offset: 0, q: debouncedQuery || undefined, signal: ctrl.signal })
        .then(({ repos }) => setRepos(repos))
        .catch(() => {});
      return () => ctrl.abort();
    }
    let cancelled = false;
    loadRecentRepos()
      .then(list => { if (!cancelled) setRepos(list); })
      .catch(() => { if (!cancelled) setRepos([]); });
    return () => { cancelled = true; };
  }, [open, debouncedQuery]);

  // The four docs are ~29KB of markdown, fetched the first time the palette is
  // opened rather than at boot: nobody pays for the index who never searches.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadDocSections(DOC_SOURCES)
      .then(sections => { if (!cancelled) setDocSections(sections); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  const items = useMemo<(PaletteItem & { section: string })[]>(() => {
    const list: (PaletteItem & { section: string })[] = [];

    list.push({ id: 'nav-repos', section: 'actions', kind: 'action', label: 'go to repositories', run: () => navigate('/repos') });
    list.push({ id: 'nav-agents', section: 'actions', kind: 'action', label: 'go to agents', run: () => navigate('/agents') });

    if (detailMatch) {
      list.push({
        id: 'find-file', section: 'actions', kind: 'action', label: 'find file', hint: 't',
        run: () => setOpenModal('finder'),
      });
      for (const tab of TAB_IDS) {
        list.push({
          id: `tab-${tab}`, section: 'actions', kind: 'action', label: `open: ${tab}`,
          run: () => navigate(`${pathname}${tab === 'code' ? '' : `?tab=${tab}`}`),
        });
      }
    }

    const repoRows = (repos ?? []).filter(r =>
      SERVER_SEARCH_ENABLED || !query ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.owner_did.toLowerCase().includes(query.toLowerCase()) ||
        (r.description ?? '').toLowerCase().includes(query.toLowerCase()),
    );
    for (const r of repoRows.slice(0, 12)) {
      list.push({
        id: `repo-${r.id}`, kind: 'repo', section: SERVER_SEARCH_ENABLED ? 'repositories' : 'recent repos',
        label: `${shortDid(r.owner_did)}/${r.name}`,
        hint: r.description ?? undefined,
        run: () => navigate(`/repos/${r.owner_did}/${r.name}`),
      });
    }

    const agents = getCachedAgents();
    if (agents && query) {
      for (const a of agents.filter(a => a.did.toLowerCase().includes(query.toLowerCase())).slice(0, 5)) {
        list.push({
          id: `agent-${a.did}`, kind: 'agent', section: 'agents',
          label: shortDid(a.did), hint: a.capabilities.join(', '),
          run: () => navigate(`/repos?owner=${encodeURIComponent(a.did.split(':').pop() ?? '')}`),
        });
      }
    }

    for (const hit of searchDocs(docSections, query)) {
      list.push({
        id: `doc-${hit.docSlug}-${hit.id || 'top'}`,
        section: 'documentation',
        kind: 'doc',
        // A document's own top-level heading repeats its title; printing both
        // reads as "Quickstart · Quickstart".
        label: hit.heading === hit.docTitle ? hit.docTitle : `${hit.docTitle} · ${hit.heading}`,
        hint: hit.snippet,
        prematched: true,
        run: () => navigate(docHitPath(hit)),
      });
    }

    return list;
  }, [query, repos, docSections, detailMatch, pathname, navigate, setOpenModal]);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(
      i =>
        // Doc hits matched on section body, which is not shown in full, so the
        // label/hint test here would throw most of them away.
        i.prematched ||
        i.label.toLowerCase().includes(q) ||
        (i.hint ?? '').toLowerCase().includes(q),
    );
  }, [items, query]);

  const itemsKey = `${query}:${filtered.length}`;
  const [prevItemsKey, setPrevItemsKey] = useState(itemsKey);
  if (prevItemsKey !== itemsKey) {
    setPrevItemsKey(itemsKey);
    if (sel >= filtered.length) setSel(0);
  }

  useEffect(() => {
    // Section headings are siblings of the rows now, so the selected row is
    // found by its id rather than by index into the container's children.
    listRef.current
      ?.querySelector(`[data-index="${sel}"]`)
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [sel]);

  const pick = (item: PaletteItem) => {
    onClose();
    item.run();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // ShortcutsProvider returns early while a modal is open, so nothing else
    // handles Escape here — without this the palette can only be dismissed by
    // clicking outside it.
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel(s => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[sel]) {
      e.preventDefault();
      pick(filtered[sel]);
    }
  };

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  const listboxId = 'palette-listbox';
  const activeId = filtered[sel] ? `palette-option-${sel}` : undefined;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-background/70 px-4 pt-[10vh] backdrop-blur-[2px]"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={cn(
          'w-full max-w-[620px] overflow-hidden bg-background',
          'rounded-[var(--radius)] border border-border',
          'shadow-[0_24px_64px_-16px_rgba(0,0,0,0.45)]',
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Search row. The field carries a mark and sits flush in the panel —
            a ruled underline inside a framed panel read as a second box. */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <SearchIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          <Input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={activeId}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search repos, agents, docs…"
            aria-label="Search commands"
            autoComplete="off"
            spellCheck="false"
            className="h-13 flex-1 border-0 px-0 text-[14px]"
          />
          <Kbd className="shrink-0">esc</Kbd>
        </div>

        <div
          ref={listRef}
          id={listboxId}
          className="max-h-[54vh] overflow-y-auto p-1.5"
          role="listbox"
          aria-label="Results"
        >
          {filtered.map((item, i) => {
            const showSection = item.section !== (i > 0 ? filtered[i - 1].section : '');
            const selected = i === sel;
            return (
              <div key={item.id}>
                {showSection && (
                  <div
                    role="presentation"
                    className={cn(
                      'px-2.5 pb-1 text-[11px] font-medium text-muted',
                      i === 0 ? 'pt-1.5' : 'pt-3',
                    )}
                  >
                    {item.section}
                  </div>
                )}
                <div
                  id={`palette-option-${i}`}
                  role="option"
                  aria-selected={selected}
                  data-index={i}
                  onClick={() => pick(item)}
                  onPointerEnter={() => setSel(i)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 transition-colors',
                    selected ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/60',
                  )}
                >
                  <KindIcon
                    kind={item.kind}
                    aria-hidden="true"
                    className={cn('h-3.5 w-3.5 shrink-0', selected ? 'text-foreground' : 'text-muted')}
                  />
                  <span
                    className={cn(
                      'min-w-0 shrink-0 truncate text-[13px]',
                      selected ? 'font-medium text-foreground' : 'text-foreground/90',
                    )}
                  >
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="ml-auto min-w-0 truncate text-right text-[11.5px] text-muted">
                      {item.hint}
                    </span>
                  )}
                  {selected && (
                    <span aria-hidden="true" className="ml-2 shrink-0 text-[11px] text-muted">
                      ↵
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="m-0 text-[13px] text-foreground">No matches for “{query}”</p>
              <p className="m-0 mt-1 text-[12px] text-muted">
                Try a repository name, an agent DID, or a phrase from the docs.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2 text-[11px] text-muted">
          <span className="truncate">
            {SERVER_SEARCH_ENABLED
              ? 'Searching every repository on this node'
              : 'Searching the 200 most recently updated repos'}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <Kbd>↑↓</Kbd>
            <span>navigate</span>
            <Kbd>↵</Kbd>
            <span>open</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function SearchIcon({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...rest} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  );
}

/** One mark per kind, so a row's target is legible before the label is read. */
function KindIcon({ kind, className, ...rest }: { kind: PaletteKind } & React.SVGProps<SVGSVGElement>) {
  const paths: Record<PaletteKind, React.ReactNode> = {
    // Arrow — this row performs a navigation.
    action: <path d="M3 8h10m-4-4l4 4-4 4" />,
    // Book — a repository.
    repo: <path d="M3 3h7a2 2 0 012 2v8H5a2 2 0 00-2 2V3zm0 0v10" />,
    // Node with links — an agent identity.
    agent: <><circle cx="8" cy="5" r="2.2" /><path d="M3.5 13a4.5 4.5 0 019 0" /></>,
    // Page — a document section.
    doc: <path d="M4 2h5l3 3v9H4V2zm5 0v3h3" />,
  };
  return (
    <svg {...rest} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[kind]}
    </svg>
  );
}
