import { PER_PAGE_OPTIONS } from '../../lib/constants';
import { Pill } from '../ui/Pill';
import { MicroLabel } from '../ui/MicroLabel';

interface RepoPaginationProps {
  page: number;
  totalPages: number;
  perPage: number;
  totalCount: number;
  windowStart: number;
  windowEnd: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (n: number) => void;
  noun?: string;
}

export function RepoPagination({
  page,
  totalPages,
  perPage,
  totalCount,
  windowStart,
  windowEnd,
  onPageChange,
  onPerPageChange,
  noun = 'repos',
}: RepoPaginationProps) {
  return (
    <nav
      aria-label="pagination"
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-6 sm:mt-8"
    >
      <span className="text-[12px] tabular-nums text-muted-foreground">
        {windowStart.toLocaleString()}–{windowEnd.toLocaleString()} of {totalCount.toLocaleString()} {noun}
      </span>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <MicroLabel>
          <label htmlFor="per-page">per page</label>
        </MicroLabel>
        <select
          id="per-page"
          value={perPage}
          onChange={e => onPerPageChange(Number(e.target.value))}
          className="select-chevron h-7 pl-2.5 pr-6 text-[11px] bg-transparent border border-border rounded-[2px]
            text-muted-foreground cursor-pointer
            focus:outline-none focus-visible:ring-1 focus-visible:ring-warm hover:border-dim transition-colors"
        >
          {PER_PAGE_OPTIONS.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <Pill onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="previous page">
          ← prev
        </Pill>

        <span className="text-[12px] tabular-nums text-muted-foreground select-none">
          {page.toLocaleString()} / {totalPages.toLocaleString()}
        </span>

        <Pill onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="next page">
          next →
        </Pill>
      </div>
    </nav>
  );
}
