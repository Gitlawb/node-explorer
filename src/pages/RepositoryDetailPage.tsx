import { Link, useParams } from 'react-router-dom';
import { useRepository } from '../hooks/useRepository';
import { DetailHeader } from '../components/repo-detail/DetailHeader';
import { StatsPanel } from '../components/repo-detail/StatsPanel';
import { ClonePanel } from '../components/repo-detail/ClonePanel';
import { CommitStrip } from '../components/repo-detail/CommitStrip';
import { DetailTabs } from '../components/repo-detail/DetailTabs';
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
      <BreadcrumbList className="text-[13px] sm:text-[14px] gap-1.5 sm:gap-2 flex-nowrap min-w-0">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link
              to="/repos"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              repos
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-muted-foreground shrink-0" />
        <BreadcrumbItem className="shrink-0 min-w-0 max-w-[100px] sm:max-w-[180px]">
          <span className="text-muted-foreground truncate block">{owner}</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-muted-foreground shrink-0" />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="text-foreground font-medium truncate block">{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function NotFound({ owner, name }: { owner: string; name: string }) {
  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-12 py-16">
      <PageBreadcrumb owner={owner} name={name} />
      <div className="flex flex-col items-center justify-center py-24 sm:py-32 text-center">
        <span className="text-[64px] mb-8 opacity-10 select-none">◈</span>
        <h2 className="text-[20px] sm:text-[24px] font-semibold mb-3 text-muted-foreground">
          Repository not found
        </h2>
        <p className="text-[14px] sm:text-[16px] mb-8 text-muted-foreground">
          {owner}/{name} doesn't exist on this node.
        </p>
        <Link
          to="/repos"
          className="text-[15px] sm:text-[16px] font-medium transition-colors"
          style={{ color: 'var(--color-warm)' }}
        >
          ← Back to repositories
        </Link>
      </div>
    </div>
  );
}

export default function RepositoryDetailPage() {
  const { owner = '', name = '' } = useParams<{ owner: string; name: string }>();
  const { repo, notFound } = useRepository(owner, name);

  if (notFound || !repo) return <NotFound owner={owner} name={name} />;

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 animate-fade-in">
      <PageBreadcrumb owner={owner} name={name} />

      {/* Two-column top section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-10 mb-8 sm:mb-10">
        <DetailHeader repo={repo} />
        <div className="space-y-4 sm:space-y-5">
          <StatsPanel stars={repo.stars} latestCommit={repo.latestCommit} />
          <ClonePanel owner={repo.owner} name={repo.name} />
        </div>
      </div>

      {/* Commit strip */}
      <CommitStrip commit={repo.latestCommit} />

      {/* Tabs + content */}
      <DetailTabs repo={repo} />
    </div>
  );
}
