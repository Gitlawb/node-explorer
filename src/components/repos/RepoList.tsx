import { cn } from '../../lib/utils';
import type { Repository } from '../../types/repo';
import { RepoRow } from './RepoRow';
import { RepoRowSkeleton } from './RepoRowSkeleton';

interface RepoListProps {
  /** null → initial load, render skeletons */
  repos: Repository[] | null;
  loading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
}

/**
 * The repository list.
 *
 * One bordered container with hairline-separated rows — the shape a file
 * listing takes on a forge. There is no column-header strip: the rows are not
 * a uniform table (description wraps, badges come and go), and a header grid
 * silently drifts out of alignment with them, which is exactly what happened
 * to the previous four-column version.
 */
export function RepoList({
  repos,
  loading = false,
  skeletonCount = 10,
  emptyMessage = 'No repositories match',
}: RepoListProps) {
  return (
    <div
      className={cn(
        // No container border: the rows carry their own hairlines, so the list
        // reads as a continuous index rather than a panel sitting on the page.
        'border-t border-border transition-opacity duration-200',
        loading && repos !== null && 'opacity-40 pointer-events-none',
      )}
    >
      {repos === null ? (
        <ul className="m-0 p-0 list-none" aria-busy="true" aria-label="loading repositories">
          {Array.from({ length: skeletonCount }, (_, i) => <RepoRowSkeleton key={i} />)}
        </ul>
      ) : repos.length === 0 ? (
        <p className="m-0 py-20 text-center text-[14px] text-muted">{emptyMessage}</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {repos.map((repo, i) => <RepoRow key={repo.id} repo={repo} index={i} />)}
        </ul>
      )}
    </div>
  );
}
