import { useState } from 'react';
import type { RepoSort } from '../../lib/api';
import { SearchField } from '../register/SearchField';
import { Dropdown } from '../ui/Dropdown';
import { SegmentedControl } from '../ui/SegmentedControl';

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
  /** True when the list is paginated, so the fork filter only sees this page. */
  filterScopedToPage: boolean;
}

const SORT_OPTIONS: { value: RepoSort; label: string }[] = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'created', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name' },
  { value: 'stars', label: 'Most stars' },
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
  filterScopedToPage,
}: RepoToolbarProps) {
  // Local input state: the URL param lags a router transition behind fast
  // typing, so a URL-controlled input drops keystrokes. Local value is the
  // source of truth while the input is focused; external changes (back-nav,
  // deep links) sync in only when it isn't — a stale URL echo of our own
  // keystrokes can then never clobber newer input.
  const [value, setValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    const inputFocused =
      typeof document !== 'undefined' && document.activeElement?.id === 'repo-search';
    if (!inputFocused && search !== value) setValue(search);
  }

  const handleChange = (v: string) => {
    setValue(v);
    onSearchChange(v);
  };

  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex-1 min-w-[240px] max-w-[460px]">
        <SearchField
          id="repo-search"
          label="Search repositories"
          value={value}
          onChange={handleChange}
          placeholder="Search by name or owner…"
          className="w-full"
        />
        {search && searchScope === 'page' && (
          <p className="m-0 mt-1.5 text-[11px] text-muted">
            searching within this page ({loadedCount} loaded)
          </p>
        )}
      </div>

      <Dropdown
        id="repo-sort"
        label="Sort"
        options={SORT_OPTIONS}
        value={sort}
        onChange={onSortChange}
      />

      {/* Fork filter. It runs over the repos already fetched, not the whole
          node, so while the list is paginated the scope is stated — otherwise
          an empty result reads as "this node has no forks" when only the
          current page was ever examined. */}
      <div className="flex flex-col gap-1">
        <SegmentedControl
          options={FORK_FILTERS}
          value={forkFilter}
          onChange={onForkFilterChange}
          label="filter by fork status"
        />
        {forkFilter !== 'all' && filterScopedToPage && (
          <p className="m-0 text-[11px] text-muted">
            within this page ({loadedCount} loaded)
          </p>
        )}
      </div>
    </div>
  );
}
