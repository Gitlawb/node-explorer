import { useState, useEffect } from 'react';
import type { TocHeading } from '../../lib/toc';
import { cn } from '../../lib/utils';
import { MicroLabel } from '../ui/MicroLabel';

interface TocRailProps {
  headings: TocHeading[];
}

/**
 * Sticky table-of-contents rail beside rendered markdown, with scroll-spy.
 * Render only when there are enough headings to be useful (caller gates ≥3).
 */
export function TocRail({ headings }: TocRailProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const targets = headings
      .map(h => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Highlight the first visible heading in document order
        const first = headings.find(h => visible.has(h.id));
        if (first) setActiveId(first.id);
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  return (
    <nav
      aria-label="table of contents"
      className="hidden lg:block w-[200px] shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto"
    >
      <MicroLabel className="block mb-3">contents</MicroLabel>
      <ul className="m-0 p-0 list-none space-y-1.5">
        {headings.map(h => (
          <li key={h.id} style={{ paddingLeft: `${Math.max(0, h.level - 1) * 10}px` }}>
            <a
              href={`#${h.id}`}
              className={cn(
                'block text-[11.5px] leading-snug truncate transition-colors',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm',
                activeId === h.id
                  ? 'text-warm-text'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
