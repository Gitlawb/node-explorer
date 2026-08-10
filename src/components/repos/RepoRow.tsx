import { Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Repository } from '../../types/repo';
import { shortDid } from '../../lib/api';
import { usePrefetchRepo } from '../../hooks/usePrefetch';
import { useRepoActivity } from '../../hooks/useRepoActivity';
import { Pill } from '../ui/Pill';
import { CopyButton } from '../ui/CopyButton';
import { Sparkline } from './Sparkline';

interface RepoRowProps {
  repo: Repository;
  index: number;
}

export function RepoRow({ repo, index }: RepoRowProps) {
  const prefetch = usePrefetchRepo(repo.owner, repo.name);
  const { ref, activity } = useRepoActivity(repo.owner, repo.name);

  return (
    <li
      ref={ref}
      {...prefetch}
      className="group relative grid grid-cols-[16px_minmax(0,1fr)_auto] md:grid-cols-[24px_minmax(0,1fr)_120px_100px]
        items-start gap-x-3 md:gap-x-4 px-4 sm:px-6 py-4 md:py-5
        border-b border-separator last:border-b-0
        hover:bg-surface-secondary transition-colors "
      style={{ animationDelay: `${index * 16}ms` }}
    >
      {/* Status dot — aligned to the name line */}
      <span aria-hidden="true" className="pt-[6px] text-[8px] leading-none text-muted group-hover:text-accent transition-colors select-none">
        <Circle size={7} fill="currentColor" />
      </span>

      {/* Line 1: identity + pills · Line 2: description */}
      <div className="min-w-0">
        <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap">
          <Link
            to={`/repos/${repo.owner}/${repo.name}`}
            data-row-link
            className="text-[14px] leading-snug outline-none min-w-0
              after:absolute after:inset-0 after:content-['']
              focus-visible:after:ring-1 focus-visible:after:ring-accent focus-visible:after:ring-inset"
          >
            <span className="text-muted">{shortDid(repo.owner)}/</span>
            <span className="font-bold text-foreground break-all sm:break-normal">{repo.name}</span>
          </Link>

          <div className="relative z-10 flex items-center gap-1.5 flex-wrap">
            <Pill>{repo.branch}</Pill>
            <Pill>{repo.visibility}</Pill>
            <CopyButton value={`git clone ${repo.cloneUrl}`} label="clone" />
            {repo.isMirror && (
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted pl-1">fork</span>
            )}
          </div>
        </div>

        {repo.description && (
          <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-muted line-clamp-2 md:line-clamp-1">
            {repo.description}
          </p>
        )}
      </div>

      {/* Activity sparkline (md+) */}
      <div className="hidden md:flex justify-end self-center">
        <Sparkline data={activity} />
      </div>

      {/* Updated + stars */}
      <div className="pt-[3px] text-right whitespace-nowrap">
        <span className="block text-[11px] md:text-[12px] tabular-nums text-muted">
          {repo.updatedAt}
        </span>
        {repo.stars > 0 && (
          <span className="block mt-1 text-[11px] tabular-nums text-accent">★ {repo.stars}</span>
        )}
      </div>
    </li>
  );
}
