import { cn } from '../../lib/utils';
import type { Repository } from '../../types/repo';
import { RepoRow } from './RepoRow';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

function EmptyState() {
  return (
    <tr>
      <td colSpan={6}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-muted-foreground">No repositories found</p>
        </div>
      </td>
    </tr>
  );
}

interface RepoTableProps {
  repos: Repository[];
  loading?: boolean;
}

export function RepoTable({ repos, loading = false }: RepoTableProps) {
  return (
    <div className={cn(
      'rounded-lg border shadow-sm overflow-hidden transition-opacity duration-200',
      loading && 'opacity-40 pointer-events-none'
    )}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
            <TableHead className="w-8 sm:w-10 px-3 sm:px-5" />
            <TableHead className="px-3 sm:px-4 py-3 text-foreground font-semibold">Repository</TableHead>
            <TableHead className="hidden md:table-cell px-4 py-3 text-foreground font-semibold">Description</TableHead>
            <TableHead className="hidden sm:table-cell w-24 sm:w-28 px-4 py-3 text-center text-foreground font-semibold">Branch</TableHead>
            <TableHead className="w-20 sm:w-36 px-3 sm:px-4 py-3 text-right text-foreground font-semibold">Updated</TableHead>
            <TableHead className="hidden md:table-cell w-28 px-4" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {repos.length === 0
            ? <EmptyState />
            : repos.map((repo, i) => <RepoRow key={repo.id} repo={repo} index={i} />)
          }
        </TableBody>
      </Table>
    </div>
  );
}
