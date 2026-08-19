// Weekly commit counts (oldest → newest), drawn as an engraved trace above a
// ruled baseline. Real measurement, not chrome: the value is in the aria-label
// and the bar heights are the node's own commit dates, bucketed.
//
// Previous revisions filled these bars from `--color-warm` and
// `--color-text-faint`, neither of which is defined by the theme — an invalid
// var with no fallback drops the declaration, so the bars painted black in
// both themes. They are on real tokens now.

interface SparklineProps {
  /** Weekly counts, oldest → newest. null = loading, [] = unavailable. */
  data: number[] | null;
}

const W = 64;
const H = 22;
const GAP = 1.5;
const TOP_PAD = 2;
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
          const h = Math.max(1.5, (count / max) * (H - TOP_PAD - 1));
          const current = i === data.length - 1;
          return (
            <rect
              key={i}
              x={i * slot + GAP / 2}
              y={BASELINE_Y - h}
              width={Math.max(0.75, slot - GAP)}
              height={h}
              fill={current ? 'var(--color-success)' : 'var(--color-accent)'}
              fillOpacity={current ? 1 : 0.55}
            />
          );
        })}
    </svg>
  );
}
