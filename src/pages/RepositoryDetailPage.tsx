import { useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useRepository } from '../hooks/useRepository';
import { useShortcut, useShortcuts } from '../hooks/useShortcuts';
import { shortDid } from '../lib/api';
import { FileFinder } from '../components/repo-detail/FileFinder';
import { DetailHeader } from '../components/repo-detail/DetailHeader';
import { StatsPanel } from '../components/repo-detail/StatsPanel';
import { ClonePanel } from '../components/repo-detail/ClonePanel';
import { CommitStrip } from '../components/repo-detail/CommitStrip';
import { DetailTabs } from '../components/repo-detail/DetailTabs';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';

function PageBreadcrumb({ owner, name }: { owner: string; name: string }) {
  return (
    <Breadcrumb className="mb-8 sm:mb-10">
      <BreadcrumbList className="text-[12.5px] gap-1.5 sm:gap-2 flex-nowrap min-w-0">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link
              to="/repos"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
            >
              repos
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-dim shrink-0" />
        <BreadcrumbItem className="shrink-0 min-w-0 max-w-[100px] sm:max-w-[180px]">
          <span className="text-muted-foreground truncate block">{shortDid(owner)}</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-dim shrink-0" />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="text-foreground font-bold truncate block">{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function StatusShell({ owner, name, title, message }: {
  owner: string;
  name: string;
  title: string;
  message: string;
}) {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
      <PageBreadcrumb owner={owner} name={name} />
      <div className="flex flex-col items-center justify-center py-24 sm:py-32 text-center border border-border">
        <span className="text-[56px] mb-8 opacity-10 select-none" aria-hidden="true">◆</span>
        <h2 className="text-[18px] font-bold mb-3 text-foreground lowercase">{title}</h2>
        <p className="m-0 text-[13px] mb-8 text-muted-foreground">{message}</p>
        <Link
          to="/repos"
          className="text-[13px] text-warm-text hover:underline
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
        >
          ← back to repositories
        </Link>
      </div>
    </div>
  );
}

function LoadingState({ owner, name }: { owner: string; name: string }) {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12" aria-busy="true">
      <PageBreadcrumb owner={owner} name={name} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-10 mb-8 sm:mb-10">
        <div>
          <Skeleton className="h-10 w-2/3 mb-4" />
          <div className="flex gap-1.5 mb-5">
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="h-4 w-full max-w-[480px] mb-2" />
          <Skeleton className="h-4 w-3/4 max-w-[360px] mb-7" />
          <Skeleton className="h-[104px] w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[110px] w-full" />
          <Skeleton className="h-[130px] w-full" />
        </div>
      </div>
      <Skeleton className="h-12 w-full mb-8" />
      <div className="space-y-px">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
      </div>
    </div>
  );
}

const TAB_IDS = ['code', 'commits', 'pulls', 'issues', 'certs', 'events'];

export default function RepositoryDetailPage() {
  const { owner = '', name = '' } = useParams<{ owner: string; name: string }>();
  const { repo, notFound, loading, error, partialError } = useRepository(owner, name);

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') ?? 'code';
  const tab = TAB_IDS.includes(rawTab) ? rawTab : 'code';

  // Switching tabs drops the code-navigation params
  const setTab = useCallback(
    (t: string) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (t === 'code') next.delete('tab');
        else next.set('tab', t);
        for (const key of ['path', 'file', 'view', 'force']) next.delete(key);
        return next;
      });
    },
    [setSearchParams],
  );

  const { openModal, setOpenModal } = useShortcuts();

  const openFile = useCallback(
    (path: string) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('tab');
        next.set('file', path);
        for (const key of ['path', 'view', 'force']) next.delete(key);
        return next;
      });
    },
    [setSearchParams],
  );

  // Keyboard: 1–6 switch tabs, t opens the file finder (once the repo loaded)
  useShortcut('1', () => setTab(TAB_IDS[0]));
  useShortcut('2', () => setTab(TAB_IDS[1]));
  useShortcut('3', () => setTab(TAB_IDS[2]));
  useShortcut('4', () => setTab(TAB_IDS[3]));
  useShortcut('5', () => setTab(TAB_IDS[4]));
  useShortcut('6', () => setTab(TAB_IDS[5]));
  useShortcut('t', e => {
    if (!repo) return;
    e.preventDefault();
    setOpenModal('finder');
  });

  if (loading) return <LoadingState owner={owner} name={name} />;
  if (error) return <StatusShell owner={owner} name={name} title="failed to load repository" message={error} />;
  if (notFound || !repo) {
    return (
      <StatusShell
        owner={owner}
        name={name}
        title="repository not found"
        message={`${shortDid(owner)}/${name} doesn't exist on this node.`}
      />
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 animate-fade-in">
      <PageBreadcrumb owner={owner} name={name} />

      {partialError && (
        <p className="m-0 mb-6 px-4 py-3 border border-destructive/40 text-[12px] text-destructive">
          {partialError} — some sections may appear empty
        </p>
      )}

      {/* Two-column top section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6 lg:gap-10 mb-8 sm:mb-10 min-w-0">
        <DetailHeader repo={repo} />
        <div className="space-y-4 sm:space-y-5 min-w-0">
          <StatsPanel stars={repo.stars} latestCommit={repo.latestCommit} created={repo.createdAt} />
          <ClonePanel cloneUrl={repo.cloneUrl} onNavigate={setTab} />
        </div>
      </div>

      {/* Commit strip */}
      {repo.latestCommit && <CommitStrip commit={repo.latestCommit} />}

      {/* Tabs + content */}
      <DetailTabs
        repo={repo}
        value={tab}
        onValueChange={setTab}
        onOpenFinder={() => setOpenModal('finder')}
      />

      <FileFinder
        repo={repo}
        open={openModal === 'finder'}
        onClose={() => setOpenModal(null)}
        onOpenFile={openFile}
      />
    </div>
  );
}
