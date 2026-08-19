import { useRef, useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * A single-choice filter.
 *
 * Loose pills made every option carry its own frame, so a three-way choice drew
 * three boxes and the selected one was told apart only by a fill. Here the
 * options share one track and a single indicator slides between them, which is
 * both quieter and a clearer read of "one of these is on".
 *
 * The indicator is one element that lives in the track and is positioned from
 * the active button's measured box, rather than being re-parented into the
 * active button via Motion's `layoutId` as the nav rail does. Both approaches
 * work; this one is used because its correctness is checkable without watching
 * an animation — the written transform and width can be compared against the
 * active button's `offsetLeft` and `offsetWidth` directly — and because it does
 * not depend on Motion's projection surviving the router transition that
 * `setSearchParams` schedules when an option is picked.
 */
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Optional count printed after the label. */
  count?: number;
  /** Optional mark before the label, e.g. a status dot. */
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>());
  const positioned = useRef(false);

  useLayoutEffect(() => {
    const place = () => {
      const track = trackRef.current;
      const indicator = indicatorRef.current;
      const button = buttonRefs.current.get(value);
      if (!track || !indicator || !button) return;

      // Both axes are tracked, not just x: a filter row with several options
      // wraps to a second line on a narrow viewport, and an x-only indicator
      // would then sit on the wrong row.
      const x = button.offsetLeft - track.clientLeft;
      const y = button.offsetTop - track.clientTop;
      // The first placement jumps; later ones slide. Otherwise the indicator
      // animates in from the corner on every mount and page load.
      indicator.style.transition = positioned.current
        ? 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), width 280ms cubic-bezier(0.22, 1, 0.36, 1), height 280ms cubic-bezier(0.22, 1, 0.36, 1)'
        : 'none';
      indicator.style.transform = `translate(${x}px, ${y}px)`;
      indicator.style.width = `${button.offsetWidth}px`;
      indicator.style.height = `${button.offsetHeight}px`;
      positioned.current = true;
    };

    place();

    // Labels reflow when counts change or the font finishes loading, and the
    // track can be narrowed by its container; both move the target box.
    const observer = new ResizeObserver(place);
    if (trackRef.current) observer.observe(trackRef.current);
    for (const button of buttonRefs.current.values()) observer.observe(button);
    return () => observer.disconnect();
  }, [value, options]);

  return (
    <div
      ref={trackRef}
      role="group"
      aria-label={label}
      className={cn(
        'relative inline-flex flex-wrap items-center gap-y-0.5 p-0.5',
        'rounded-[var(--radius-control)] border border-border bg-surface-secondary',
        className,
      )}
    >
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className="absolute left-0 top-0 rounded-[var(--radius-control)] bg-foreground motion-reduce:transition-none"
      />
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={node => {
              if (node) buttonRefs.current.set(option.value, node);
              else buttonRefs.current.delete(option.value);
            }}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'relative inline-flex items-center gap-1.5 px-3 h-7 text-[12.5px] whitespace-nowrap transition-colors',
              'rounded-[var(--radius-control)]',
              'focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
              active ? 'text-background' : 'text-muted hover:text-foreground',
            )}
          >
            {option.icon}
            {option.label}
            {option.count !== undefined && (
              <span className={cn('tabular-nums', active ? 'opacity-70' : 'opacity-60')}>
                {option.count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
