import { Link } from 'react-router-dom';
import { Star, GitFork } from 'lucide-react';
import type { Repository } from '../../types/repo';
import { shortDid } from '../../lib/api';
import { usePrefetchRepo } from '../../hooks/usePrefetch';
import { useRepoActivity } from '../../hooks/useRepoActivity';
import { CopyButton } from '../ui/CopyButton';
import { Sparkline } from './Sparkline';

interface RepoRowProps {
  repo: Repository;
  index: number;
}

/**
 * One row in the repository list.
 *
 * Constant-valued fields are not printed. On this node effectively every
 * repository is public and on `main`, so labelling all five thousand rows with
 * both spends the most prominent slot beside the name on zero information —
 * and trains the reader to skip the place an exception would appear. A field
 * shows only where it departs from the default.
 */
export function RepoRow({ repo }: RepoRowProps) {
  const prefetch = usePrefetchRepo(repo.owner, repo.name);
  const { ref, activity } = useRepoActivity(repo.owner, repo.name);

  const offBranch = repo.branch && repo.branch !== 'main' && repo.branch !== 'master';
  const restricted = repo.visibility !== 'public';

  return (
    <li
      ref={ref}
      {...prefetch}
      className="group relative grid items-center gap-x-4 sm:gap-x-6
        grid-cols-[minmax(0,1fr)_auto]
        md:grid-cols-[minmax(0,1fr)_64px_auto]
        border-b border-separator last:border-b-0 px-4 py-3
        transition-colors hover:bg-surface-secondary"
    >
      {/* Accent rail on hover. Pure CSS — a pointer-tracking card per row
          would put fifty mousemove handlers on one page. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-accent
          opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
          <Link
            to={`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`}
            data-row-link
            className="text-[15px] leading-snug outline-none min-w-0 font-semibold text-accent
              after:absolute after:inset-0 after:content-['']
              hover:underline
              focus-visible:after:outline focus-visible:after:outline-2
              focus-visible:after:outline-accent focus-visible:after:-outline-offset-2"
          >
            <span className="text-muted font-normal">{shortDid(repo.owner)}/</span>
            <span className="break-all sm:break-normal">{repo.name}</span>
          </Link>

          {restricted && (
            <span className="rounded-full border border-attention/50 text-attention px-2 py-[1px] text-[12px]">
              {repo.visibility}
            </span>
          )}
          {offBranch && (
            <span className="rounded-full border border-border text-muted px-2 py-[1px] text-[12px]">
              {repo.branch}
            </span>
          )}
          {repo.isMirror && (
            <span
              title="Mirrored from a peer node"
              className="inline-flex items-center text-muted"
            >
              <GitFork size={13} />
            </span>
          )}
        </div>

        {repo.description && (
          <p className="m-0 mt-1 text-[13px] leading-snug text-muted truncate">
            {repo.description}
          </p>
        )}
      </div>

      {/* Weekly commit activity — real data from the node. */}
      <div className="hidden md:flex justify-end relative z-10">
        <Sparkline data={activity} />
      </div>

      <div className="flex items-center gap-3 whitespace-nowrap justify-self-end">
        {repo.stars > 0 && (
          <span className="inline-flex items-center gap-1 text-[13px] tabular text-muted">
            <Star size={13} className="text-attention" />
            {repo.stars}
          </span>
        )}
        <span className="text-[13px] tabular text-muted">{repo.updatedAt}</span>
        <span className="relative z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <CopyButton value={`git clone ${repo.cloneUrl}`} label="clone" />
        </span>
      </div>
    </li>
  );
}
