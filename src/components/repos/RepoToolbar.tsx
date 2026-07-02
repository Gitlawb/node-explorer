import type { RepoSort } from '../../lib/api';
import { Pill } from '../ui/Pill';
import { MicroLabel } from '../ui/MicroLabel';

export type ForkFilter = 'all' | 'forks' | 'sources';

interface RepoToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sort: RepoSort;
  onSortChange: (v: RepoSort) => void;
  forkFilter: ForkFilter;
  onForkFilterChange: (v: ForkFilter) => void;
  searchScope: 'server' | 'page';
  loadedCount: number;
}

const SORT_OPTIONS: { value: RepoSort; label: string }[] = [
  { value: 'updated', label: 'recently updated' },
  { value: 'created', label: 'newest' },
  { value: 'oldest', label: 'oldest' },
  { value: 'name', label: 'name' },
  { value: 'stars', label: 'most stars' },
];

const FORK_FILTERS: { value: ForkFilter; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'forks', label: 'forks' },
  { value: 'sources', label: 'sources' },
];

export function RepoToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  forkFilter,
  onForkFilterChange,
  searchScope,
  loadedCount,
}: RepoToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-4">

      {/* Search */}
      <div className="flex-1 max-w-[560px]">
        <MicroLabel className="block mb-1.5">
          <label htmlFor="repo-search">search</label>
        </MicroLabel>
        <input
          id="repo-search"
          type="search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="search repos…"
          autoComplete="off"
          spellCheck={false}
          className="w-full h-9 px-3 text-[13px] bg-transparent border border-border rounded-[2px]
            text-foreground placeholder:text-dim
            focus:outline-none focus-visible:ring-1 focus-visible:ring-warm focus:border-dim
            transition-colors"
        />
        {search && searchScope === 'page' && (
          <p className="m-0 mt-1.5 text-[11px] text-dim">
            searching within this page ({loadedCount} loaded)
          </p>
        )}
      </div>

      <div className="flex items-end gap-4 flex-wrap">
        {/* Sort */}
        <div>
          <MicroLabel className="block mb-1.5">
            <label htmlFor="repo-sort">sort</label>
          </MicroLabel>
          <select
            id="repo-sort"
            value={sort}
            onChange={e => onSortChange(e.target.value as RepoSort)}
            className="select-chevron h-9 pl-3 pr-7 text-[12px] bg-transparent border border-border rounded-[2px]
              text-muted-foreground cursor-pointer
              focus:outline-none focus-visible:ring-1 focus-visible:ring-warm hover:border-dim transition-colors"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Fork filter */}
        <div>
          <MicroLabel className="block mb-1.5" aria-hidden="true">filter</MicroLabel>
          <div role="group" aria-label="filter by fork status" className="flex gap-1.5">
            {FORK_FILTERS.map(f => (
              <Pill
                key={f.value}
                onClick={() => onForkFilterChange(f.value)}
                active={forkFilter === f.value}
                aria-label={`show ${f.label}`}
              >
                {f.label}
              </Pill>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
