import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { fetchRepos, shortDid, SERVER_SEARCH_ENABLED } from '../../lib/api';
import type { ApiRepo } from '../../lib/api';
import { getCachedAgents } from '../../hooks/useAgents';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useShortcuts } from '../../hooks/useShortcuts';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';

interface PaletteItem {
  id: string;
  section: string;
  label: string;
  hint?: string;
  run: () => void;
}

// One-shot session cache for the client-side repo list (server q= not
// available until the node's search deploy; see SERVER_SEARCH_ENABLED).
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

  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const detailMatch = matchPath('/repos/:owner/:name', pathname);

  // Reset per open
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setQuery('');
      setSel(0);
    }
  }

  // Repo source: server search when available, else one-shot recent list
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

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = (s: string) => !q || s.toLowerCase().includes(q);
    const list: PaletteItem[] = [];

    // Actions
    if (matches('go to repositories')) {
      list.push({ id: 'nav-repos', section: 'actions', label: 'go to repositories', run: () => navigate('/repos') });
    }
    if (matches('go to agents')) {
      list.push({ id: 'nav-agents', section: 'actions', label: 'go to agents', run: () => navigate('/agents') });
    }
    if (detailMatch) {
      if (matches('find file')) {
        list.push({
          id: 'find-file', section: 'actions', label: 'find file', hint: 't',
          run: () => setOpenModal('finder'),
        });
      }
      for (const tab of TAB_IDS) {
        if (matches(`open ${tab}`)) {
          list.push({
            id: `tab-${tab}`, section: 'actions', label: `open: ${tab}`,
            run: () => navigate(`${pathname}${tab === 'code' ? '' : `?tab=${tab}`}`),
          });
        }
      }
    }

    // Repos
    const repoRows = (repos ?? []).filter(r =>
      SERVER_SEARCH_ENABLED
        ? true
        : !q ||
          r.name.toLowerCase().includes(q) ||
          r.owner_did.toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q),
    );
    for (const r of repoRows.slice(0, 12)) {
      list.push({
        id: `repo-${r.id}`,
        section: SERVER_SEARCH_ENABLED ? 'repositories' : 'recent repos',
        label: `${shortDid(r.owner_did)}/${r.name}`,
        hint: r.description ?? undefined,
        run: () => navigate(`/repos/${r.owner_did}/${r.name}`),
      });
    }

    // Agents (cache only)
    const agents = getCachedAgents();
    if (agents && q) {
      for (const a of agents.filter(a => a.did.toLowerCase().includes(q)).slice(0, 5)) {
        list.push({
          id: `agent-${a.did}`,
          section: 'agents',
          label: shortDid(a.did),
          hint: a.capabilities.join(', '),
          run: () => navigate(`/repos?owner=${encodeURIComponent(a.did.split(':').pop() ?? '')}`),
        });
      }
    }

    return list;
  }, [query, repos, detailMatch, pathname, navigate, setOpenModal]);

  // Render-phase clamp when items shrink
  const itemsKey = `${query}:${items.length}`;
  const [prevItemsKey, setPrevItemsKey] = useState(itemsKey);
  if (prevItemsKey !== itemsKey) {
    setPrevItemsKey(itemsKey);
    if (sel >= items.length) setSel(0);
  }

  const pick = (item: PaletteItem) => {
    onClose();
    item.run();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel(s => Math.min(s + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && items[sel]) {
      e.preventDefault();
      pick(items[sel]);
    }
  };

  let lastSection = '';

  return (
    <Modal open={open} onClose={onClose} label="command palette">
      <input
        autoFocus
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="jump to repo, agent, or action…"
        aria-label="command palette"
        autoComplete="off"
        spellCheck={false}
        className="w-full h-12 px-5 text-[13px] bg-transparent border-b border-border
          text-foreground placeholder:text-dim focus:outline-none"
      />
      <ul className="m-0 p-0 list-none max-h-[50vh] overflow-y-auto" role="listbox" aria-label="commands">
        {items.map((item, i) => {
          const showSection = item.section !== lastSection;
          lastSection = item.section;
          return (
            <li key={item.id} role="option" aria-selected={i === sel}>
              {showSection && (
                <div className="micro-label px-5 pt-3 pb-1">{item.section}</div>
              )}
              <button
                type="button"
                onClick={() => pick(item)}
                onMouseEnter={() => setSel(i)}
                className={cn(
                  'flex w-full items-baseline gap-3 text-left px-5 py-2 text-[12.5px] cursor-pointer',
                  i === sel ? 'bg-hover text-foreground' : 'text-muted-foreground',
                )}
              >
                <span className={cn('truncate', i === sel && 'font-bold text-foreground')}>{item.label}</span>
                {item.hint && <span className="ml-auto shrink-0 max-w-[45%] truncate text-[11px] text-dim">{item.hint}</span>}
              </button>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="px-5 py-6 text-center text-[12.5px] text-muted-foreground">nothing matches</li>
        )}
      </ul>
      <div className="flex items-center justify-between px-5 h-9 border-t border-border text-[11px] text-dim">
        <span>{!SERVER_SEARCH_ENABLED && 'searching the 200 most recently updated repos'}</span>
        <span>↑↓ navigate · ↵ open · esc close</span>
      </div>
    </Modal>
  );
}
