interface RepoHeroProps {
  totalCount: number;
  page: number;
  perPage: number;
  windowStart: number;
  windowEnd: number;
  title?: string;
  description?: React.ReactNode;
  countNoun?: string;
  cells?: { label: string; value: string }[];
}

export function RepoHero({
  totalCount,
  title = 'repositories',
  description,
  countNoun = 'repos',
  cells,
}: RepoHeroProps) {
  return (
    <div className="flex items-start justify-between gap-4 pt-8 pb-6">
      <div className="min-w-0">
        <h1 className="text-[28px] sm:text-[34px] font-bold lowercase tracking-tight text-foreground m-0">
          {title}
        </h1>
        {description ? (
          <div className="text-[13px] leading-[1.7] text-muted mt-1 max-w-[560px]">{description}</div>
        ) : (
          <p className="m-0 text-[13px] text-muted mt-1 max-w-[560px]">
            Browse {totalCount.toLocaleString()} {countNoun} hosted on this node.
          </p>
        )}
        {cells && (
          <div className="flex items-center gap-4 mt-2">
            {cells.map(c => (
              <span key={c.label} className="text-[11px] text-muted tabular-nums">
                <span className="font-medium text-foreground">{c.value}</span> {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}