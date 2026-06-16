import { Fragment, useEffect, useRef, useState } from 'react';
import type { Repository, RepoFile } from '../../types/repo';
import { FileList } from './FileList';
import { FileViewer } from './FileViewer';
import { CommitList } from './CommitList';
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

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <p className="text-[14px] text-muted-foreground">No {label} yet</p>
    </div>
  );
}

interface DetailTabsProps {
  repo: Repository;
}

export function DetailTabs({ repo }: DetailTabsProps) {
  const [pathStack, setPathStack] = useState<DirLevel[]>([
    { label: '', path: '', entries: repo.files },
  ]);
  const [openFile, setOpenFile] = useState<OpenFile | null>(null);
  const [dirLoading, setDirLoading] = useState(false);

  const [tabCounts, setTabCounts] = useState<Partial<Record<string, number>>>({});
  const fetchedTabsRef = useRef<Set<string>>(new Set());

  const blobAbortRef = useRef<AbortController | null>(null);
  const dirAbortRef = useRef<AbortController | null>(null);

  // Reset Code tab state when repo changes
  useEffect(() => {
    setPathStack([{ label: '', path: '', entries: repo.files }]);
    setOpenFile(null);
    setDirLoading(false);
    setTabCounts({});
    fetchedTabsRef.current = new Set();
    blobAbortRef.current?.abort();
    dirAbortRef.current?.abort();
  }, [repo.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

      fetchSubtree(repo.owner, repo.name, fullPath, ctrl.signal)
        .then(entries => {
          if (ctrl.signal.aborted) return;
          const files = mapTreeEntriesToFiles(entries);
          setPathStack(s => [...s, { label: entry.name, path: fullPath, entries: files }]);
          setDirLoading(false);
        })
        .catch(err => {
          if (ctrl.signal.aborted) return;
          console.error('Failed to fetch subtree:', err);
          setDirLoading(false);
        });
    }
  };

  const handleTabChange = (tab: string) => {
    if (fetchedTabsRef.current.has(tab)) return;

    const lazyFetchers: Record<string, (o: string, n: string) => Promise<number>> = {
      pulls: fetchPulls,
      issues: fetchIssues,
      events: fetchEvents,
      certs: fetchCerts,
    };

    if (!lazyFetchers[tab]) return;
    fetchedTabsRef.current.add(tab);

    lazyFetchers[tab](repo.owner, repo.name)
      .then(count => setTabCounts(c => ({ ...c, [tab]: count })))
      .catch(() => setTabCounts(c => ({ ...c, [tab]: 0 })));
  };

  const navigateToBreadcrumb = (idx: number) => {
    setPathStack(s => s.slice(0, idx + 1));
    setOpenFile(null);
  };

  const showBreadcrumb = pathStack.length > 1 && !openFile;

  return (
    <Tabs defaultValue="code" onValueChange={handleTabChange}>
      {/* Negative margins extend the scroll zone to the page edge on mobile */}
      <div className="relative min-w-0">
        <div className="overflow-x-auto -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <TabsList className="w-max min-w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto mb-6">
          <TabsTrigger
            value="code"
            className="relative rounded-none border-b-2 border-transparent px-3 sm:px-4 py-3 text-[13px] sm:text-[14px] font-normal text-muted-foreground transition-colors data-[state=active]:border-[var(--color-warm)] data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground whitespace-nowrap"
          >
            code
            <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
              {repo.files.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="commits"
            className="relative rounded-none border-b-2 border-transparent px-3 sm:px-4 py-3 text-[13px] sm:text-[14px] font-normal text-muted-foreground transition-colors data-[state=active]:border-[var(--color-warm)] data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground whitespace-nowrap"
          >
            commits
            <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
              {repo.commits.length}
            </span>
          </TabsTrigger>
          {(['pulls', 'issues', 'certs', 'events'] as const).map(id => (
            <TabsTrigger
              key={id}
              value={id}
              className="relative rounded-none border-b-2 border-transparent px-3 sm:px-4 py-3 text-[13px] sm:text-[14px] font-normal text-muted-foreground transition-colors data-[state=active]:border-[var(--color-warm)] data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground whitespace-nowrap"
            >
              {id}
              {tabCounts[id] !== undefined && (
                <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
                  {tabCounts[id]}
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
                        className="text-[12px] font-mono text-muted-foreground hover:text-foreground transition-colors duration-100"
                      >
                        {idx === 0 ? 'root' : level.label}
                      </button>
                    ) : (
                      <span className="text-[12px] font-mono text-foreground">{level.label}</span>
                    )}
                    {idx < pathStack.length - 1 && (
                      <span className="text-[12px] text-muted-foreground">/</span>
                    )}
                  </Fragment>
                ))}
              </div>
            )}
            {dirLoading ? (
              <div className="flex items-center justify-center py-14">
                <p className="text-[14px] text-muted-foreground animate-pulse">Loading…</p>
              </div>
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
        <EmptyTab label="pull requests" />
      </TabsContent>
      <TabsContent value="issues" className="animate-fade-in mt-0">
        <EmptyTab label="issues" />
      </TabsContent>
      <TabsContent value="certs" className="animate-fade-in mt-0">
        <EmptyTab label="certificates" />
      </TabsContent>
      <TabsContent value="events" className="animate-fade-in mt-0">
        <EmptyTab label="events" />
      </TabsContent>
    </Tabs>
  );
}
