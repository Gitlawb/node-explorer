import type { RepoFile } from '../../types/repo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface FileListProps {
  files: RepoFile[];
  onClickEntry?: (entry: RepoFile) => void;
}

function FileIcon({ type }: { type: 'file' | 'dir' }) {
  if (type === 'dir') {
    return (
      <svg width="15" height="15" viewBox="0 0 13 13" fill="none" aria-hidden="true"
        className="flex-shrink-0 text-muted-foreground">
        <path d="M1 3A1 1 0 0 1 2 2h2.414a1 1 0 0 1 .707.293L6.5 3.586A1 1 0 0 0 7.207 4H11a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3z"
          fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="0.9" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 13 13" fill="none" aria-hidden="true"
      className="flex-shrink-0 text-muted-foreground">
      <rect x="1.5" y="1" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="0.9" />
      <path d="M3.5 4.5h5M3.5 7h3.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

export function FileList({ files, onClickEntry }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center py-14 border border-border">
        <p className="m-0 text-[13px] text-muted-foreground">no files</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border min-w-0">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground h-10 px-4 sm:px-6">
              Name
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground h-10 px-4 sm:px-6 text-right w-20 sm:w-24">
              Size
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map(file => (
            <TableRow
              key={file.name}
              onClick={onClickEntry ? () => onClickEntry(file) : undefined}
              className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-100 ${onClickEntry ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <TableCell className="px-4 sm:px-6 py-2.5 sm:py-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="w-[6px] h-[6px] rounded-full flex-shrink-0 bg-status-dot" />
                  <FileIcon type={file.type} />
                  {onClickEntry ? (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onClickEntry(file); }}
                      className="text-[13px] sm:text-[14px] text-foreground text-left cursor-pointer
                        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
                    >
                      {file.name}
                    </button>
                  ) : (
                    <span className="text-[13px] sm:text-[14px] text-foreground">{file.name}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4 sm:px-6 py-2.5 sm:py-3 text-right">
                {file.size && file.size !== '—' ? (
                  <span className="text-[11px] sm:text-[12px] tabular-nums font-mono text-muted-foreground">
                    {file.size}
                  </span>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
