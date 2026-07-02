import type { RepoCommit } from '../../types/repo';
import { MicroLabel } from '../ui/MicroLabel';

interface CommitStripProps {
  commit: RepoCommit;
}

export function CommitStrip({ commit }: CommitStripProps) {
  return (
    <div className="flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3 sm:py-4 mb-6 sm:mb-8 min-w-0 border border-border bg-surface">
      <MicroLabel className="flex-shrink-0 hidden sm:block">latest commit</MicroLabel>
      <span className="text-[12px] sm:text-[13px] flex-shrink-0 text-warm border border-border-inner px-2 py-0.5 bg-background">
        {commit.shortHash}
      </span>
      <span className="text-[12.5px] sm:text-[13px] flex-1 truncate min-w-0 text-foreground">
        {commit.message}
      </span>
      <span className="text-[11px] sm:text-[12px] tabular-nums flex-shrink-0 text-dim">
        {commit.time}
      </span>
    </div>
  );
}
