import { Fragment, useEffect, useRef, useState, useCallback } from 'react';
import type { Repository, RepoFile } from '../../types/repo';
import { FileList } from './FileList';
import { FileViewer } from './FileViewer';
import { CommitList } from './CommitList';
import { IssueList } from './IssueList';
import { PullList } from './PullList';
import { EventList } from './EventList';
import { CertList } from './CertList';
import { Pill } from '../ui/Pill';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  fetchBlob,
  fetchSubtree,
  fetchPulls,
  fetchIssues,
  fetchEvents,
  fetchCerts,
  mapTreeEntriesToFiles,
} from '../../lib/api';
import type { ApiIssue, ApiPull, ApiRepoEvent, ApiCert } from '../../lib/api';

interface DirLevel {
  label: string;
  path: string;
  entries: RepoFile[];
}

interface OpenFile {
  name: string;
  path: string;
  content: string | null;
  loading: boolean;
  error: string | null;
}

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

interface DetailTabsProps {
  repo: Repository;
  value: string;
  onValueChange: (tab: string) => void;
}

export function DetailTabs({ repo, value, onValueChange }: DetailTabsProps) {
  const [pathStack, setPathStack] = useState<DirLevel[]>([
    { label: '', path: '', entries: repo.files },
  ]);
  const [openFile, setOpenFile] = useState<OpenFile | null>(null);
  const [dirLoading, setDirLoading] = useState(false);
  const [dirError, setDirError] = useState<string | null>(null);

  const [tabData, setTabData] = useState<LazyTabData>(initialTabData);
  // Keyed by `${repo.id}:${tab}` so no reset is needed when the repo changes
  const startedTabsRef = useRef<Set<string>>(new Set());

  const blobAbortRef = useRef<AbortController | null>(null);
  const dirAbortRef = useRef<AbortController | null>(null);
  const tabAbortRef = useRef<AbortController | null>(null);

  // Render-phase reset of all lazy state when the repo changes
  const [prevRepoId, setPrevRepoId] = useState(repo.id);
  if (prevRepoId !== repo.id) {
    setPrevRepoId(repo.id);
    setPathStack([{ label: '', path: '', entries: repo.files }]);
    setOpenFile(null);
    setDirLoading(false);
    setDirError(null);
    setTabData(initialTabData);
  }

  // Abort in-flight fetches from the previous repo
  useEffect(() => {
    return () => {
      blobAbortRef.current?.abort();
      dirAbortRef.current?.abort();
      tabAbortRef.current?.abort();
    };
  }, [repo.id]);

  const currentDir = pathStack[pathStack.length - 1];

  const handleClickEntry = (entry: RepoFile) => {
    const fullPath = currentDir.path ? `${currentDir.path}/${entry.name}` : entry.name;

    if (entry.type === 'file') {
      blobAbortRef.current?.abort();
      const ctrl = new AbortController();
      blobAbortRef.current = ctrl;

      setOpenFile({ name: entry.name, path: fullPath, content: null, loading: true, error: null });

      fetchBlob(repo.owner, repo.name, fullPath, ctrl.signal)
        .then(content => {
          if (!ctrl.signal.aborted) {
            setOpenFile(f => f?.path === fullPath ? { ...f, content, loading: false } : f);
          }
        })
        .catch(err => {
          if (ctrl.signal.aborted) return;
          const msg = err instanceof Error ? err.message : 'Failed to load file';
          setOpenFile(f => f?.path === fullPath ? { ...f, loading: false, error: msg } : f);
        });
    } else {
      dirAbortRef.current?.abort();
      const ctrl = new AbortController();
      dirAbortRef.current = ctrl;

      setDirLoading(true);
      setDirError(null);

      fetchSubtree(repo.owner, repo.name, fullPath, ctrl.signal)
        .then(entries => {
          if (ctrl.signal.aborted) return;
          const files = mapTreeEntriesToFiles(entries);
          setPathStack(s => [...s, { label: entry.name, path: fullPath, entries: files }]);
          setDirLoading(false);
        })
        .catch(err => {
          if (ctrl.signal.aborted) return;
          setDirError(err instanceof Error ? err.message : 'Failed to open directory');
          setDirLoading(false);
        });
    }
  };

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
          [tab]: { status: 'error', items: [], error: err instanceof Error ? err.message : 'request failed' },
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

  const navigateToBreadcrumb = (idx: number) => {
    setPathStack(s => s.slice(0, idx + 1));
    setOpenFile(null);
  };

  const showBreadcrumb = pathStack.length > 1 && !openFile;

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
        {openFile ? (
          <FileViewer
            path={openFile.path}
            content={openFile.content}
            loading={openFile.loading}
            error={openFile.error}
            onBack={() => setOpenFile(null)}
          />
        ) : (
          <>
            {showBreadcrumb && (
              <div className="flex items-center gap-1.5 mb-3 px-0.5">
                {pathStack.map((level, idx) => (
                  <Fragment key={idx}>
                    {idx < pathStack.length - 1 ? (
                      <button
                        onClick={() => navigateToBreadcrumb(idx)}
                        className="text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-100
                          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
                      >
                        {idx === 0 ? 'root' : level.label}
                      </button>
                    ) : (
                      <span className="text-[12px] text-foreground">{level.label}</span>
                    )}
                    {idx < pathStack.length - 1 && (
                      <span className="text-[12px] text-muted-foreground">/</span>
                    )}
                  </Fragment>
                ))}
              </div>
            )}
            {dirError && (
              <p className="m-0 mb-3 text-[12px] text-destructive">{dirError}</p>
            )}
            {dirLoading ? (
              <TabLoading />
            ) : (
              <FileList files={currentDir.entries} onClickEntry={handleClickEntry} />
            )}
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
