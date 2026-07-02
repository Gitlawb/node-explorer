import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { Repository } from '../../types/repo';
import { TableRow, TableCell } from '../ui/table';

function CloneButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center h-7 px-3 text-xs font-medium rounded-md border transition-colors select-none',
        'border-border bg-background text-muted-foreground',
        !copied && 'hover:bg-muted hover:text-foreground'
      )}
    >
      {copied ? 'Copied' : 'Clone'}
    </button>
  );
}

interface RepoRowProps {
  repo: Repository;
  index: number;
}

export function RepoRow({ repo, index }: RepoRowProps) {
  const navigate = useNavigate();

  return (
    <TableRow
      className="group cursor-pointer animate-fade-up border-b border-border hover:bg-muted/80"
      style={{ animationDelay: `${index * 16}ms` }}
      onClick={() => navigate(`/repos/${repo.owner}/${repo.name}`)}
    >
      {/* Status dot */}
      <TableCell className="w-8 sm:w-10 px-3 sm:px-5 py-[14px] sm:py-[18px]">
        <span className="block w-[6px] sm:w-[7px] h-[6px] sm:h-[7px] rounded-full bg-[var(--color-status-dot)] group-hover:bg-[var(--color-warm)] transition-colors" />
      </TableCell>

      {/* Identity */}
      <TableCell className="px-3 sm:px-4 py-[14px] sm:py-[18px] min-w-0 max-w-[160px] sm:max-w-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-normal text-foreground truncate">
            {repo.owner}/{repo.name}
          </span>
          {repo.isMirror && (
            <span className="text-[10px] uppercase tracking-widest text-foreground/40 shrink-0 hidden sm:inline">
              mirror
            </span>
          )}
        </div>
      </TableCell>

      {/* Description — hidden on mobile */}
      <TableCell className="hidden md:table-cell px-4 py-[18px] max-w-0">
        <span className="block truncate text-sm font-normal text-foreground">
          {repo.description}
        </span>
      </TableCell>

      {/* Branch — hidden on xs */}
      <TableCell className="hidden sm:table-cell px-4 py-[18px] text-center">
        <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-[11px] font-normal text-foreground bg-muted/50">
          {repo.branch}
        </span>
      </TableCell>

      {/* Updated */}
      <TableCell className="px-3 sm:px-4 py-[14px] sm:py-[18px] text-right">
        <span className="text-xs sm:text-sm tabular-nums font-mono text-foreground">
          {repo.updatedAt}
        </span>
      </TableCell>

      {/* Clone button — hidden on mobile */}
      <TableCell className="hidden md:table-cell px-4 py-[18px]" onClick={e => e.stopPropagation()}>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
          <CloneButton value={repo.cloneUrl} />
        </div>
      </TableCell>
    </TableRow>
  );
}
