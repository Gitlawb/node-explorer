import { cn } from '../../lib/utils';

interface RepoHeroProps {
  totalCount: number;
  page: number;
  perPage: number;
  windowStart: number;
  windowEnd: number;
  refreshing: boolean;
  onRefresh: () => void;
}

function StatCell({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('px-5 py-4', className)}>
      <p
        className="text-[10px] uppercase tracking-[0.12em] font-medium mb-2"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </p>
      <p
        className="text-[24px] font-bold leading-none tabular-nums tracking-[-0.02em]"
        style={{ color: 'var(--color-foreground)' }}
      >
        {value}
      </p>
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={spinning ? 'animate-spin-icon' : ''}
    >
      <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10.5 1.5v4H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RepoHero({ totalCount, page, perPage, windowStart, windowEnd, refreshing, onRefresh }: RepoHeroProps) {
  return (
    <section className="relative pt-6 sm:pt-10 lg:pt-12 pb-0 overflow-hidden">

      {/* Single bounded hero block — Refresh is anchored to its top-right corner */}
      <div className="relative max-w-[580px]">

        {/* Refresh button — top-right corner of the hero block */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="absolute top-0.5 right-0 flex items-center gap-1.5 h-7 px-3 text-[12px] font-medium rounded-md border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed select-none"
          style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--color-foreground)';
            e.currentTarget.style.borderColor = 'var(--color-text-dim)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--color-text-muted)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          <RefreshIcon spinning={refreshing} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>

        {/* Heading — right-padded so it never reaches the absolute Refresh button */}
        <h1
          className="text-[34px] sm:text-[52px] font-extrabold tracking-[-0.04em] leading-[0.92] mb-3 pr-24"
          style={{ color: 'var(--color-foreground)' }}
        >
          Repositories
        </h1>

        {/* Description */}
        <p
          className="text-[13px] sm:text-[14px] leading-[1.65] max-w-[260px] mb-8"
          style={{ color: 'var(--color-text-mid)' }}
        >
          Browse live repositories hosted on this gitlawb node. Clone,
          inspect ownership, and explore code.
        </p>

        {/* Stats row — fills the full bounded block width */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 overflow-hidden rounded-lg border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <StatCell label="Total Repos" value={totalCount > 0 ? totalCount.toLocaleString() : '—'} />
          <StatCell
            label="Page"
            value={String(page)}
            className="border-l border-[var(--color-border)]"
          />
          <StatCell
            label="Per Page"
            value={String(perPage)}
            className="border-t sm:border-t-0 sm:border-l border-[var(--color-border)]"
          />
          <StatCell
            label="Window"
            value={totalCount > 0 ? `${windowStart}–${windowEnd}` : '—'}
            className="border-l border-t sm:border-t-0 border-[var(--color-border)]"
          />
        </div>

      </div>

      {/* Bottom divider */}
      <div
        className="mt-8 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, var(--color-border) 20%, var(--color-border) 80%, transparent)',
        }}
      />

    </section>
  );
}
