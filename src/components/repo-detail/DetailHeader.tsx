import type { Repository } from '../../types/repo';
import { shortDid, truncateDid } from '../../lib/api';
import { CopyButton } from '../ui/CopyButton';
import { Pill } from '../ui/Pill';
import { MicroLabel } from '../ui/MicroLabel';

interface DetailHeaderProps {
  repo: Repository;
}

export function DetailHeader({ repo }: DetailHeaderProps) {
  // repo.owner is already the full DID (did:key:z6Mk…)
  const fullDid = repo.owner;
  const truncatedDid = truncateDid(fullDid);
  const didSplitAt = truncatedDid.lastIndexOf(':') + 1;

  return (
    <div className="min-w-0">
      {/* Title */}
      <h1 className="text-[24px] sm:text-[32px] lg:text-[40px] font-bold leading-tight mb-4 break-words">
        <span className="text-dim">{shortDid(repo.owner)}/</span>
        <span className="text-foreground">{repo.name}</span>
      </h1>

      {/* Badges */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        <Pill>{repo.branch}</Pill>
        <Pill>{repo.visibility}</Pill>
        <Pill>{repo.stars === 1 ? '1 star' : `${repo.stars} stars`}</Pill>
        {repo.isMirror && <Pill>fork</Pill>}
      </div>

      {/* Description */}
      {repo.description && (
        <p className="m-0 text-[13px] sm:text-[14px] leading-[1.75] mb-6 sm:mb-7 max-w-[560px] text-muted-foreground">
          {repo.description}
        </p>
      )}

      {/* Owner/dates panel */}
      <div className="border border-border">
        {/* Owner row — middle-truncated for display, copy yields the full DID */}
        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-border-inner">
          <MicroLabel className="w-[64px] flex-shrink-0">owner</MicroLabel>
          <span title={fullDid} className="text-[11px] sm:text-[12.5px] flex-1 truncate min-w-0 text-foreground">
            <span className="text-dim">{truncatedDid.slice(0, didSplitAt)}</span>
            {truncatedDid.slice(didSplitAt)}
          </span>
          <CopyButton value={fullDid} label="copy" />
        </div>

        {/* Dates row */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-8 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <MicroLabel className="w-[64px] flex-shrink-0">updated</MicroLabel>
            <span className="text-[12.5px] text-foreground tabular-nums">{repo.updatedAt}</span>
          </div>
          <div className="flex items-center gap-3">
            <MicroLabel className="flex-shrink-0">created</MicroLabel>
            <span className="text-[12.5px] text-foreground tabular-nums">{repo.createdAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
