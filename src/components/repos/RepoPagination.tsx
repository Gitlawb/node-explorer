import { Dropdown } from '../ui/Dropdown';
import { PER_PAGE_OPTIONS } from '../../lib/constants';
import { cn } from '../../lib/utils';

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

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Page controls for a server-paginated list. */
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
  const pages = totalPages <= 7
    ? range(1, totalPages)
    : page <= 4
      ? [...range(1, 5), 0, totalPages]
      : page >= totalPages - 3
        ? [1, 0, ...range(totalPages - 4, totalPages)]
        : [1, 0, page - 1, page, page + 1, 0, totalPages];

  const step =
    'text-[13px] px-2 py-1 rounded-[var(--radius)] transition-colors ' +
    'disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <nav
      aria-label="pagination"
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-8 pt-4 border-t border-border"
    >
      <p className="m-0 text-[13px] tabular text-muted">
        {windowStart.toLocaleString()}&ndash;{windowEnd.toLocaleString()}
        <span className="text-subtle px-1.5">/</span>
        {totalCount.toLocaleString()} {noun}
      </p>

      <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
        <Dropdown
          label="Per page"
          value={String(perPage)}
          onChange={v => onPerPageChange(Number(v))}
          options={PER_PAGE_OPTIONS.map(n => ({ value: String(n), label: String(n) }))}
          align="end"
        />

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={cn(step, 'text-muted hover:text-foreground')}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="previous page"
          >
            &larr;
          </button>

          {pages.map((p, i) =>
            p === 0 ? (
              <span key={`e${i}`} aria-hidden="true" className="text-[13px] text-subtle px-1">
                &middot;&middot;&middot;
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`page ${p}`}
                className={cn(
                  'relative text-[13px] tabular px-2 py-1 rounded-[var(--radius)] transition-colors',
                  p === page ? 'text-foreground' : 'text-muted hover:text-foreground',
                )}
              >
                {p}
                {p === page && (
                  <span aria-hidden="true" className="absolute inset-x-1 bottom-0 h-[2px] bg-accent" />
                )}
              </button>
            ),
          )}

          <button
            type="button"
            className={cn(step, 'text-muted hover:text-foreground')}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="next page"
          >
            &rarr;
          </button>
        </div>
      </div>
    </nav>
  );
}
