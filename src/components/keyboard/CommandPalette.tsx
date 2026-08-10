import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { Input } from '@heroui/react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useShortcuts } from '../../hooks/useShortcuts';
import { fetchRepos, shortDid, SERVER_SEARCH_ENABLED } from '../../lib/api';
import type { ApiRepo } from '../../lib/api';
import { getCachedAgents } from '../../hooks/useAgents';
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

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
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

  const items = useMemo<(PaletteItem & { section: string })[]>(() => {
    const list: (PaletteItem & { section: string })[] = [];

    list.push({ id: 'nav-repos', section: 'actions', label: 'go to repositories', run: () => navigate('/repos') });
    list.push({ id: 'nav-agents', section: 'actions', label: 'go to agents', run: () => navigate('/agents') });

    if (detailMatch) {
      list.push({
        id: 'find-file', section: 'actions', label: 'find file', hint: 't',
        run: () => setOpenModal('finder'),
      });
      for (const tab of TAB_IDS) {
        list.push({
          id: `tab-${tab}`, section: 'actions', label: `open: ${tab}`,
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
        id: `repo-${r.id}`, section: SERVER_SEARCH_ENABLED ? 'repositories' : 'recent repos',
        label: `${shortDid(r.owner_did)}/${r.name}`,
        hint: r.description ?? undefined,
        run: () => navigate(`/repos/${r.owner_did}/${r.name}`),
      });
    }

    const agents = getCachedAgents();
    if (agents && query) {
      for (const a of agents.filter(a => a.did.toLowerCase().includes(query.toLowerCase())).slice(0, 5)) {
        list.push({
          id: `agent-${a.did}`, section: 'agents',
          label: shortDid(a.did), hint: a.capabilities.join(', '),
          run: () => navigate(`/repos?owner=${encodeURIComponent(a.did.split(':').pop() ?? '')}`),
        });
      }
    }

    return list;
  }, [query, repos, detailMatch, pathname, navigate, setOpenModal]);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(i => i.label.toLowerCase().includes(q) || (i.hint ?? '').toLowerCase().includes(q));
  }, [items, query]);

  const itemsKey = `${query}:${filtered.length}`;
  const [prevItemsKey, setPrevItemsKey] = useState(itemsKey);
  if (prevItemsKey !== itemsKey) {
    setPrevItemsKey(itemsKey);
    if (sel >= filtered.length) setSel(0);
  }

  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[sel] as HTMLElement | undefined;
    item?.scrollIntoView?.({ block: 'nearest' });
  }, [sel]);

  const pick = (item: PaletteItem) => {
    onClose();
    item.run();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[580px] bg-surface border border-border rounded-lg shadow-overlay overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <Input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="jump to repo, agent, or action…"
          aria-label="command palette"
          autoComplete="off"
          spellCheck="false"
          variant="secondary"
          className="w-full h-12 px-5 border-b border-border rounded-none shadow-none"
        />
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto" role="listbox" aria-label="commands">
          {filtered.map((item, i) => {
            const prevSection = i > 0 ? filtered[i - 1].section : '';
            const showSection = item.section !== prevSection;
            return (
              <div key={item.id} role="option" aria-selected={i === sel}>
                {showSection && (
                  <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted px-5 pt-3 pb-1">
                    {item.section}
                  </div>
                )}
                <div
                  onClick={() => pick(item)}
                  onPointerEnter={() => setSel(i)}
                  className={cn(
                    'flex items-baseline gap-3 px-5 py-2 text-[12.5px] cursor-pointer transition-colors',
                    i === sel ? 'bg-surface-secondary text-foreground' : 'text-muted',
                  )}
                >
                  <span className={cn('truncate', i === sel && 'font-semibold')}>{item.label}</span>
                  {item.hint && (
                    <span className="ml-auto shrink-0 max-w-[45%] truncate text-[11px] text-muted">
                      {item.hint}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-6 text-center text-[12.5px] text-muted">nothing matches</div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 h-9 border-t border-border text-[11px] text-muted">
          <span>{!SERVER_SEARCH_ENABLED && 'searching the 200 most recently updated repos'}</span>
          <span>↑↓ navigate · ↵ open · esc close</span>
        </div>
      </div>
    </div>
  );
}
