import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { NumberTicker } from '../ui/number-ticker';

/**
 * Shared layout primitives, in forge convention.
 *
 * A bordered box with a subtle header strip, a labelled field, a section
 * heading with an action on the right — the vocabulary this audience already
 * reads on GitHub, GitLab, and Sourcegraph. Craft goes into spacing, density,
 * and states rather than into a distinctive look.
 */

/**
 * A bordered container. Use sparingly — it is not the default.
 *
 * A list of rows does not need one: hairline separators between rows already
 * group them, and adding an outer border on top turns the region into a panel
 * dropped on the page. Reserve this for content that genuinely needs to be
 * lifted off the ground (a README body, an editor surface), and reach for
 * `Section` everywhere else.
 *
 * Defaults to a div: the previous `section` default nested a `<section>`
 * directly inside `Section`'s own `<section>`, which is invalid grouping.
 */
export function Plate({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
}) {
  return (
    <Tag className={cn('border border-border rounded-[var(--radius)] bg-surface', className)}>
      {children}
    </Tag>
  );
}

/**
 * An unboxed region: a small heading, an optional action, and a hairline.
 * This is the default container — the GitHub sidebar pattern.
 */
export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border-t border-border pt-4', className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="m-0 text-[14px] font-semibold text-foreground">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** The subtle header strip at the top of a box. */
export function BoxHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2.5',
        'bg-surface-secondary border-b border-border rounded-t-[var(--radius)]',
        className,
      )}
    >
      <h3 className="m-0 text-[13px] font-semibold text-foreground">{title}</h3>
      {action}
    </div>
  );
}

/** A labelled value. */
export function Field({
  label,
  children,
  className,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[12px] text-muted mb-0.5">{label}</div>
      <div
        className={cn(
          'font-mono text-foreground tabular truncate',
          wide ? 'text-[13px]' : 'text-[12px]',
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** A page section heading with an optional action on the right. */
export function SectionRule({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-border pb-2 mb-4',
        className,
      )}
    >
      <h2 className="m-0 text-[16px] font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

/** A footer region inside a box, separated by a rule. */
export function Counterfoil({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('border-t border-border pt-4 mt-4', className)}>{children}</div>;
}

/**
 * A status label. Uses the colours this audience reads without a legend:
 * green for verified, grey for absent, amber for attention.
 */
export function Seal({
  label,
  title,
  tone = 'success',
  className,
}: {
  label: string;
  title?: string;
  tone?: 'success' | 'neutral' | 'attention' | 'danger';
  className?: string;
}) {
  const tones = {
    success: 'border-success/40 text-success bg-success/10',
    neutral: 'border-border text-muted',
    attention: 'border-attention/40 text-attention bg-attention/10',
    danger: 'border-danger/40 text-danger bg-danger/10',
  } as const;

  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-[2px] text-[12px] font-medium',
        tones[tone],
        className,
      )}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0">
        <circle cx="4" cy="4" r="4" fill="currentColor" />
      </svg>
      {label}
    </span>
  );
}

/**
 * Headline counts, set inline and unboxed.
 *
 * Four bordered cells is the hero-metric template; GitHub states counts as
 * plain figures in a row and lets whitespace separate them.
 */
export function Tally({
  entries,
  className,
}: {
  entries: { label: string; value: ReactNode; count?: number; to?: string }[];
  className?: string;
}) {
  return (
    <dl className={cn('flex flex-wrap gap-x-10 gap-y-4 m-0', className)}>
      {entries.map((e, i) => (
        <div key={e.label} className="min-w-0">
          <dd className="m-0 text-[20px] font-semibold tabular leading-none text-foreground">
            {typeof e.count === 'number' ? (
              <NumberTicker value={e.count} delay={0.05 + i * 0.05} className="text-foreground" />
            ) : (
              e.value
            )}
          </dd>
          <dt className="mt-1 text-[12px] text-muted">{e.label}</dt>
        </div>
      ))}
    </dl>
  );
}
