import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationSummary,
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopover,
  Menu,
  MenuItem,
} from '@heroui/react';
import { PER_PAGE_OPTIONS } from '../../lib/constants';

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

  return (
    <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-6 sm:mt-8">
      <PaginationSummary className="text-[12px] tabular-nums text-muted">
        {windowStart.toLocaleString()}–{windowEnd.toLocaleString()} of {totalCount.toLocaleString()} {noun}
      </PaginationSummary>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted">
          per page
        </span>
        <Select
          selectedKey={String(perPage)}
          onSelectionChange={key => onPerPageChange(Number(key))}
          variant="secondary"
          className="min-w-[70px]"
        >
          <SelectTrigger className="h-7 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectPopover>
            <Menu>
              {PER_PAGE_OPTIONS.map(n => (
                <MenuItem key={n} id={String(n)}>{n}</MenuItem>
              ))}
            </Menu>
          </SelectPopover>
        </Select>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                isDisabled={page <= 1}
                onPress={() => onPageChange(page - 1)}
                aria-label="previous page"
              >
                prev
              </PaginationPrevious>
            </PaginationItem>
            {pages.map((p, i) =>
              p === 0 ? (
                <PaginationItem key={`e${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onPress={() => onPageChange(p)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                isDisabled={page >= totalPages}
                onPress={() => onPageChange(page + 1)}
                aria-label="next page"
              >
                next
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </nav>
  );
}
