import { PER_PAGE_OPTIONS } from '../../lib/mock-data';

interface RepoPaginationProps {
  page: number;
  totalPages: number;
  perPage: number;
  totalCount: number;
  windowStart: number;
  windowEnd: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (n: number) => void;
}

function NavButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-8 sm:h-10 px-2.5 sm:px-5 text-[12px] sm:text-[14px] font-medium rounded-md border transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed select-none"
      style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
      onMouseEnter={e => {
        const b = e.currentTarget;
        b.style.color = 'var(--color-foreground)';
        b.style.borderColor = 'var(--color-text-dim)';
      }}
      onMouseLeave={e => {
        const b = e.currentTarget;
        b.style.color = 'var(--color-text-muted)';
        b.style.borderColor = 'var(--color-border)';
      }}
    >
      {children}
    </button>
  );
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
}: RepoPaginationProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-8 sm:mt-10">
      <span
        className="text-[13px] sm:text-[15px] font-mono tabular-nums"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {windowStart}–{windowEnd} of {totalCount.toLocaleString()}
      </span>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <span
          className="hidden sm:inline text-[13px] uppercase tracking-[0.06em] font-medium mr-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          per page
        </span>

        <select
          value={perPage}
          onChange={e => onPerPageChange(Number(e.target.value))}
          className="h-8 sm:h-10 px-2 sm:px-3 text-[12px] sm:text-[14px] rounded-md focus:outline-none transition-all duration-150 cursor-pointer appearance-none pr-6 sm:pr-7 bg-transparent border"
          style={{
            color: 'var(--color-text-muted)',
            borderColor: 'var(--color-border)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23888898' stroke-width='1.1' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          {PER_PAGE_OPTIONS.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <NavButton onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          ← prev
        </NavButton>

        <span
          className="text-[12px] sm:text-[15px] tabular-nums px-0.5 sm:px-2 select-none font-mono"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {page} / {totalPages}
        </span>

        <NavButton onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          next →
        </NavButton>
      </div>
    </div>
  );
}
