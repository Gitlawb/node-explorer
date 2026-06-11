import type { RepoCommit } from '../../types/repo';
import { Separator } from '../ui/separator';

interface CommitStripProps {
  commit: RepoCommit;
}

export function CommitStrip({ commit }: CommitStripProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-3 sm:gap-5 py-3 sm:py-4 min-w-0">
        <span className="text-[11px] uppercase tracking-[0.08em] font-semibold flex-shrink-0 text-muted-foreground hidden sm:block">
          latest commit
        </span>
        <span
          className="font-mono text-[12px] sm:text-[13px] flex-shrink-0"
          style={{ color: 'var(--color-warm)' }}
        >
          {commit.shortHash}
        </span>
        <span className="text-[13px] sm:text-[14px] flex-1 truncate min-w-0 text-foreground">
          {commit.message}
        </span>
        <span className="font-mono text-[11px] sm:text-[12px] tabular-nums flex-shrink-0 text-muted-foreground">
          {commit.time}
        </span>
      </div>
      <Separator className="bg-border" />
    </div>
  );
}
