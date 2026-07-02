import { Link } from 'react-router-dom';
import type { Repository } from '../../types/repo';
import { shortDid } from '../../lib/api';
import { usePrefetchRepo } from '../../hooks/usePrefetch';
import { Pill } from '../ui/Pill';
import { CopyButton } from '../ui/CopyButton';

interface RepoRowProps {
  repo: Repository;
  index: number;
}

export function RepoRow({ repo, index }: RepoRowProps) {
  const prefetch = usePrefetchRepo(repo.owner, repo.name);

  return (
    <li
      {...prefetch}
      className="group relative grid grid-cols-[16px_minmax(0,1fr)_auto] md:grid-cols-[24px_minmax(0,5fr)_minmax(0,4fr)_90px_90px]
        items-start xl:items-center gap-x-3 md:gap-x-4 px-4 sm:px-6 py-4 xl:py-3
        border-b border-border-inner last:border-b-0
        hover:bg-hover transition-colors animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: `${index * 16}ms` }}
    >
      {/* Status dot */}
      <span aria-hidden="true" className="pt-[3px] xl:pt-0 text-[8px] leading-none text-status-dot group-hover:text-warm transition-colors select-none">
        ◆
      </span>

      {/* Identity + pills — stacked normally, single line on xl */}
      <div className="min-w-0 xl:flex xl:items-center xl:gap-3">
        <Link
          to={`/repos/${repo.owner}/${repo.name}`}
          data-row-link
          className="text-[14px] leading-snug outline-none min-w-0
            after:absolute after:inset-0 after:content-['']
            focus-visible:after:ring-1 focus-visible:after:ring-warm focus-visible:after:ring-inset"
        >
          <span className="text-dim">{shortDid(repo.owner)}/</span>
          <span className="font-bold text-foreground break-all xl:break-normal">{repo.name}</span>
        </Link>

        {/* Description on mobile (own column on md+) */}
        {repo.description && (
          <p className="m-0 mt-1 text-[12px] text-muted-foreground line-clamp-2 md:hidden">
            {repo.description}
          </p>
        )}

        <div className="relative z-10 flex items-center gap-1.5 mt-2 xl:mt-0 flex-wrap xl:flex-nowrap xl:shrink-0">
          <Pill>{repo.branch}</Pill>
          <Pill>{repo.visibility}</Pill>
          <CopyButton value={`git clone ${repo.cloneUrl}`} label="clone" />
          {repo.stars > 0 && (
            <span className="text-[11px] text-warm-text tabular-nums pl-1">★ {repo.stars}</span>
          )}
          {repo.isMirror && (
            <span className="text-[10px] uppercase tracking-[0.15em] text-dim pl-1">fork</span>
          )}
        </div>
      </div>

      {/* Description column (md+) */}
      <p className="m-0 hidden md:block pt-[2px] xl:pt-0 text-[12.5px] leading-relaxed text-muted-foreground line-clamp-2 xl:line-clamp-1">
        {repo.description}
      </p>

      {/* Branch column (md+) */}
      <span className="hidden md:block pt-[2px] xl:pt-0 text-[12px] text-muted-foreground truncate">
        {repo.branch}
      </span>

      {/* Updated */}
      <span className="pt-[2px] xl:pt-0 text-[11px] md:text-[12px] tabular-nums text-dim text-right whitespace-nowrap">
        {repo.updatedAt}
      </span>
    </li>
  );
}
