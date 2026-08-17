import { DotPattern } from '../ui/dot-pattern';
import { AuroraText } from '../ui/aurora-text';
import { NumberTicker } from '../ui/number-ticker';

/* Aurora ramp, read from theme tokens rather than fixed hexes: this text is
   painted through background-clip with a transparent colour, so a hardcoded
   white ramp is invisible on the light theme's white ground. */
const AURORA = [
  'var(--ramp-1)',
  'var(--ramp-2)',
  'var(--ramp-3)',
  'var(--ramp-4)',
];

interface RepoHeroProps {
  totalCount: number;
  page: number;
  perPage: number;
  windowStart: number;
  windowEnd: number;
  title?: string;
  /** The word AuroraText picks out of the title. Defaults to the last word. */
  accent?: string;
  description?: React.ReactNode;
  countNoun?: string;
  cells?: { label: string; value: string }[];
  seed?: string;
}

/**
 * Listing page header.
 *
 * Carries the overview's language — patterned ground, an accented headline,
 * live counts — at a smaller scale, because a listing page's job is to get out
 * of the way of the list underneath it.
 */
export function RepoHero({
  totalCount,
  title = 'Repositories',
  accent,
  description,
  countNoun = 'repositories',
  cells,
}: RepoHeroProps) {
  const words = title.trim().split(' ');
  const lead = accent ? title.replace(accent, '').trim() : words.slice(0, -1).join(' ');
  const tail = accent ?? words[words.length - 1];

  return (
    <header className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-12 pb-8">
      <DotPattern
        width={24}
        height={24}
        cr={1}
        className="absolute inset-0 h-full w-full fill-border/50
          [mask-image:radial-gradient(420px_circle_at_20%_0%,white,transparent)]"
      />

      <div className="relative">
        <h1 className="m-0 text-[32px] sm:text-[40px] font-semibold tracking-tight leading-[1.1] text-foreground">
          {lead && <>{lead} </>}
          <AuroraText speed={1.4} colors={AURORA}>{tail}</AuroraText>
        </h1>

        {description ? (
          <div className="text-[15px] text-muted mt-3 max-w-[68ch]">{description}</div>
        ) : (
          <p className="m-0 text-[15px] text-muted mt-3 max-w-[68ch]">
            <NumberTicker value={totalCount} className="font-semibold text-foreground" />{' '}
            {countNoun} on this node, each clonable over{' '}
            <code className="font-mono text-[14px] text-accent">gitlawb://</code> and certified per
            ref.
          </p>
        )}

        {cells && cells.length > 0 && (
          <dl className="flex flex-wrap items-baseline gap-x-7 gap-y-2 mt-5 m-0">
            {cells.map(c => (
              <div key={c.label} className="flex items-baseline gap-1.5">
                <dd className="m-0 text-[15px] font-semibold tabular text-foreground">{c.value}</dd>
                <dt className="text-[13px] text-muted">{c.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}
