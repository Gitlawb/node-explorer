import { cn } from '../../lib/utils';
import type { Repository } from '../../types/repo';
import { MicroLabel } from '../ui/MicroLabel';
import { RepoRow } from './RepoRow';
import { RepoRowSkeleton } from './RepoRowSkeleton';

interface RepoListProps {
  /** null → initial load, render skeletons */
  repos: Repository[] | null;
  loading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
}

export function RepoList({
  repos,
  loading = false,
  skeletonCount = 10,
  emptyMessage = 'no repositories match',
}: RepoListProps) {
  return (
    <div className={cn(
      'border border-border transition-opacity duration-200',
      loading && repos !== null && 'opacity-40 pointer-events-none',
    )}>
      {/* Header strip */}
      <div className="hidden md:grid grid-cols-[24px_minmax(0,1fr)_120px_100px] gap-x-4 px-6 h-10 items-center border-b border-border bg-surface">
        <span />
        <MicroLabel>repository</MicroLabel>
        <MicroLabel className="text-right">activity</MicroLabel>
        <MicroLabel className="text-right">updated</MicroLabel>
      </div>

      {repos === null ? (
        <ul className="m-0 p-0 list-none" aria-busy="true" aria-label="loading repositories">
          {Array.from({ length: skeletonCount }, (_, i) => <RepoRowSkeleton key={i} />)}
        </ul>
      ) : repos.length === 0 ? (
        <p className="m-0 py-20 text-center text-[13px] text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {repos.map((repo, i) => <RepoRow key={repo.id} repo={repo} index={i} />)}
        </ul>
      )}
    </div>
  );
}
