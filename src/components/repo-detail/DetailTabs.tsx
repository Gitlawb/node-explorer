import { Fragment, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
      <p className="m-0 text-[13px] text-muted-foreground">no {label} yet</p>
    </div>
  );
}

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-16 border border-border" aria-busy="true">
      <p className="m-0 text-[13px] text-muted-foreground animate-pulse">loading…</p>
    </div>
  );
}

function TabError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 border border-border">
      <p className="m-0 text-[13px] text-destructive">failed to load: {message}</p>
      <Pill onClick={onRetry}>retry</Pill>
    </div>
  );
}

const TRIGGER_CLS =
  'relative rounded-none border-b-2 border-transparent px-3 sm:px-4 py-3 text-[13px] font-normal lowercase ' +
  'text-muted-foreground transition-colors whitespace-nowrap hover:text-foreground ' +
  'data-[state=active]:border-warm data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none';

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

  // ── Tree cache (per directory path) ─────────────────────────────────────
  const [trees, setTrees] = useState<Record<string, RepoFile[]>>({ '': repo.files });
  const [dirErrors, setDirErrors] = useState<Record<string, string>>({});
  const [blob, setBlob] = useState<BlobState | null>(null);
  const [tabData, setTabData] = useState<LazyTabData>(initialTabData);
  // Keyed by `${repo.id}:${tab}` so no reset is needed when the repo changes
  const startedTabsRef = useRef<Set<string>>(new Set());
  const tabAbortRef = useRef<AbortController | null>(null);

  // Render-phase reset when the repo changes
  const [prevRepoId, setPrevRepoId] = useState(repo.id);
  if (prevRepoId !== repo.id) {
    setPrevRepoId(repo.id);
    setTrees({ '': repo.files });
    setDirErrors({});
    setBlob(null);
    setTabData(initialTabData);
  }

  // Abort in-flight lazy-tab fetches from the previous repo
  useEffect(() => {
    return () => { tabAbortRef.current?.abort(); };
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
    startedTabsRef.current.add(`${repo.id}:${tab}`);
    const ctrl = new AbortController();
    tabAbortRef.current = ctrl;

    LAZY_FETCHERS[tab](repo.owner, repo.name, ctrl.signal)
      .then(items => {
        if (ctrl.signal.aborted) return;
        setTabData(d => ({ ...d, [tab]: { status: 'ready', items } } as LazyTabData));
      })
      .catch(err => {
        if (ctrl.signal.aborted) return;
        startedTabsRef.current.delete(`${repo.id}:${tab}`);
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
  const handleClickEntry = (entry: RepoFile) => {
    const fullPath = treePath ? `${treePath}/${entry.name}` : entry.name;
    if (entry.type === 'dir') {
      setParams({ path: fullPath, file: null, view: null, force: null });
    } else {
      setParams({ path: treePath || null, file: fullPath, view: null, force: null });
    }
  };

  const goToDir = (dir: string) => {
    setParams({ path: dir || null, file: null, view: null, force: null });
  };

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
    <Tabs value={value} onValueChange={handleTabChange}>
      {/* Negative margins extend the scroll zone to the page edge on mobile */}
      <div className="relative min-w-0">
        <div className="overflow-x-auto -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <TabsList className="w-max min-w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto mb-6">
          <TabsTrigger value="code" className={TRIGGER_CLS}>
            code
            <span className="ml-1.5 text-[11px] tabular-nums text-dim">{repo.files.length}</span>
          </TabsTrigger>
          <TabsTrigger value="commits" className={TRIGGER_CLS}>
            commits
            <span className="ml-1.5 text-[11px] tabular-nums text-dim">{repo.commits.length}</span>
          </TabsTrigger>
          {(['pulls', 'issues', 'certs', 'events'] as const).map(id => (
            <TabsTrigger key={id} value={id} className={TRIGGER_CLS}>
              {id}
              {tabData[id].status === 'ready' && (
                <span className="ml-1.5 text-[11px] tabular-nums text-dim">
                  {tabData[id].items.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        </div>
        {/* Right-edge fade — signals scrollable content on small screens */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
      </div>

      <TabsContent value="code" className="animate-fade-in mt-0">
        <div className="flex items-center gap-1.5 mb-3 px-0.5 flex-wrap min-h-7">
          {showBreadcrumb && (
            <>
              <button
                onClick={() => goToDir('')}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-100
                  focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
              >
                root
              </button>
              {crumbSegments.map((seg, idx) => {
                const isLast = idx === crumbSegments.length - 1 && !filePath;
                return (
                  <Fragment key={idx}>
                    <span className="text-[12px] text-muted-foreground">/</span>
                    {isLast ? (
                      <span className="text-[12px] text-foreground">{seg}</span>
                    ) : (
                      <button
                        onClick={() => goToDir(crumbSegments.slice(0, idx + 1).join('/'))}
                        className="text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-100
                          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
                      >
                        {seg}
                      </button>
                    )}
                  </Fragment>
                );
              })}
              {filePath && (
                <>
                  <span className="text-[12px] text-muted-foreground">/</span>
                  <span className="text-[12px] text-foreground">{filePath.split('/').pop()}</span>
                </>
              )}
            </>
          )}
          {onOpenFinder && (
            <Pill onClick={onOpenFinder} className="ml-auto" aria-label="find file (t)">
              find file · t
            </Pill>
          )}
        </div>

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
            onBack={() => goToDir(crumbDir)}
            onSetView={v => setParams({ view: v === 'code' ? 'code' : null })}
            onForce={() => setParams({ force: '1' })}
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
            <FileList files={currentEntries} onClickEntry={handleClickEntry} />
            <ReadmePanel
              key={`${repo.id}:${treePath}`}
              owner={repo.owner}
              name={repo.name}
              dirPath={treePath}
              entries={currentEntries}
            />
          </>
        )}
      </TabsContent>

      <TabsContent value="commits" className="animate-fade-in mt-0">
        <CommitList commits={repo.commits} />
      </TabsContent>
      <TabsContent value="pulls" className="animate-fade-in mt-0">
        {renderLazyTab('pulls', 'pull requests', () => <PullList items={tabData.pulls.items} />)}
      </TabsContent>
      <TabsContent value="issues" className="animate-fade-in mt-0">
        {renderLazyTab('issues', 'issues', () => <IssueList items={tabData.issues.items} />)}
      </TabsContent>
      <TabsContent value="certs" className="animate-fade-in mt-0">
        {renderLazyTab('certs', 'certificates', () => <CertList items={tabData.certs.items} />)}
      </TabsContent>
      <TabsContent value="events" className="animate-fade-in mt-0">
        {renderLazyTab('events', 'events', () => <EventList items={tabData.events.items} />)}
      </TabsContent>
    </Tabs>
  );
}
