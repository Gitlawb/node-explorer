import type { RepoCommit } from '../../types/repo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface CommitListProps {
  commits: RepoCommit[];
}

export function CommitList({ commits }: CommitListProps) {
  if (commits.length === 0) {
    return (
      <div className="flex items-center justify-center py-14">
        <p className="text-[14px] text-muted-foreground">No commits</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground h-10 px-4 sm:px-6 w-24 sm:w-28">
              Hash
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground h-10 px-4 sm:px-6">
              Message
            </TableHead>
            <TableHead className="hidden sm:table-cell text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground h-10 px-4 sm:px-6 w-32">
              Author
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground h-10 px-4 sm:px-6 text-right w-24 sm:w-28">
              When
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commits.map(commit => (
            <TableRow
              key={commit.hash}
              className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-100 cursor-default"
            >
              <TableCell className="px-4 sm:px-6 py-2.5 sm:py-3">
                <span
                  className="font-mono text-[12px] sm:text-[13px]"
                  style={{ color: 'var(--color-warm)' }}
                >
                  {commit.shortHash}
                </span>
              </TableCell>
              <TableCell className="px-4 sm:px-6 py-2.5 sm:py-3 min-w-0">
                <span className="block truncate text-[13px] sm:text-[14px] text-foreground">
                  {commit.message}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell px-4 sm:px-6 py-2.5 sm:py-3">
                <span className="text-[12px] sm:text-[13px] text-muted-foreground truncate block max-w-[120px]">
                  {commit.author ?? '—'}
                </span>
              </TableCell>
              <TableCell className="px-4 sm:px-6 py-2.5 sm:py-3 text-right">
                <span className="font-mono text-[11px] sm:text-[12px] tabular-nums text-muted-foreground whitespace-nowrap">
                  {commit.time}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
