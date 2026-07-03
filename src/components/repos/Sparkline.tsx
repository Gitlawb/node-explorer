// Micro bar chart of weekly commit counts (oldest → newest). Single series:
// past weeks in a de-emphasis tone, the current week in the warm accent.
// Decorative at this size — the value lives in the aria-label.

interface SparklineProps {
  /** Weekly counts, oldest → newest. null = loading, [] = unavailable. */
  data: number[] | null;
}

const W = 110;
const H = 28;
const GAP = 2;
const TOP_PAD = 3;
const BASELINE_Y = H - 1;

export function Sparkline({ data }: SparklineProps) {
  const loading = data === null;
  const empty = !loading && (data.length === 0 || data.every(v => v === 0));
  const total = data?.reduce((a, b) => a + b, 0) ?? 0;
  const max = data && data.length > 0 ? Math.max(...data) : 0;
  const slot = data && data.length > 0 ? W / data.length : 0;

  // The node returns at most 30 commits; a sum that reaches the cap means the
  // window's true count was truncated, so report it as a floor.
  const countLabel = total >= 30 ? `${total}+ commits` : `${total} commit${total === 1 ? '' : 's'}`;
  const label = loading
    ? undefined
    : empty
      ? 'no recent commits'
      : `${countLabel} in the last ${data.length} weeks`;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="shrink-0"
    >
      <line
        x1={0}
        y1={BASELINE_Y + 0.5}
        x2={W}
        y2={BASELINE_Y + 0.5}
        stroke="var(--color-border)"
        strokeWidth={1}
      />
      {!loading &&
        data.map((count, i) => {
          if (count === 0) return null;
          const h = Math.max(2, Math.round((count / max) * (H - TOP_PAD - 1)));
          const current = i === data.length - 1;
          return (
            <rect
              key={i}
              x={i * slot + GAP / 2}
              y={BASELINE_Y - h}
              width={slot - GAP}
              height={h}
              rx={1}
              fill={current ? 'var(--color-warm)' : 'var(--color-text-faint)'}
            />
          );
        })}
    </svg>
  );
}
