import { Fragment, useEffect, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useSearchParams, type To } from 'react-router-dom';
import type { Repository, RepoFile } from '../../types/repo';
import { FileList } from './FileList';
import { FileViewer } from './FileViewer';
import { CommitList } from './CommitList';
import { IssueList } from './IssueList';
import { PullList } from './PullList';
import { EventList } from './EventList';
import { CertList } from './CertList';
import { ReadmePanel } from './ReadmePanel';
import { Pill } from '../ui/Pill';
import { Tabs } from '../register/Tabs';
import {
  getBlob,
  fetchSubtree,
  fetchPulls,
  fetchIssues,
  fetchEvents,
  fetchCerts,
  mapTreeEntriesToFiles,
} from '../../lib/api';
import type { ApiIssue, ApiPull, ApiRepoEvent, ApiCert, BlobResult } from '../../lib/api';
import { normalizeRepoPath, isMarkdownPath } from '../../lib/lang';
import { buildRepoCodeSearch, type RepoCodeTarget } from '../../lib/repoNavigation';
import { useShortcut } from '../../hooks/useShortcuts';

type LazyTabId = 'pulls' | 'issues' | 'events' | 'certs';

interface TabState<T> {
  status: 'idle' | 'loading' | 'ready' | 'error';
  items: T[];
  error?: string;
}

interface LazyTabData {
  pulls: TabState<ApiPull>;
  issues: TabState<ApiIssue>;
  events: TabState<ApiRepoEvent>;
  certs: TabState<ApiCert>;
}

const idleTab = { status: 'idle' as const, items: [] };

const initialTabData: LazyTabData = {
  pulls: idleTab,
  issues: idleTab,
  events: idleTab,
  certs: idleTab,
};

const LAZY_FETCHERS: Record<LazyTabId, (o: string, n: string, s?: AbortSignal) => Promise<unknown[]>> = {
  pulls: fetchPulls,
  issues: fetchIssues,
  events: fetchEvents,
  certs: fetchCerts,
};

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center border border-border">
      <p className="m-0 text-[13px] text-muted">no {label} yet</p>
    </div>
  );
}

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-16 border border-border" aria-busy="true">
      <p className="m-0 text-[13px] text-muted animate-pulse">loading…</p>
    </div>
  );
}

function TabError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 border border-border">
      <p className="m-0 text-[13px] text-danger">failed to load: {message}</p>
      <Pill onClick={onRetry}>retry</Pill>
    </div>
  );
}

const TRIGGER_CLS = 'px-3 sm:px-4 py-3 text-[13px] font-normal lowercase whitespace-nowrap';

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'request failed';
}

interface DetailTabsProps {
  repo: Repository;
  value: string;
  onValueChange: (tab: string) => void;
  onOpenFinder?: () => void;
}

interface BlobState {
  key: string;
  result: BlobResult | null;
  error: string | null;
}

export function DetailTabs({ repo, value, onValueChange, onOpenFinder }: DetailTabsProps) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-driven code navigation ──────────────────────────────────────────
  const treePath = normalizeRepoPath(searchParams.get('path') ?? '');
  const rawFile = searchParams.get('file');
  const filePath = rawFile ? normalizeRepoPath(rawFile) || null : null;
  const view: 'preview' | 'code' = searchParams.get('view') === 'code' ? 'code' : 'preview';
  const force = searchParams.get('force') === '1';
  // Directory shown behind an open file — README links set only ?file=
  const crumbDir = treePath || (filePath?.includes('/') ? filePath.split('/').slice(0, -1).join('/') : '');

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        for (const [key, val] of Object.entries(updates)) {
          if (val === null || val === '') next.delete(key);
          else next.set(key, val);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const codeTo = useCallback(
    (target: RepoCodeTarget = {}): To => ({
      pathname: location.pathname,
      search: buildRepoCodeSearch(searchParams, target),
    }),
    [location.pathname, searchParams],
  );

  const navigateCode = useCallback(
    (target: RepoCodeTarget = {}) => {
      setSearchParams(prev => new URLSearchParams(buildRepoCodeSearch(prev, target)));
    },
    [setSearchParams],
  );

  // ── Tree cache (per directory path) ─────────────────────────────────────
  const [trees, setTrees] = useState<Record<string, RepoFile[]>>({ '': repo.files });
  const [dirErrors, setDirErrors] = useState<Record<string, string>>({});
  const [blob, setBlob] = useState<BlobState | null>(null);
  const [tabData, setTabData] = useState<LazyTabData>(initialTabData);
  // Keyed by `${repo.id}:${tab}` so no reset is needed when the repo changes
  const startedTabsRef = useRef<Set<string>>(new Set());
  const tabAbortRef = useRef<{ ctrl: AbortController; key: string } | null>(null);

  // Render-phase reset when the repo changes
  const [prevRepoId, setPrevRepoId] = useState(repo.id);
  if (prevRepoId !== repo.id) {
    setPrevRepoId(repo.id);
    setTrees({ '': repo.files });
    setDirErrors({});
    setBlob(null);
    setTabData(initialTabData);
  }

  // Abort in-flight lazy-tab fetches from the previous repo.
  //
  // Clearing the "started" marker alongside the abort is load-bearing: that
  // marker lives in a ref, so it survives StrictMode's simulated remount while
  // the request it refers to does not. Deep-linking a lazy tab (?tab=certs)
  // starts the fetch during the first mount, this cleanup kills it, and the
  // remount then skips reloading because the tab still looks started — leaving
  // the panel on "loading…" forever.
  useEffect(() => {
    // The Set is allocated once and never reassigned, so capturing it here is
    // the same object the cleanup would have read.
    const startedTabs = startedTabsRef.current;
    return () => {
      const inflight = tabAbortRef.current;
      if (!inflight) return;
      inflight.ctrl.abort();
      startedTabs.delete(inflight.key);
      tabAbortRef.current = null;
    };
  }, [repo.id]);

  // Fetch the tree for treePath when uncached (uncached renders as loading,
  // so no sync setState is needed here).
  useEffect(() => {
    if (trees[treePath] !== undefined || dirErrors[treePath] !== undefined) return;
    const ctrl = new AbortController();
    fetchSubtree(repo.owner, repo.name, treePath, ctrl.signal)
      .then(entries => {
        if (ctrl.signal.aborted) return;
        setTrees(t => ({ ...t, [treePath]: mapTreeEntriesToFiles(entries) }));
      })
      .catch(err => {
        if (ctrl.signal.aborted) return;
        setDirErrors(d => ({ ...d, [treePath]: errMsg(err) }));
      });
    return () => ctrl.abort();
  }, [repo.id, repo.owner, repo.name, treePath, trees, dirErrors]);

  // Blob fetch keyed by request identity — stale responses can't land, and
  // `force` in the key makes "load anyway" a pure URL change.
  const blobKey = filePath ? `${repo.id}:${filePath}:${force ? 1 : 0}` : null;
  const blobLoading = !!blobKey && blob?.key !== blobKey;

  const retryBlob = useCallback(() => {
    if (!blobKey) return;
    setBlob(current => current?.key === blobKey ? null : current);
  }, [blobKey]);

  useEffect(() => {
    if (!blobKey || !filePath) return;
    if (blob?.key === blobKey) return;
    const ctrl = new AbortController();
    getBlob(repo.owner, repo.name, filePath, { force, signal: ctrl.signal })
      .then(result => {
        if (!ctrl.signal.aborted) setBlob({ key: blobKey, result, error: null });
      })
      .catch(err => {
        if (!ctrl.signal.aborted) setBlob({ key: blobKey, result: null, error: errMsg(err) });
      });
    return () => ctrl.abort();
  }, [blobKey, blob?.key, repo.owner, repo.name, filePath, force]);

  // ── Lazy tabs (pulls/issues/events/certs) ───────────────────────────────
  const loadLazyTab = useCallback((tab: LazyTabId) => {
    // No sync state write here — 'idle' already renders as loading, so this is
    // safe to call from an effect (react-hooks/set-state-in-effect).
    const key = `${repo.id}:${tab}`;
    startedTabsRef.current.add(key);
    const ctrl = new AbortController();
    tabAbortRef.current = { ctrl, key };

    LAZY_FETCHERS[tab](repo.owner, repo.name, ctrl.signal)
      .then(items => {
        if (ctrl.signal.aborted) return;
        if (tabAbortRef.current?.ctrl === ctrl) tabAbortRef.current = null;
        setTabData(d => ({ ...d, [tab]: { status: 'ready', items } } as LazyTabData));
      })
      .catch(err => {
        if (ctrl.signal.aborted) return;
        if (tabAbortRef.current?.ctrl === ctrl) tabAbortRef.current = null;
        startedTabsRef.current.delete(key);
        setTabData(d => ({
          ...d,
          [tab]: { status: 'error', items: [], error: errMsg(err) },
        } as LazyTabData));
      });
  }, [repo.id, repo.owner, repo.name]);

  const handleTabChange = (tab: string) => {
    onValueChange(tab);
    if (tab in LAZY_FETCHERS && !startedTabsRef.current.has(`${repo.id}:${tab}`)) {
      loadLazyTab(tab as LazyTabId);
    }
  };

  // When the parent switches tabs programmatically (e.g. "pull requests →"), lazy-load too
  useEffect(() => {
    if (value in LAZY_FETCHERS && !startedTabsRef.current.has(`${repo.id}:${value}`)) {
      loadLazyTab(value as LazyTabId);
    }
  }, [value, repo.id, loadLazyTab]);

  // ── Navigation handlers ─────────────────────────────────────────────────
  const getEntryTo = useCallback((entry: RepoFile): To => {
    const fullPath = treePath ? `${treePath}/${entry.name}` : entry.name;
    return entry.type === 'dir' ? codeTo({ path: fullPath }) : codeTo({ file: fullPath });
  }, [codeTo, treePath]);

  const goToDir = useCallback((dir: string) => {
    navigateCode({ path: dir });
  }, [navigateCode]);

  // Backspace walks up: open file → its directory; directory → parent
  useShortcut('Backspace', e => {
    if (value !== 'code') return;
    e.preventDefault();
    if (filePath) {
      goToDir(crumbDir);
    } else if (treePath) {
      goToDir(treePath.split('/').slice(0, -1).join('/'));
    }
  });

  const crumbSegments = crumbDir ? crumbDir.split('/') : [];
  const showBreadcrumb = crumbSegments.length > 0 || filePath !== null;

  const renderLazyTab = (tab: LazyTabId, emptyLabel: string, render: () => React.ReactNode) => {
    const state = tabData[tab];
    if (state.status === 'loading' || state.status === 'idle') return <TabLoading />;
    if (state.status === 'error') {
      const retry = () => {
        setTabData(d => ({ ...d, [tab]: idleTab } as LazyTabData));
        loadLazyTab(tab);
      };
      return <TabError message={state.error ?? 'request failed'} onRetry={retry} />;
    }
    if (state.items.length === 0) return <EmptyTab label={emptyLabel} />;
    return render();
  };

  const currentEntries = trees[treePath];
  const dirError = dirErrors[treePath];

  return (
    <Tabs selectedKey={value} onSelectionChange={key => handleTabChange(String(key))}>
      <Tabs.ListContainer className="mb-6">
        <Tabs.List aria-label="Repository tabs">
          <Tabs.Tab id="code" className={TRIGGER_CLS}>
            code
            <span className="ml-1.5 text-[11px] tabular-nums text-muted">{repo.files.length}</span>
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="commits" className={TRIGGER_CLS}>
            commits
            <span className="ml-1.5 text-[11px] tabular-nums text-muted">{repo.commits.length}</span>
            <Tabs.Indicator />
          </Tabs.Tab>
          {(['pulls', 'issues', 'certs', 'events'] as const).map(id => (
            <Tabs.Tab key={id} id={id} className={TRIGGER_CLS}>
              {id}
              {tabData[id].status === 'ready' && (
                <span className="ml-1.5 text-[11px] tabular-nums text-muted">
                  {tabData[id].items.length}
                </span>
              )}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>

      <Tabs.Panel id="code" className="">
        {!filePath && (
          <div className="flex items-center gap-1.5 mb-3 px-0.5 flex-wrap min-h-7">
            {showBreadcrumb && (
              <>
                <Link
                  to={codeTo()}
                  className="rounded-[var(--radius-control)] px-1 text-[12px] text-muted
                    hover:text-foreground transition-colors"
                >
                  root
                </Link>
                {crumbSegments.map((seg, idx) => {
                  const isLast = idx === crumbSegments.length - 1;
                  const segmentPath = crumbSegments.slice(0, idx + 1).join('/');
                  return (
                    <Fragment key={segmentPath}>
                      <span aria-hidden="true" className="text-[12px] text-muted">/</span>
                      {isLast ? (
                        <span translate="no" className="text-[12px] text-foreground">{seg}</span>
                      ) : (
                        <Link
                          to={codeTo({ path: segmentPath })}
                          translate="no"
                          className="rounded-[var(--radius-control)] px-1 text-[12px] text-muted
                            hover:text-foreground transition-colors"
                        >
                          {seg}
                        </Link>
                      )}
                    </Fragment>
                  );
                })}
              </>
            )}
            {onOpenFinder && (
              <Pill onClick={onOpenFinder} className="ml-auto" aria-label="find file (t)">
                find file · t
              </Pill>
            )}
          </div>
        )}

        {filePath ? (
          <FileViewer
            owner={repo.owner}
            name={repo.name}
            path={filePath}
            blob={blob?.key === blobKey ? blob.result : null}
            loading={blobLoading}
            error={blob?.key === blobKey ? blob.error : null}
            view={isMarkdownPath(filePath) ? view : 'code'}
            headSha={repo.commits[0]?.hash}
            backTo={codeTo({ path: crumbDir })}
            onSetView={v => setParams({ view: v === 'code' ? 'code' : null })}
            onForce={() => setParams({ force: '1' })}
            onRetry={retryBlob}
            onOpenFinder={onOpenFinder}
          />
        ) : dirError ? (
          <TabError
            message={dirError}
            onRetry={() => setDirErrors(d => {
              const next = { ...d };
              delete next[treePath];
              return next;
            })}
          />
        ) : currentEntries === undefined ? (
          <TabLoading />
        ) : (
          <>
            <FileList files={currentEntries} getEntryTo={getEntryTo} />
            <ReadmePanel
              key={`${repo.id}:${treePath}`}
              owner={repo.owner}
              name={repo.name}
              dirPath={treePath}
              entries={currentEntries}
            />
          </>
        )}
      </Tabs.Panel>

      <Tabs.Panel id="commits" className="">
        <CommitList commits={repo.commits} />
      </Tabs.Panel>
      <Tabs.Panel id="pulls" className="">
        {renderLazyTab('pulls', 'pull requests', () => <PullList items={tabData.pulls.items} />)}
      </Tabs.Panel>
      <Tabs.Panel id="issues" className="">
        {renderLazyTab('issues', 'issues', () => <IssueList items={tabData.issues.items} />)}
      </Tabs.Panel>
      <Tabs.Panel id="certs" className="">
        {renderLazyTab('certs', 'certificates', () => <CertList items={tabData.certs.items} />)}
      </Tabs.Panel>
      <Tabs.Panel id="events" className="">
        {renderLazyTab('events', 'events', () => <EventList items={tabData.events.items} />)}
      </Tabs.Panel>
    </Tabs>
  );
}
